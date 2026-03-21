use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    // 创建余额表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS balances (
            id TEXT PRIMARY KEY,
            platform TEXT NOT NULL,
            current_balance REAL NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'CNY',
            last_updated TEXT NOT NULL,
            history TEXT NOT NULL DEFAULT '[]',
            metadata TEXT NOT NULL DEFAULT '{}'
        )",
        [],
    )?;

    // 创建使用记录表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS usage_records (
            id TEXT PRIMARY KEY,
            platform TEXT NOT NULL,
            date TEXT NOT NULL,
            tokens_used INTEGER NOT NULL DEFAULT 0,
            requests_count INTEGER NOT NULL DEFAULT 0,
            cost REAL NOT NULL DEFAULT 0,
            metadata TEXT NOT NULL DEFAULT '{}'
        )",
        [],
    )?;

    // 创建告警规则表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS alert_rules (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            platform TEXT NOT NULL,
            threshold REAL NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            notification_methods TEXT NOT NULL DEFAULT '[]',
            cooldown_minutes INTEGER NOT NULL DEFAULT 60,
            last_triggered TEXT,
            metadata TEXT NOT NULL DEFAULT '{}'
        )",
        [],
    )?;

    // 创建设置表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            theme TEXT NOT NULL DEFAULT 'dark',
            language TEXT NOT NULL DEFAULT 'zh-CN',
            auto_check_updates INTEGER NOT NULL DEFAULT 1,
            auto_check_interval INTEGER NOT NULL DEFAULT 3600000,
            minimize_to_tray INTEGER NOT NULL DEFAULT 1,
            start_minimized INTEGER NOT NULL DEFAULT 0,
            low_balance_threshold REAL NOT NULL DEFAULT 50,
            daily_budget_warning REAL NOT NULL DEFAULT 100,
            monthly_budget_warning REAL NOT NULL DEFAULT 3000,
            notification_enabled INTEGER NOT NULL DEFAULT 1
        )",
        [],
    )?;

    // 创建账户表（新版结构）
    conn.execute(
        "CREATE TABLE IF NOT EXISTS accounts_v2 (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'custom',
            status TEXT NOT NULL DEFAULT 'active',
            api_keys TEXT NOT NULL DEFAULT '[]',
            current_balance REAL NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'CNY',
            usage TEXT NOT NULL DEFAULT '{}',
            alerts TEXT NOT NULL DEFAULT '[]',
            metadata TEXT NOT NULL DEFAULT '{}',
            settings TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_synced_at TEXT NOT NULL
        )",
        [],
    )?;

    // 创建旧版账户表（兼容）
    conn.execute(
        "CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            provider TEXT NOT NULL,
            api_key TEXT NOT NULL,
            notes TEXT,
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // 迁移旧数据到新表
    migrate_accounts_to_v2(conn)?;

    // 创建存储表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS storage (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            ttl INTEGER
        )",
        [],
    )?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_balances_platform ON balances(platform)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_usage_records_platform ON usage_records(platform)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_usage_records_date ON usage_records(date)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_alert_rules_platform ON alert_rules(platform)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_accounts_v2_type ON accounts_v2(type)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_accounts_v2_status ON accounts_v2(status)",
        [],
    )?;

    // 创建应用配置表（用于存储代理配置、加密配置等）
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_config (
            key TEXT PRIMARY KEY,
            config TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // ==================== 多维度配额系统表 ====================

    // 创建额度策略组表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS quota_strategy_groups (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            name TEXT NOT NULL,
            strategy_type TEXT NOT NULL DEFAULT 'nested',
            is_active INTEGER NOT NULL DEFAULT 1,
            priority INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (account_id) REFERENCES accounts_v2(id)
        )",
        [],
    )?;

    // 创建额度维度表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS quota_dimensions (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            dimension_name TEXT NOT NULL,
            dimension_type TEXT NOT NULL DEFAULT 'time_based',
            unit TEXT NOT NULL DEFAULT 'tokens',
            total_quota REAL NOT NULL DEFAULT 0,
            current_balance REAL NOT NULL DEFAULT 0,
            reserved_balance REAL NOT NULL DEFAULT 0,
            time_period TEXT,
            reset_time TEXT,
            reset_day INTEGER,
            timezone TEXT DEFAULT 'Asia/Shanghai',
            last_reset_at TEXT,
            next_reset_at TEXT,
            auto_reset INTEGER NOT NULL DEFAULT 1,
            parent_dimension_id TEXT,
            nesting_level INTEGER NOT NULL DEFAULT 0,
            warning_threshold REAL,
            critical_threshold REAL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (group_id) REFERENCES quota_strategy_groups(id),
            FOREIGN KEY (parent_dimension_id) REFERENCES quota_dimensions(id)
        )",
        [],
    )?;

    // 创建维度关联表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS dimension_relations (
            id TEXT PRIMARY KEY,
            parent_dimension_id TEXT NOT NULL,
            child_dimension_id TEXT NOT NULL,
            relation_type TEXT NOT NULL DEFAULT 'nested',
            deduction_ratio REAL NOT NULL DEFAULT 1.0,
            sync_deduction INTEGER NOT NULL DEFAULT 1,
            require_both_available INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            FOREIGN KEY (parent_dimension_id) REFERENCES quota_dimensions(id),
            FOREIGN KEY (child_dimension_id) REFERENCES quota_dimensions(id)
        )",
        [],
    )?;

    // 创建扣减事务表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS deduction_transactions (
            transaction_id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            operation_type TEXT NOT NULL,
            total_usage REAL NOT NULL,
            usage_unit TEXT NOT NULL DEFAULT 'tokens',
            status TEXT NOT NULL DEFAULT 'pending',
            started_at TEXT NOT NULL,
            committed_at TEXT,
            rolled_back_at TEXT,
            error_message TEXT,
            metadata TEXT DEFAULT '{}',
            FOREIGN KEY (account_id) REFERENCES accounts_v2(id)
        )",
        [],
    )?;

    // 创建维度扣减记录表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS dimension_deductions (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL,
            dimension_id TEXT NOT NULL,
            deduction_amount REAL NOT NULL,
            balance_before REAL NOT NULL,
            balance_after REAL NOT NULL,
            deduction_status TEXT NOT NULL DEFAULT 'pending',
            related_dimension_ids TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES deduction_transactions(transaction_id),
            FOREIGN KEY (dimension_id) REFERENCES quota_dimensions(id)
        )",
        [],
    )?;

    // ==================== 索引创建 ====================

    // 配额系统索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_quota_strategy_groups_account ON quota_strategy_groups(account_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_quota_dimensions_group ON quota_dimensions(group_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_quota_dimensions_parent ON quota_dimensions(parent_dimension_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_quota_dimensions_time_period ON quota_dimensions(time_period)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_dimension_relations_parent ON dimension_relations(parent_dimension_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_dimension_relations_child ON dimension_relations(child_dimension_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_deduction_transactions_account ON deduction_transactions(account_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_deduction_transactions_status ON deduction_transactions(status)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_dimension_deductions_transaction ON dimension_deductions(transaction_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_dimension_deductions_dimension ON dimension_deductions(dimension_id)",
        [],
    )?;

    // ==================== 表结构扩展 ====================

    // 扩展 accounts_v2 表（添加 quota_strategy 字段）
    // SQLite 不支持 IF NOT EXISTS for ALTER TABLE，需要检查列是否存在
    let quota_strategy_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM pragma_table_info('accounts_v2') WHERE name='quota_strategy'",
        [],
        |row| row.get::<_, i32>(0),
    ).unwrap_or(0) > 0;

    if !quota_strategy_exists {
        conn.execute(
            "ALTER TABLE accounts_v2 ADD COLUMN quota_strategy TEXT DEFAULT '{}'",
            [],
        )?;
    }

    // 扩展 usage_records 表
    let transaction_id_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM pragma_table_info('usage_records') WHERE name='transaction_id'",
        [],
        |row| row.get::<_, i32>(0),
    ).unwrap_or(0) > 0;

    if !transaction_id_exists {
        conn.execute(
            "ALTER TABLE usage_records ADD COLUMN transaction_id TEXT",
            [],
        )?;
    }

    let dimension_usage_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM pragma_table_info('usage_records') WHERE name='dimension_usage'",
        [],
        |row| row.get::<_, i32>(0),
    ).unwrap_or(0) > 0;

    if !dimension_usage_exists {
        conn.execute(
            "ALTER TABLE usage_records ADD COLUMN dimension_usage TEXT DEFAULT '{}'",
            [],
        )?;
    }

    // ==================== 数据迁移 ====================

    // 迁移现有账户到配额系统
    migrate_accounts_to_quota_system(conn)?;

    Ok(())
}

/// 迁移旧账户数据到新表
fn migrate_accounts_to_v2(conn: &Connection) -> Result<(), rusqlite::Error> {
    // 检查是否已经迁移过
    let migrated: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM accounts_v2",
        [],
        |row| row.get::<_, i32>(0),
    ).unwrap_or(0) > 0;

    if migrated {
        return Ok(());
    }

    // 检查旧表是否有数据
    let has_old_data: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM accounts",
        [],
        |row| row.get::<_, i32>(0),
    ).unwrap_or(0) > 0;

    if !has_old_data {
        return Ok(());
    }

    // 迁移数据
    let mut stmt = conn.prepare(
        "SELECT id, name, provider, api_key, notes, enabled, created_at, updated_at FROM accounts"
    )?;

    let old_accounts = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, Option<String>>(4)?,
            row.get::<_, i32>(5)?,
            row.get::<_, String>(6)?,
            row.get::<_, String>(7)?,
        ))
    })?;

    let now = chrono::Utc::now().to_rfc3339();

    for account in old_accounts {
        let (id, name, provider, api_key, notes, enabled, created_at, updated_at) = account?;

        // 映射 provider 到 type
        let account_type = match provider.as_str() {
            "anthropic" => "anthropic",
            "openai" => "openai",
            _ => "custom",
        };

        // 映射 enabled 到 status
        let status = if enabled == 1 { "active" } else { "inactive" };

        // 构建 api_keys JSON
        let api_keys = serde_json::json!([{
            "id": uuid::Uuid::new_v4().to_string(),
            "key": api_key,
            "lastUsed": now,
            "usageCount": 0,
            "isActive": true,
            "createdAt": created_at
        }]).to_string();

        // 构建 metadata JSON
        let metadata = serde_json::json!({
            "notes": notes,
            "tags": [],
            "customFields": {}
        }).to_string();

        // 构建 usage JSON
        let usage = serde_json::json!({
            "totalTokens": 0,
            "promptTokens": 0,
            "completionTokens": 0,
            "totalCost": 0,
            "lastUsed": now,
            "dailyAverage": 0,
            "monthlyUsage": []
        }).to_string();

        // 构建 settings JSON
        let settings = serde_json::json!({
            "autoRefresh": true,
            "refreshInterval": 30,
            "lowBalanceThreshold": 50,
            "enableAlerts": true
        }).to_string();

        // 构建 alerts JSON
        let alerts = "[]".to_string();

        conn.execute(
            "INSERT OR IGNORE INTO accounts_v2
            (id, name, type, status, api_keys, current_balance, currency, usage, alerts, metadata, settings, created_at, updated_at, last_synced_at)
            VALUES (?1, ?2, ?3, ?4, ?5, 0, 'CNY', ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            rusqlite::params![
                id,
                name,
                account_type,
                status,
                api_keys,
                usage,
                alerts,
                metadata,
                settings,
                created_at,
                updated_at,
                now
            ],
        )?;
    }

    println!("账户数据迁移完成");
    Ok(())
}

/// 迁移现有账户到配额系统
/// 为每个现有账户创建默认策略组和单维度配额
fn migrate_accounts_to_quota_system(conn: &Connection) -> Result<(), rusqlite::Error> {
    // 检查是否已经迁移过（检查 quota_strategy_groups 表是否有数据）
    let migrated: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM quota_strategy_groups",
        [],
        |row| row.get::<_, i32>(0),
    ).unwrap_or(0) > 0;

    if migrated {
        return Ok(());
    }

    // 获取所有没有配额策略的账户
    let mut stmt = conn.prepare(
        "SELECT id, name, current_balance FROM accounts_v2 WHERE quota_strategy = '{}' OR quota_strategy IS NULL"
    )?;

    let accounts = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, f64>(2)?,
        ))
    })?;

    let now = chrono::Utc::now().to_rfc3339();

    for account in accounts {
        let (account_id, account_name, current_balance) = account?;

        // 创建默认策略组
        let strategy_group_id = uuid::Uuid::new_v4().to_string();
        let strategy_group_name = format!("{}-默认策略", account_name);

        conn.execute(
            "INSERT INTO quota_strategy_groups (id, account_id, name, strategy_type, is_active, priority, created_at, updated_at)
             VALUES (?1, ?2, ?3, 'single', 1, 0, ?4, ?5)",
            rusqlite::params![
                &strategy_group_id,
                &account_id,
                &strategy_group_name,
                &now,
                &now,
            ],
        )?;

        // 创建默认配额维度（永久配额）
        let dimension_id = uuid::Uuid::new_v4().to_string();

        conn.execute(
            "INSERT INTO quota_dimensions (
                id, group_id, dimension_name, dimension_type, unit,
                total_quota, current_balance, reserved_balance,
                time_period, auto_reset, nesting_level,
                created_at, updated_at
            ) VALUES (?1, ?2, '默认余额', 'permanent', 'tokens', ?3, ?4, 0, 'permanent', 0, 0, ?5, ?6)",
            rusqlite::params![
                &dimension_id,
                &strategy_group_id,
                current_balance,
                current_balance,
                &now,
                &now,
            ],
        )?;

        // 更新账户的 quota_strategy 字段
        let quota_strategy = serde_json::json!({
            "defaultGroupId": strategy_group_id,
            "defaultDimensionId": dimension_id,
        }).to_string();

        conn.execute(
            "UPDATE accounts_v2 SET quota_strategy = ?1 WHERE id = ?2",
            rusqlite::params![&quota_strategy, &account_id],
        )?;
    }

    println!("配额系统数据迁移完成");
    Ok(())
}
