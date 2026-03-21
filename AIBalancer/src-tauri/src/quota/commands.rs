use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;
use chrono::Utc;
use uuid::Uuid;

use crate::database::models::{
    QuotaStrategyGroup, QuotaDimension, DimensionRelation,
    QuotaAvailabilityResult, DeductionResult, DimensionDeductionInfo,
};
use super::models::*;
use super::deduction::{DeductionManager, check_quota_availability};

// ==================== 策略组管理命令 ====================

/// 创建策略组
#[tauri::command]
pub fn create_quota_strategy_group(
    db: State<Mutex<Connection>>,
    account_id: String,
    name: String,
    strategy_type: Option<String>,
    priority: Option<i32>,
) -> Result<QuotaStrategyGroup, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    let strategy_type = strategy_type.unwrap_or_else(|| "single".to_string());
    let priority = priority.unwrap_or(0);

    db.execute(
        "INSERT INTO quota_strategy_groups (id, account_id, name, strategy_type, is_active, priority, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?7)",
        rusqlite::params![&id, &account_id, &name, &strategy_type, priority, &now, &now],
    ).map_err(|e| e.to_string())?;

    Ok(QuotaStrategyGroup {
        id,
        account_id,
        name,
        strategy_type,
        is_active: true,
        priority,
        created_at: now.clone(),
        updated_at: now,
    })
}

/// 获取账户的所有策略组
#[tauri::command]
pub fn get_quota_strategy_groups(
    db: State<Mutex<Connection>>,
    account_id: String,
) -> Result<Vec<QuotaStrategyGroup>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db.prepare(
        "SELECT id, account_id, name, strategy_type, is_active, priority, created_at, updated_at
         FROM quota_strategy_groups WHERE account_id = ?1 ORDER BY priority DESC"
    ).map_err(|e| e.to_string())?;

    let groups = stmt.query_map(
        rusqlite::params![&account_id],
        |row| Ok(QuotaStrategyGroup {
            id: row.get(0)?,
            account_id: row.get(1)?,
            name: row.get(2)?,
            strategy_type: row.get(3)?,
            is_active: row.get::<_, i32>(4)? == 1,
            priority: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        }),
    ).map_err(|e| e.to_string())?;

    groups.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

/// 更新策略组
#[tauri::command]
pub fn update_quota_strategy_group(
    db: State<Mutex<Connection>>,
    id: String,
    name: Option<String>,
    strategy_type: Option<String>,
    is_active: Option<bool>,
    priority: Option<i32>,
) -> Result<QuotaStrategyGroup, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    // 先获取现有数据
    let existing: QuotaStrategyGroup = db.query_row(
        "SELECT id, account_id, name, strategy_type, is_active, priority, created_at, updated_at
         FROM quota_strategy_groups WHERE id = ?1",
        rusqlite::params![&id],
        |row| Ok(QuotaStrategyGroup {
            id: row.get(0)?,
            account_id: row.get(1)?,
            name: row.get(2)?,
            strategy_type: row.get(3)?,
            is_active: row.get::<_, i32>(4)? == 1,
            priority: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        }),
    ).map_err(|e| e.to_string())?;

    let updated = QuotaStrategyGroup {
        id: existing.id.clone(),
        account_id: existing.account_id,
        name: name.unwrap_or(existing.name),
        strategy_type: strategy_type.unwrap_or(existing.strategy_type),
        is_active: is_active.unwrap_or(existing.is_active),
        priority: priority.unwrap_or(existing.priority),
        created_at: existing.created_at,
        updated_at: now.clone(),
    };

    db.execute(
        "UPDATE quota_strategy_groups SET name = ?1, strategy_type = ?2, is_active = ?3, priority = ?4, updated_at = ?5 WHERE id = ?6",
        rusqlite::params![
            &updated.name,
            &updated.strategy_type,
            if updated.is_active { 1 } else { 0 },
            updated.priority,
            &now,
            &id,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(updated)
}

/// 删除策略组
#[tauri::command]
pub fn delete_quota_strategy_group(
    db: State<Mutex<Connection>>,
    id: String,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;

    // 先删除关联的维度
    db.execute(
        "DELETE FROM quota_dimensions WHERE group_id = ?1",
        rusqlite::params![&id],
    ).map_err(|e| e.to_string())?;

    // 删除策略组
    db.execute(
        "DELETE FROM quota_strategy_groups WHERE id = ?1",
        rusqlite::params![&id],
    ).map_err(|e| e.to_string())?;

    Ok(true)
}

// ==================== 维度管理命令 ====================

/// 创建维度
#[tauri::command]
pub fn create_quota_dimension(
    db: State<Mutex<Connection>>,
    group_id: String,
    dimension_name: String,
    dimension_type: Option<String>,
    unit: Option<String>,
    total_quota: f64,
    time_period: Option<String>,
    reset_time: Option<String>,
    reset_day: Option<i32>,
    auto_reset: Option<bool>,
    parent_dimension_id: Option<String>,
    warning_threshold: Option<f64>,
    critical_threshold: Option<f64>,
) -> Result<QuotaDimension, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    let dimension_type = dimension_type.unwrap_or_else(|| "permanent".to_string());
    let unit = unit.unwrap_or_else(|| "tokens".to_string());
    let time_period = time_period.unwrap_or_else(|| "permanent".to_string());
    let auto_reset = auto_reset.unwrap_or(true);

    // 计算嵌套层级
    let nesting_level = if let Some(ref parent_id) = parent_dimension_id {
        let parent_level: i32 = db.query_row(
            "SELECT nesting_level FROM quota_dimensions WHERE id = ?1",
            rusqlite::params![parent_id],
            |row| row.get(0),
        ).unwrap_or(0);
        parent_level + 1
    } else {
        0
    };

    db.execute(
        "INSERT INTO quota_dimensions (
            id, group_id, dimension_name, dimension_type, unit,
            total_quota, current_balance, reserved_balance,
            time_period, reset_time, reset_day, timezone,
            auto_reset, parent_dimension_id, nesting_level,
            warning_threshold, critical_threshold, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, ?8, ?9, ?10, 'Asia/Shanghai', ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
        rusqlite::params![
            &id, &group_id, &dimension_name, &dimension_type, &unit,
            total_quota, total_quota, &time_period,
            reset_time.as_ref(), reset_day,
            if auto_reset { 1 } else { 0 },
            parent_dimension_id.as_ref(),
            nesting_level,
            warning_threshold, critical_threshold,
            &now, &now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(QuotaDimension {
        id,
        group_id,
        dimension_name,
        dimension_type,
        unit,
        total_quota,
        current_balance: total_quota,
        reserved_balance: 0.0,
        time_period: Some(time_period),
        reset_time,
        reset_day,
        timezone: "Asia/Shanghai".to_string(),
        last_reset_at: None,
        next_reset_at: None,
        auto_reset,
        parent_dimension_id,
        nesting_level,
        warning_threshold,
        critical_threshold,
        created_at: now.clone(),
        updated_at: now,
    })
}

/// 获取策略组的所有维度
#[tauri::command]
pub fn get_quota_dimensions(
    db: State<Mutex<Connection>>,
    group_id: String,
) -> Result<Vec<QuotaDimension>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db.prepare(
        "SELECT id, group_id, dimension_name, dimension_type, unit,
                total_quota, current_balance, reserved_balance,
                time_period, reset_time, reset_day, timezone,
                last_reset_at, next_reset_at, auto_reset,
                parent_dimension_id, nesting_level,
                warning_threshold, critical_threshold, created_at, updated_at
         FROM quota_dimensions WHERE group_id = ?1 ORDER BY nesting_level, created_at"
    ).map_err(|e| e.to_string())?;

    let dimensions = stmt.query_map(
        rusqlite::params![&group_id],
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

    dimensions.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

/// 获取单个维度详情
#[tauri::command]
pub fn get_quota_dimension(
    db: State<Mutex<Connection>>,
    dimension_id: String,
) -> Result<QuotaDimension, String> {
    let db = db.lock().map_err(|e| e.to_string())?;

    db.query_row(
        "SELECT id, group_id, dimension_name, dimension_type, unit,
                total_quota, current_balance, reserved_balance,
                time_period, reset_time, reset_day, timezone,
                last_reset_at, next_reset_at, auto_reset,
                parent_dimension_id, nesting_level,
                warning_threshold, critical_threshold, created_at, updated_at
         FROM quota_dimensions WHERE id = ?1",
        rusqlite::params![&dimension_id],
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

/// 更新维度
#[tauri::command]
pub fn update_quota_dimension(
    db: State<Mutex<Connection>>,
    id: String,
    dimension_name: Option<String>,
    total_quota: Option<f64>,
    current_balance: Option<f64>,
    time_period: Option<String>,
    reset_time: Option<String>,
    reset_day: Option<i32>,
    auto_reset: Option<bool>,
    warning_threshold: Option<f64>,
    critical_threshold: Option<f64>,
) -> Result<QuotaDimension, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    // 构建动态更新SQL
    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(v) = dimension_name {
        updates.push("dimension_name = ?");
        params.push(Box::new(v));
    }
    if let Some(v) = total_quota {
        updates.push("total_quota = ?");
        params.push(Box::new(v));
    }
    if let Some(v) = current_balance {
        updates.push("current_balance = ?");
        params.push(Box::new(v));
    }
    if let Some(v) = time_period {
        updates.push("time_period = ?");
        params.push(Box::new(v));
    }
    if let Some(ref v) = reset_time {
        updates.push("reset_time = ?");
        params.push(Box::new(v.clone()));
    }
    if let Some(v) = reset_day {
        updates.push("reset_day = ?");
        params.push(Box::new(v));
    }
    if let Some(v) = auto_reset {
        updates.push("auto_reset = ?");
        params.push(Box::new(if v { 1 } else { 0 }));
    }
    if let Some(v) = warning_threshold {
        updates.push("warning_threshold = ?");
        params.push(Box::new(v));
    }
    if let Some(v) = critical_threshold {
        updates.push("critical_threshold = ?");
        params.push(Box::new(v));
    }

    updates.push("updated_at = ?");
    params.push(Box::new(now.clone()));

    params.push(Box::new(id.clone()));

    let sql = format!(
        "UPDATE quota_dimensions SET {} WHERE id = ?",
        updates.join(", ")
    );

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    db.execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;

    // 返回更新后的数据 - 直接查询而不是递归调用命令
    db.query_row(
        "SELECT id, group_id, dimension_name, dimension_type, unit,
                total_quota, current_balance, reserved_balance,
                time_period, reset_time, reset_day, timezone,
                last_reset_at, next_reset_at, auto_reset,
                parent_dimension_id, nesting_level,
                warning_threshold, critical_threshold, created_at, updated_at
         FROM quota_dimensions WHERE id = ?1",
        rusqlite::params![&id],
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

/// 删除维度
#[tauri::command]
pub fn delete_quota_dimension(
    db: State<Mutex<Connection>>,
    id: String,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;

    // 删除关联关系
    db.execute(
        "DELETE FROM dimension_relations WHERE parent_dimension_id = ?1 OR child_dimension_id = ?1",
        rusqlite::params![&id],
    ).map_err(|e| e.to_string())?;

    // 删除维度
    db.execute(
        "DELETE FROM quota_dimensions WHERE id = ?1",
        rusqlite::params![&id],
    ).map_err(|e| e.to_string())?;

    Ok(true)
}

// ==================== 配额检查与扣减命令 ====================

/// 检查配额可用性
#[tauri::command]
pub fn check_quota_availability_cmd(
    db: State<Mutex<Connection>>,
    account_id: String,
    estimated_usage: f64,
    unit: Option<String>,
) -> Result<QuotaAvailabilityResult, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let unit = unit.unwrap_or_else(|| "tokens".to_string());

    check_quota_availability(&db, &account_id, estimated_usage, &unit)
}

/// 执行扣减
#[tauri::command]
pub fn execute_deduction_cmd(
    db: State<Mutex<Connection>>,
    account_id: String,
    usage_amount: f64,
    unit: Option<String>,
    operation_type: Option<String>,
    metadata: Option<String>,
) -> Result<DeductionResult, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let unit = unit.unwrap_or_else(|| "tokens".to_string());
    let operation_type = operation_type.unwrap_or_else(|| "usage".to_string());
    let metadata = metadata.unwrap_or_else(|| "{}".to_string());

    let mut manager = DeductionManager::new(&db);
    manager.execute_deduction(&account_id, usage_amount, &unit, &operation_type, &metadata)
}

// ==================== 维度关联命令 ====================

/// 创建维度关联
#[tauri::command]
pub fn create_dimension_relation(
    db: State<Mutex<Connection>>,
    parent_dimension_id: String,
    child_dimension_id: String,
    relation_type: Option<String>,
    deduction_ratio: Option<f64>,
    sync_deduction: Option<bool>,
    require_both_available: Option<bool>,
) -> Result<DimensionRelation, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    let relation_type = relation_type.unwrap_or_else(|| "nested".to_string());
    let deduction_ratio = deduction_ratio.unwrap_or(1.0);
    let sync_deduction = sync_deduction.unwrap_or(true);
    let require_both_available = require_both_available.unwrap_or(true);

    db.execute(
        "INSERT INTO dimension_relations (id, parent_dimension_id, child_dimension_id, relation_type, deduction_ratio, sync_deduction, require_both_available, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            &id, &parent_dimension_id, &child_dimension_id, &relation_type,
            deduction_ratio,
            if sync_deduction { 1 } else { 0 },
            if require_both_available { 1 } else { 0 },
            &now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(DimensionRelation {
        id,
        parent_dimension_id,
        child_dimension_id,
        relation_type,
        deduction_ratio,
        sync_deduction,
        require_both_available,
        created_at: now,
    })
}

/// 获取维度的关联关系
#[tauri::command]
pub fn get_dimension_relations(
    db: State<Mutex<Connection>>,
    dimension_id: String,
) -> Result<Vec<DimensionRelation>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;

    let mut stmt = db.prepare(
        "SELECT id, parent_dimension_id, child_dimension_id, relation_type, deduction_ratio, sync_deduction, require_both_available, created_at
         FROM dimension_relations WHERE parent_dimension_id = ?1 OR child_dimension_id = ?1"
    ).map_err(|e| e.to_string())?;

    let relations = stmt.query_map(
        rusqlite::params![&dimension_id],
        |row| Ok(DimensionRelation {
            id: row.get(0)?,
            parent_dimension_id: row.get(1)?,
            child_dimension_id: row.get(2)?,
            relation_type: row.get(3)?,
            deduction_ratio: row.get(4)?,
            sync_deduction: row.get::<_, i32>(5)? == 1,
            require_both_available: row.get::<_, i32>(6)? == 1,
            created_at: row.get(7)?,
        }),
    ).map_err(|e| e.to_string())?;

    relations.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

/// 删除维度关联
#[tauri::command]
pub fn delete_dimension_relation(
    db: State<Mutex<Connection>>,
    id: String,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;

    db.execute(
        "DELETE FROM dimension_relations WHERE id = ?1",
        rusqlite::params![&id],
    ).map_err(|e| e.to_string())?;

    Ok(true)
}

// ==================== 配额概览命令 ====================

/// 获取账户配额概览
#[tauri::command]
pub fn get_quota_overview(
    db: State<Mutex<Connection>>,
    account_id: String,
) -> Result<QuotaOverview, String> {
    let db = db.lock().map_err(|e| e.to_string())?;

    // 获取策略组
    let mut stmt = db.prepare(
        "SELECT id, account_id, name, strategy_type, is_active, priority, created_at, updated_at
         FROM quota_strategy_groups WHERE account_id = ?1 AND is_active = 1 ORDER BY priority DESC"
    ).map_err(|e| e.to_string())?;

    let groups = stmt.query_map(
        rusqlite::params![&account_id],
        |row| Ok(QuotaStrategyGroup {
            id: row.get(0)?,
            account_id: row.get(1)?,
            name: row.get(2)?,
            strategy_type: row.get(3)?,
            is_active: row.get::<_, i32>(4)? == 1,
            priority: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        }),
    ).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    // 获取所有维度
    let mut all_dimensions = Vec::new();
    for group in &groups {
        let mut dim_stmt = db.prepare(
            "SELECT id, group_id, dimension_name, dimension_type, unit,
                    total_quota, current_balance, reserved_balance,
                    time_period, reset_time, reset_day, timezone,
                    last_reset_at, next_reset_at, auto_reset,
                    parent_dimension_id, nesting_level,
                    warning_threshold, critical_threshold, created_at, updated_at
             FROM quota_dimensions WHERE group_id = ?1 ORDER BY nesting_level, created_at"
        ).map_err(|e| e.to_string())?;

        let dims = dim_stmt.query_map(
            rusqlite::params![&group.id],
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
        ).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;
        all_dimensions.extend(dims);
    }

    // 计算总计
    let total_available: f64 = all_dimensions.iter()
        .map(|d| (d.current_balance - d.reserved_balance).max(0.0))
        .sum();
    let total_reserved: f64 = all_dimensions.iter()
        .map(|d| d.reserved_balance)
        .sum();

    // 计算健康状态
    let health_status = if all_dimensions.iter().any(|d| d.current_balance <= 0.0) {
        "depleted"
    } else if all_dimensions.iter().any(|d| {
        d.critical_threshold.map(|t| d.current_balance < t).unwrap_or(false)
    }) {
        "critical"
    } else if all_dimensions.iter().any(|d| {
        d.warning_threshold.map(|t| d.current_balance < t).unwrap_or(false)
    }) {
        "warning"
    } else {
        "healthy"
    };

    Ok(QuotaOverview {
        account_id,
        strategy_groups: groups,
        dimensions: all_dimensions,
        total_available,
        total_reserved,
        health_status: health_status.to_string(),
    })
}
