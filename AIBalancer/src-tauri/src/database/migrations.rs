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
