use rusqlite::Connection;
use chrono::Utc;
use uuid::Uuid;

use crate::database::models::{
    QuotaDimension, DimensionRelation,
    QuotaAvailabilityResult, DimensionAvailabilityResult,
    DeductionResult, DimensionDeductionInfo,
};

/// 检查配额可用性
pub fn check_quota_availability(
    conn: &Connection,
    account_id: &str,
    estimated_usage: f64,
    _unit: &str,
) -> Result<QuotaAvailabilityResult, String> {
    // 获取账户的所有活跃策略组
    let mut stmt = conn.prepare(
        "SELECT id FROM quota_strategy_groups WHERE account_id = ?1 AND is_active = 1"
    ).map_err(|e| e.to_string())?;

    let groups: Vec<String> = stmt.query_map(
        rusqlite::params![account_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    if groups.is_empty() {
        return Ok(QuotaAvailabilityResult {
            is_available: false,
            total_available: 0.0,
            dimension_results: vec![],
            blocking_reasons: vec!["账户没有配置配额策略".to_string()],
        });
    }

    // 获取所有维度
    let mut all_dimensions = Vec::new();
    for group_id in &groups {
        let dims = get_dimensions_by_group(conn, group_id)?;
        all_dimensions.extend(dims);
    }

    if all_dimensions.is_empty() {
        return Ok(QuotaAvailabilityResult {
            is_available: false,
            total_available: 0.0,
            dimension_results: vec![],
            blocking_reasons: vec!["账户没有配置配额维度".to_string()],
        });
    }

    // 检查每个维度的可用性
    let mut dimension_results = Vec::new();
    let mut blocking_reasons = Vec::new();
    let mut total_available = 0.0;

    for dim in &all_dimensions {
        let available = (dim.current_balance - dim.reserved_balance).max(0.0);
        let is_sufficient = available >= estimated_usage;
        let deficit = if is_sufficient { 0.0 } else { estimated_usage - available };

        total_available += available;

        if !is_sufficient {
            blocking_reasons.push(format!(
                "维度 '{}' 余额不足: 需要 {}, 可用 {}",
                dim.dimension_name, estimated_usage, available
            ));
        }

        dimension_results.push(DimensionAvailabilityResult {
            dimension_id: dim.id.clone(),
            dimension_name: dim.dimension_name.clone(),
            available_balance: available,
            is_sufficient,
            deficit,
        });
    }

    // 检查维度关联关系
    let relations = get_all_relations_for_dimensions(conn, &all_dimensions.iter().map(|d| d.id.as_str()).collect::<Vec<_>>())?;

    for relation in &relations {
        if relation.require_both_available {
            let parent_dim = all_dimensions.iter().find(|d| d.id == relation.parent_dimension_id);
            let child_dim = all_dimensions.iter().find(|d| d.id == relation.child_dimension_id);

            if let (Some(parent), Some(child)) = (parent_dim, child_dim) {
                let parent_available = (parent.current_balance - parent.reserved_balance).max(0.0);
                let child_available = (child.current_balance - child.reserved_balance).max(0.0);

                if parent_available < estimated_usage || child_available < estimated_usage {
                    if !blocking_reasons.iter().any(|r| r.contains(&parent.dimension_name) || r.contains(&child.dimension_name)) {
                        blocking_reasons.push(format!(
                            "关联维度 '{}' 和 '{}' 需要同时有足够余额",
                            parent.dimension_name, child.dimension_name
                        ));
                    }
                }
            }
        }
    }

    let is_available = blocking_reasons.is_empty();

    Ok(QuotaAvailabilityResult {
        is_available,
        total_available,
        dimension_results,
        blocking_reasons,
    })
}

/// 扣减管理器
pub struct DeductionManager<'a> {
    conn: &'a Connection,
}

impl<'a> DeductionManager<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    /// 执行扣减事务
    pub fn execute_deduction(
        &mut self,
        account_id: &str,
        usage_amount: f64,
        unit: &str,
        operation_type: &str,
        metadata: &str,
    ) -> Result<DeductionResult, String> {
        // 1. 检查配额可用性
        let availability = check_quota_availability(self.conn, account_id, usage_amount, unit)?;

        if !availability.is_available {
            return Ok(DeductionResult {
                success: false,
                transaction_id: String::new(),
                total_deducted: 0.0,
                dimension_deductions: vec![],
                error_message: Some(availability.blocking_reasons.join("; ")),
            });
        }

        // 2. 开始事务
        let transaction_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        // 创建事务记录
        self.conn.execute(
            "INSERT INTO deduction_transactions (transaction_id, account_id, operation_type, total_usage, usage_unit, status, started_at, metadata)
             VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6, ?7)",
            rusqlite::params![&transaction_id, account_id, operation_type, usage_amount, unit, &now, metadata],
        ).map_err(|e| format!("创建事务记录失败: {}", e))?;

        // 3. 执行维度扣减
        let mut dimension_deductions = Vec::new();
        let mut all_success = true;
        let mut error_message = None;

        for dim_result in &availability.dimension_results {
            if !dim_result.is_sufficient {
                continue;
            }

            // 获取维度当前余额
            let dimension = get_dimension_by_id(self.conn, &dim_result.dimension_id)?;

            let balance_before = dimension.current_balance;
            let balance_after = (balance_before - usage_amount).max(0.0);
            let deduction_amount = balance_before - balance_after;

            // 创建维度扣减记录
            let deduction_id = Uuid::new_v4().to_string();
            self.conn.execute(
                "INSERT INTO dimension_deductions (id, transaction_id, dimension_id, deduction_amount, balance_before, balance_after, deduction_status, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending', ?7)",
                rusqlite::params![&deduction_id, &transaction_id, &dim_result.dimension_id, deduction_amount, balance_before, balance_after, &now],
            ).map_err(|e| format!("创建扣减记录失败: {}", e))?;

            // 更新维度余额
            let updated = self.conn.execute(
                "UPDATE quota_dimensions SET current_balance = ?1, updated_at = ?2 WHERE id = ?3",
                rusqlite::params![balance_after, &now, &dim_result.dimension_id],
            );

            if let Err(e) = updated {
                all_success = false;
                error_message = Some(format!("更新维度余额失败: {}", e));
                break;
            }

            dimension_deductions.push(DimensionDeductionInfo {
                dimension_id: dim_result.dimension_id.clone(),
                dimension_name: dim_result.dimension_name.clone(),
                deducted_amount: deduction_amount,
                balance_before,
                balance_after,
            });
        }

        // 4. 提交或回滚事务
        if all_success {
            // 提交事务
            let commit_now = Utc::now().to_rfc3339();
            self.conn.execute(
                "UPDATE deduction_transactions SET status = 'committed', committed_at = ?1 WHERE transaction_id = ?2",
                rusqlite::params![&commit_now, &transaction_id],
            ).map_err(|e| format!("提交事务失败: {}", e))?;

            // 更新维度扣减状态
            self.conn.execute(
                "UPDATE dimension_deductions SET deduction_status = 'committed' WHERE transaction_id = ?1",
                rusqlite::params![&transaction_id],
            ).map_err(|e| format!("更新扣减状态失败: {}", e))?;

            Ok(DeductionResult {
                success: true,
                transaction_id,
                total_deducted: usage_amount,
                dimension_deductions,
                error_message: None,
            })
        } else {
            // 回滚事务
            let rollback_now = Utc::now().to_rfc3339();
            self.conn.execute(
                "UPDATE deduction_transactions SET status = 'rolled_back', rolled_back_at = ?1, error_message = ?2 WHERE transaction_id = ?3",
                rusqlite::params![&rollback_now, &error_message, &transaction_id],
            ).map_err(|e| format!("回滚事务失败: {}", e))?;

            // 恢复维度余额
            for deduction in &dimension_deductions {
                self.conn.execute(
                    "UPDATE quota_dimensions SET current_balance = ?1, updated_at = ?2 WHERE id = ?3",
                    rusqlite::params![deduction.balance_before, &rollback_now, &deduction.dimension_id],
                ).ok();
            }

            Ok(DeductionResult {
                success: false,
                transaction_id,
                total_deducted: 0.0,
                dimension_deductions: vec![],
                error_message,
            })
        }
    }
}

// ==================== 辅助函数 ====================

fn get_dimensions_by_group(conn: &Connection, group_id: &str) -> Result<Vec<QuotaDimension>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, group_id, dimension_name, dimension_type, unit,
                total_quota, current_balance, reserved_balance,
                time_period, reset_time, reset_day, timezone,
                last_reset_at, next_reset_at, auto_reset,
                parent_dimension_id, nesting_level,
                warning_threshold, critical_threshold, created_at, updated_at
         FROM quota_dimensions WHERE group_id = ?1 ORDER BY nesting_level, created_at"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(
        rusqlite::params![group_id],
        |row| Ok(QuotaDimension {
            id: row.get(0)?,
            group_id: row.get(1)?,
            dimension_name: row.get(2)?,
            dimension_type: row.get(3)?,
            unit: row.get(4)?,
            total_quota: row.get(5)?,
            current_balance: row.get(6)?,
            reserved_balance: row.get(7)?,
            time_period: row.get(8)?,
            reset_time: row.get(9)?,
            reset_day: row.get(10)?,
            timezone: row.get(11)?,
            last_reset_at: row.get(12)?,
            next_reset_at: row.get(13)?,
            auto_reset: row.get::<_, i32>(14)? == 1,
            parent_dimension_id: row.get(15)?,
            nesting_level: row.get(16)?,
            warning_threshold: row.get(17)?,
            critical_threshold: row.get(18)?,
            created_at: row.get(19)?,
            updated_at: row.get(20)?,
        }),
    ).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

fn get_dimension_by_id(conn: &Connection, dimension_id: &str) -> Result<QuotaDimension, String> {
    conn.query_row(
        "SELECT id, group_id, dimension_name, dimension_type, unit,
                total_quota, current_balance, reserved_balance,
                time_period, reset_time, reset_day, timezone,
                last_reset_at, next_reset_at, auto_reset,
                parent_dimension_id, nesting_level,
                warning_threshold, critical_threshold, created_at, updated_at
         FROM quota_dimensions WHERE id = ?1",
        rusqlite::params![dimension_id],
        |row| Ok(QuotaDimension {
            id: row.get(0)?,
            group_id: row.get(1)?,
            dimension_name: row.get(2)?,
            dimension_type: row.get(3)?,
            unit: row.get(4)?,
            total_quota: row.get(5)?,
            current_balance: row.get(6)?,
            reserved_balance: row.get(7)?,
            time_period: row.get(8)?,
            reset_time: row.get(9)?,
            reset_day: row.get(10)?,
            timezone: row.get(11)?,
            last_reset_at: row.get(12)?,
            next_reset_at: row.get(13)?,
            auto_reset: row.get::<_, i32>(14)? == 1,
            parent_dimension_id: row.get(15)?,
            nesting_level: row.get(16)?,
            warning_threshold: row.get(17)?,
            critical_threshold: row.get(18)?,
            created_at: row.get(19)?,
            updated_at: row.get(20)?,
        }),
    ).map_err(|e| e.to_string())
}

fn get_all_relations_for_dimensions(conn: &Connection, dimension_ids: &[&str]) -> Result<Vec<DimensionRelation>, String> {
    if dimension_ids.is_empty() {
        return Ok(vec![]);
    }

    let placeholders = dimension_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!(
        "SELECT id, parent_dimension_id, child_dimension_id, relation_type, deduction_ratio, sync_deduction, require_both_available, created_at
         FROM dimension_relations WHERE parent_dimension_id IN ({}) OR child_dimension_id IN ({})",
        placeholders, placeholders
    );

    let params: Vec<&dyn rusqlite::ToSql> = dimension_ids.iter().map(|id| id as &dyn rusqlite::ToSql).collect();
    let all_params: Vec<&dyn rusqlite::ToSql> = params.iter().chain(params.iter()).copied().collect();

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(all_params.as_slice(), |row| Ok(DimensionRelation {
        id: row.get(0)?,
        parent_dimension_id: row.get(1)?,
        child_dimension_id: row.get(2)?,
        relation_type: row.get(3)?,
        deduction_ratio: row.get(4)?,
        sync_deduction: row.get::<_, i32>(5)? == 1,
        require_both_available: row.get::<_, i32>(6)? == 1,
        created_at: row.get(7)?,
    })).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}
