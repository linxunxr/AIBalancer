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

    Ok(())
}
