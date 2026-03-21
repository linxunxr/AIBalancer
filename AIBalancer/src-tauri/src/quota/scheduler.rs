use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;
use chrono::{Utc, DateTime, Duration};
use serde::{Deserialize, Serialize};

use crate::database::models::QuotaDimension;
use super::models::RefreshSchedule;

/// 刷新策略枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ResetStrategy {
    Hard,     // 硬性重置：完全重置到总配额
    Soft,     // 软性重置：累积未使用的余额
    Dynamic,  // 动态重置：根据历史使用调整
}

/// 刷新调度器
pub struct RefreshScheduler<'a> {
    conn: &'a Connection,
}

impl<'a> RefreshScheduler<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    /// 获取需要刷新的维度
    pub fn get_dimensions_due_for_refresh(&self) -> Result<Vec<QuotaDimension>, String> {
        let now = Utc::now().to_rfc3339();

        let mut stmt = self.conn.prepare(
            "SELECT id, group_id, dimension_name, dimension_type, unit,
                    total_quota, current_balance, reserved_balance,
                    time_period, reset_time, reset_day, timezone,
                    last_reset_at, next_reset_at, auto_reset,
                    parent_dimension_id, nesting_level,
                    warning_threshold, critical_threshold, created_at, updated_at
             FROM quota_dimensions
             WHERE auto_reset = 1
               AND time_period != 'permanent'
               AND next_reset_at IS NOT NULL
               AND next_reset_at <= ?1"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map(
            rusqlite::params![&now],
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

    /// 执行维度刷新
    pub fn refresh_dimension(&self, dimension_id: &str, strategy: ResetStrategy) -> Result<QuotaDimension, String> {
        let now = Utc::now();

        // 获取维度
        let dimension = self.get_dimension_by_id(dimension_id)?;

        // 根据策略计算新余额
        let new_balance = match strategy {
            ResetStrategy::Hard => {
                // 硬性重置：完全重置到总配额
                dimension.total_quota
            }
            ResetStrategy::Soft => {
                // 软性重置：累积未使用的余额
                dimension.current_balance + dimension.total_quota
            }
            ResetStrategy::Dynamic => {
                // 动态重置：根据历史使用调整（简化实现，这里使用硬性重置）
                // TODO: 实现基于历史数据的动态调整
                dimension.total_quota
            }
        };

        // 计算下次重置时间
        let next_reset = self.calculate_next_reset_time(&dimension, &now);

        // 更新数据库
        self.conn.execute(
            "UPDATE quota_dimensions
             SET current_balance = ?1,
                 reserved_balance = 0,
                 last_reset_at = ?2,
                 next_reset_at = ?3,
                 updated_at = ?4
             WHERE id = ?5",
            rusqlite::params![
                new_balance,
                now.to_rfc3339(),
                next_reset.as_ref().map(|t| t.to_rfc3339()),
                now.to_rfc3339(),
                dimension_id,
            ],
        ).map_err(|e| format!("更新维度失败: {}", e))?;

        // 返回更新后的维度
        self.get_dimension_by_id(dimension_id)
    }

    /// 计算下次重置时间
    fn calculate_next_reset_time(&self, dimension: &QuotaDimension, now: &DateTime<Utc>) -> Option<DateTime<Utc>> {
        match dimension.time_period.as_deref() {
            Some("5h") => Some(*now + Duration::hours(5)),
            Some("7d") => Some(*now + Duration::days(7)),
            Some("30d") => Some(*now + Duration::days(30)),
            _ => None,
        }
    }

    /// 获取刷新调度信息
    pub fn get_refresh_schedules(&self, account_id: &str) -> Result<Vec<RefreshSchedule>, String> {
        // 获取账户的所有维度
        let mut stmt = self.conn.prepare(
            "SELECT d.id, d.dimension_name, d.time_period, d.next_reset_at, d.auto_reset
             FROM quota_dimensions d
             JOIN quota_strategy_groups g ON d.group_id = g.id
             WHERE g.account_id = ?1 AND d.time_period != 'permanent'"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map(
            rusqlite::params![account_id],
            |row| {
                let time_period: String = row.get(2)?;
                let reset_strategy = match time_period.as_str() {
                    "5h" => "hard",
                    "7d" => "hard",
                    "30d" => "soft",
                    _ => "hard",
                };
                Ok(RefreshSchedule {
                    dimension_id: row.get(0)?,
                    dimension_name: row.get(1)?,
                    time_period,
                    next_reset_at: row.get(3)?,
                    auto_reset: row.get::<_, i32>(4)? == 1,
                    reset_strategy: reset_strategy.to_string(),
                })
            },
        ).map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| e.to_string())?);
        }
        Ok(result)
    }

    /// 获取维度
    fn get_dimension_by_id(&self, dimension_id: &str) -> Result<QuotaDimension, String> {
        self.conn.query_row(
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
}

/// 刷新维度命令
#[tauri::command]
pub fn refresh_dimension_now(
    db: State<Mutex<Connection>>,
    dimension_id: String,
    reset_strategy: Option<String>,
) -> Result<QuotaDimension, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    
    let strategy = match reset_strategy.as_deref() {
        Some("soft") => ResetStrategy::Soft,
        Some("dynamic") => ResetStrategy::Dynamic,
        _ => ResetStrategy::Hard,
    };

    let scheduler = RefreshScheduler::new(&db);
    scheduler.refresh_dimension(&dimension_id, strategy)
}

/// 获取刷新调度命令
#[tauri::command]
pub fn get_refresh_schedule(
    db: State<Mutex<Connection>>,
    account_id: String,
) -> Result<Vec<RefreshSchedule>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let scheduler = RefreshScheduler::new(&db);
    scheduler.get_refresh_schedules(&account_id)
}
