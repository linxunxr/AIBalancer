use rusqlite::params;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json;
use std::sync::Mutex;
use tauri::State;
use crate::crypto::encryption::{encrypt_api_key, decrypt_api_key, decrypt_api_key_smart};

// ==================== 辅助函数 ====================

/// 脱敏 API Key（显示前4位和后4位，中间用星号代替）
fn mask_api_key(key: &str) -> String {
    if key.len() <= 8 {
        return "*".repeat(key.len());
    }
    let prefix = &key[..4];
    let suffix = &key[key.len()-4..];
    format!("{}****{}", prefix, suffix)
}

/// 解密 API Keys 列表并返回脱敏版本
fn decrypt_and_mask_api_keys(encrypted_keys: &[ApiKeyInfo]) -> Vec<ApiKeyInfo> {
    encrypted_keys.iter().map(|key| {
        let masked_key = match decrypt_api_key(&key.key) {
            Ok(decrypted) => mask_api_key(&decrypted),
            Err(_) => mask_api_key(&key.key), // 解密失败则脱敏原始值
        };
        ApiKeyInfo {
            id: key.id.clone(),
            key: masked_key,
            last_used: key.last_used.clone(),
            usage_count: key.usage_count,
            is_active: key.is_active,
            created_at: key.created_at.clone(),
            expires_at: key.expires_at.clone(),
        }
    }).collect()
}

/// 获取解密后的 API Key（用于实际 API 调用）
fn get_decrypted_api_key(encrypted_keys: &[ApiKeyInfo]) -> Option<String> {
    encrypted_keys.iter()
        .find(|k| k.is_active)
        .and_then(|k| decrypt_api_key(&k.key).ok())
}

/// 将数据库行转换为 Account，并脱敏 API Keys
fn row_to_account(row: &rusqlite::Row) -> Result<Account, rusqlite::Error> {
    let api_keys: String = row.get(4)?;
    let encrypted_keys: Vec<ApiKeyInfo> = serde_json::from_str(&api_keys).unwrap_or_default();
    let masked_keys = decrypt_and_mask_api_keys(&encrypted_keys);

    Ok(Account {
        id: row.get(0)?,
        name: row.get(1)?,
        account_type: row.get(2)?,
        status: row.get(3)?,
        api_keys: masked_keys,
        current_balance: row.get(5)?,
        currency: row.get(6)?,
        usage: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
        alerts: serde_json::from_str(&row.get::<_, String>(8)?).unwrap_or_default(),
        metadata: serde_json::from_str(&row.get::<_, String>(9)?).unwrap_or_default(),
        settings: serde_json::from_str(&row.get::<_, String>(10)?).unwrap_or_default(),
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
        last_synced_at: row.get(13)?,
    })
}

// ==================== 账户相关结构体 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeyInfo {
    pub id: String,
    pub key: String,
    #[serde(rename = "lastUsed")]
    pub last_used: String,
    #[serde(rename = "usageCount")]
    pub usage_count: u64,
    #[serde(rename = "isActive")]
    pub is_active: bool,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AccountUsage {
    #[serde(rename = "totalTokens")]
    pub total_tokens: u64,
    #[serde(rename = "promptTokens")]
    pub prompt_tokens: u64,
    #[serde(rename = "completionTokens")]
    pub completion_tokens: u64,
    #[serde(rename = "totalCost")]
    pub total_cost: f64,
    #[serde(rename = "lastUsed")]
    pub last_used: String,
    #[serde(rename = "dailyAverage")]
    pub daily_average: u64,
    #[serde(rename = "monthlyUsage")]
    pub monthly_usage: Vec<MonthlyUsage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlyUsage {
    pub month: String,
    pub tokens: u64,
    pub cost: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountAlert {
    pub id: String,
    #[serde(rename = "type")]
    pub alert_type: String,
    pub message: String,
    pub severity: String,
    #[serde(rename = "triggeredAt")]
    pub triggered_at: String,
    pub resolved: bool,
    #[serde(rename = "resolvedAt")]
    pub resolved_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AccountMetadata {
    pub organization: Option<String>,
    pub project: Option<String>,
    pub tags: Vec<String>,
    pub notes: Option<String>,
    #[serde(rename = "customFields")]
    pub custom_fields: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AccountSettings {
    #[serde(rename = "autoRefresh")]
    pub auto_refresh: bool,
    #[serde(rename = "refreshInterval")]
    pub refresh_interval: u32,
    #[serde(rename = "lowBalanceThreshold")]
    pub low_balance_threshold: f64,
    #[serde(rename = "enableAlerts")]
    pub enable_alerts: bool,
    #[serde(rename = "usageLimit")]
    pub usage_limit: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: String,
    pub status: String,
    #[serde(rename = "apiKeys")]
    pub api_keys: Vec<ApiKeyInfo>,
    #[serde(rename = "currentBalance")]
    pub current_balance: f64,
    pub currency: String,
    pub usage: AccountUsage,
    pub alerts: Vec<AccountAlert>,
    pub metadata: AccountMetadata,
    pub settings: AccountSettings,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    #[serde(rename = "lastSyncedAt")]
    pub last_synced_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAccountParams {
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: String,
    #[serde(rename = "apiKey")]
    pub api_key: String,
    pub organization: Option<String>,
    pub project: Option<String>,
    pub tags: Option<Vec<String>>,
    pub notes: Option<String>,
    pub settings: Option<PartialSettings>,
}

#[derive(Debug, Deserialize)]
pub struct PartialSettings {
    #[serde(rename = "autoRefresh")]
    pub auto_refresh: Option<bool>,
    #[serde(rename = "refreshInterval")]
    pub refresh_interval: Option<u32>,
    #[serde(rename = "lowBalanceThreshold")]
    pub low_balance_threshold: Option<f64>,
    #[serde(rename = "enableAlerts")]
    pub enable_alerts: Option<bool>,
    #[serde(rename = "usageLimit")]
    pub usage_limit: Option<u64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAccountParams {
    pub id: String,
    pub name: Option<String>,
    pub status: Option<String>,
    pub metadata: Option<PartialMetadata>,
    pub settings: Option<PartialSettings>,
}

#[derive(Debug, Deserialize)]
pub struct PartialMetadata {
    pub organization: Option<String>,
    pub project: Option<String>,
    pub tags: Option<Vec<String>>,
    pub notes: Option<String>,
}

// ==================== 账户管理命令 ====================

/// 获取所有账户
#[tauri::command]
pub fn get_all_accounts(db: State<'_, Mutex<Connection>>) -> Result<Vec<Account>, String> {
    tracing::debug!("获取所有账户列表");
    let conn = db.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2 ORDER BY created_at DESC"
        )
        .map_err(|e| {
            tracing::error!("准备查询语句失败: {}", e);
            format!("查询失败: {}", e)
        })?;

    let accounts = stmt
        .query_map([], row_to_account)
        .map_err(|e| {
            tracing::error!("映射账户数据失败: {}", e);
            format!("映射失败: {}", e)
        })?
        .collect::<std::result::Result<Vec<Account>, rusqlite::Error>>()
        .map_err(|e| {
            tracing::error!("收集账户数据失败: {}", e);
            format!("收集数据失败: {}", e)
        })?;

    tracing::debug!("成功获取 {} 个账户", accounts.len());
    Ok(accounts)
}

/// 获取指定状态的账户
#[tauri::command]
pub fn get_accounts_by_status(
    db: State<'_, Mutex<Connection>>,
    status: String,
) -> Result<Vec<Account>, String> {
    tracing::debug!("获取状态为 {} 的账户", status);
    let conn = db.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2 WHERE status = ?1 ORDER BY created_at DESC"
        )
        .map_err(|e| {
            tracing::error!("准备查询语句失败: {}", e);
            format!("查询失败: {}", e)
        })?;

    let accounts = stmt
        .query_map(params![status], row_to_account)
        .map_err(|e| {
            tracing::error!("映射账户数据失败: {}", e);
            format!("映射失败: {}", e)
        })?
        .collect::<std::result::Result<Vec<Account>, rusqlite::Error>>()
        .map_err(|e| {
            tracing::error!("收集账户数据失败: {}", e);
            format!("收集数据失败: {}", e)
        })?;

    tracing::debug!("成功获取 {} 个状态为 {} 的账户", accounts.len(), status);
    Ok(accounts)
}

/// 获取指定类型的账户
#[tauri::command]
pub fn get_accounts_by_type(
    db: State<'_, Mutex<Connection>>,
    account_type: String,
) -> Result<Vec<Account>, String> {
    tracing::debug!("获取类型为 {} 的账户", account_type);
    let conn = db.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2 WHERE type = ?1 ORDER BY created_at DESC"
        )
        .map_err(|e| {
            tracing::error!("准备查询语句失败: {}", e);
            format!("查询失败: {}", e)
        })?;

    let accounts = stmt
        .query_map(params![account_type], row_to_account)
        .map_err(|e| {
            tracing::error!("映射账户数据失败: {}", e);
            format!("映射失败: {}", e)
        })?
        .collect::<std::result::Result<Vec<Account>, rusqlite::Error>>()
        .map_err(|e| {
            tracing::error!("收集账户数据失败: {}", e);
            format!("收集数据失败: {}", e)
        })?;

    tracing::debug!("成功获取 {} 个类型为 {} 的账户", accounts.len(), account_type);
    Ok(accounts)
}

/// 创建账户
#[tauri::command]
pub fn create_account(
    db: State<'_, Mutex<Connection>>,
    params: CreateAccountParams,
) -> Result<Account, String> {
    tracing::info!("创建新账户: {} (类型: {})", params.name, params.account_type);
    let conn = db.lock().unwrap();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    tracing::debug!("加密 API Key...");
    // 加密 API Key
    let encrypted_key = encrypt_api_key(&params.api_key)
        .map_err(|e| {
            tracing::error!("API Key 加密失败: {}", e);
            format!("API Key 加密失败: {}", e)
        })?;

    tracing::debug!("API Key 加密成功");

    // 构建 API 密钥（存储加密后的值）
    let api_keys_storage = vec![ApiKeyInfo {
        id: uuid::Uuid::new_v4().to_string(),
        key: encrypted_key,
        last_used: now.clone(),
        usage_count: 0,
        is_active: true,
        created_at: now.clone(),
        expires_at: None,
    }];

    // 构建使用统计
    let usage = AccountUsage {
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_cost: 0.0,
        last_used: now.clone(),
        daily_average: 0,
        monthly_usage: vec![],
    };

    // 构建元数据
    let metadata = AccountMetadata {
        organization: params.organization.clone(),
        project: params.project.clone(),
        tags: params.tags.clone().unwrap_or_default(),
        notes: params.notes.clone(),
        custom_fields: serde_json::json!({}),
    };

    // 构建设置
    let settings = AccountSettings {
        auto_refresh: params.settings.as_ref().and_then(|s| s.auto_refresh).unwrap_or(true),
        refresh_interval: params.settings.as_ref().and_then(|s| s.refresh_interval).unwrap_or(30),
        low_balance_threshold: params.settings.as_ref().and_then(|s| s.low_balance_threshold).unwrap_or(50.0),
        enable_alerts: params.settings.as_ref().and_then(|s| s.enable_alerts).unwrap_or(true),
        usage_limit: params.settings.as_ref().and_then(|s| s.usage_limit),
    };

    tracing::debug!("插入账户数据到数据库...");
    conn.execute(
        "INSERT INTO accounts_v2
        (id, name, type, status, api_keys, current_balance, currency, usage, alerts, metadata, settings, created_at, updated_at, last_synced_at)
        VALUES (?1, ?2, ?3, 'testing', ?4, 0, 'CNY', ?5, '[]', ?6, ?7, ?8, ?9, ?10)",
        params![
            &id,
            &params.name,
            &params.account_type,
            serde_json::to_string(&api_keys_storage).map_err(|e| {
                tracing::error!("序列化 API Keys 失败: {}", e);
                format!("序列化失败: {}", e)
            })?,
            serde_json::to_string(&usage).map_err(|e| {
                tracing::error!("序列化使用统计失败: {}", e);
                format!("序列化失败: {}", e)
            })?,
            serde_json::to_string(&metadata).map_err(|e| {
                tracing::error!("序列化元数据失败: {}", e);
                format!("序列化失败: {}", e)
            })?,
            serde_json::to_string(&settings).map_err(|e| {
                tracing::error!("序列化设置失败: {}", e);
                format!("序列化失败: {}", e)
            })?,
            &now,
            &now,
            &now,
        ],
    ).map_err(|e| {
        tracing::error!("插入账户数据失败: {}", e);
        format!("创建账户失败: {}", e)
    })?;

    tracing::info!("账户创建成功: {} (ID: {})", params.name, id);

    // 返回时使用脱敏的 API Key（不暴露原始值或加密值）
    let api_keys_response = vec![ApiKeyInfo {
        id: api_keys_storage[0].id.clone(),
        key: mask_api_key(&params.api_key),
        last_used: now.clone(),
        usage_count: 0,
        is_active: true,
        created_at: now.clone(),
        expires_at: None,
    }];

    Ok(Account {
        id,
        name: params.name,
        account_type: params.account_type,
        status: "testing".to_string(),
        api_keys: api_keys_response,
        current_balance: 0.0,
        currency: "CNY".to_string(),
        usage,
        alerts: vec![],
        metadata,
        settings,
        created_at: now.clone(),
        updated_at: now.clone(),
        last_synced_at: now,
    })
}

/// 更新账户
#[tauri::command]
pub fn update_account(
    db: State<'_, Mutex<Connection>>,
    params: UpdateAccountParams,
) -> Result<Option<Account>, String> {
    let conn = db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    // 检查账户是否存在
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM accounts_v2 WHERE id = ?1",
            params![&params.id],
            |row| row.get(0),
        )
        .map_err(|e| format!("查询失败: {}", e))?;

    if !exists {
        return Ok(None);
    }

    // 更新名称
    if let Some(ref name) = params.name {
        conn.execute(
            "UPDATE accounts_v2 SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![name, &now, &params.id],
        )
        .map_err(|e| format!("更新名称失败: {}", e))?;
    }

    // 更新状态
    if let Some(ref status) = params.status {
        conn.execute(
            "UPDATE accounts_v2 SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![status, &now, &params.id],
        )
        .map_err(|e| format!("更新状态失败: {}", e))?;
    }

    // 更新元数据
    if let Some(ref metadata) = params.metadata {
        let current_metadata: String = conn
            .query_row(
                "SELECT metadata FROM accounts_v2 WHERE id = ?1",
                params![&params.id],
                |row| row.get(0),
            )
            .map_err(|e| format!("查询元数据失败: {}", e))?;

        let mut current: AccountMetadata =
            serde_json::from_str(&current_metadata).unwrap_or(AccountMetadata {
                organization: None,
                project: None,
                tags: vec![],
                notes: None,
                custom_fields: serde_json::json!({}),
            });

        if let Some(ref org) = metadata.organization {
            current.organization = Some(org.clone());
        }
        if let Some(ref proj) = metadata.project {
            current.project = Some(proj.clone());
        }
        if let Some(ref tags) = metadata.tags {
            current.tags = tags.clone();
        }
        if let Some(ref notes) = metadata.notes {
            current.notes = Some(notes.clone());
        }

        conn.execute(
            "UPDATE accounts_v2 SET metadata = ?1, updated_at = ?2 WHERE id = ?3",
            params![
                serde_json::to_string(&current).map_err(|e| format!("序列化失败: {}", e))?,
                &now,
                &params.id
            ],
        )
        .map_err(|e| format!("更新元数据失败: {}", e))?;
    }

    // 更新设置
    if let Some(ref settings) = params.settings {
        let current_settings: String = conn
            .query_row(
                "SELECT settings FROM accounts_v2 WHERE id = ?1",
                params![&params.id],
                |row| row.get(0),
            )
            .map_err(|e| format!("查询设置失败: {}", e))?;

        let mut current: AccountSettings =
            serde_json::from_str(&current_settings).unwrap_or(AccountSettings {
                auto_refresh: true,
                refresh_interval: 30,
                low_balance_threshold: 50.0,
                enable_alerts: true,
                usage_limit: None,
            });

        if let Some(v) = settings.auto_refresh {
            current.auto_refresh = v;
        }
        if let Some(v) = settings.refresh_interval {
            current.refresh_interval = v;
        }
        if let Some(v) = settings.low_balance_threshold {
            current.low_balance_threshold = v;
        }
        if let Some(v) = settings.enable_alerts {
            current.enable_alerts = v;
        }
        if let Some(v) = settings.usage_limit {
            current.usage_limit = Some(v);
        }

        conn.execute(
            "UPDATE accounts_v2 SET settings = ?1, updated_at = ?2 WHERE id = ?3",
            params![
                serde_json::to_string(&current).map_err(|e| format!("序列化失败: {}", e))?,
                &now,
                &params.id
            ],
        )
        .map_err(|e| format!("更新设置失败: {}", e))?;
    }

    // 查询更新后的账户
    let result = conn
        .query_row(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2 WHERE id = ?1",
            params![&params.id],
            row_to_account,
        )
        .ok();

    tracing::info!("账户更新成功: {}", params.id);
    Ok(result)
}

/// 删除账户
#[tauri::command]
pub fn delete_account(db: State<'_, Mutex<Connection>>, id: String) -> Result<bool, String> {
    tracing::info!("删除账户: {}", id);
    let conn = db.lock().unwrap();

    let rows_affected = conn
        .execute("DELETE FROM accounts_v2 WHERE id = ?1", params![&id])
        .map_err(|e| {
            tracing::error!("删除账户失败: {} - {}", id, e);
            format!("删除账户失败: {}", e)
        })?;

    if rows_affected > 0 {
        tracing::info!("账户删除成功: {}", id);
    } else {
        tracing::warn!("账户不存在或已删除: {}", id);
    }

    Ok(rows_affected > 0)
}

/// 切换账户启用状态
#[tauri::command]
pub fn toggle_account(db: State<'_, Mutex<Connection>>, id: String) -> Result<Option<Account>, String> {
    tracing::debug!("切换账户状态: {}", id);
    let conn = db.lock().unwrap();

    // 获取当前状态
    let current_status: String = conn
        .query_row(
            "SELECT status FROM accounts_v2 WHERE id = ?1",
            params![&id],
            |row| row.get(0),
        )
        .map_err(|e| {
            tracing::error!("查询账户状态失败: {} - {}", id, e);
            format!("查询状态失败: {}", e)
        })?;

    // 切换状态
    let new_status = match current_status.as_str() {
        "active" => "inactive",
        "inactive" => "active",
        _ => "active",
    };

    tracing::info!("账户状态切换: {} -> {} ({})", current_status, new_status, id);

    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE accounts_v2 SET status = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_status, &now, &id],
    )
    .map_err(|e| {
        tracing::error!("更新账户状态失败: {} - {}", id, e);
        format!("切换账户状态失败: {}", e)
    })?;

    // 查询更新后的账户
    let result = conn
        .query_row(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2 WHERE id = ?1",
            params![&id],
            row_to_account,
        )
        .ok();

    Ok(result)
}

/// 更新账户余额
#[tauri::command]
pub fn update_account_balance(
    db: State<'_, Mutex<Connection>>,
    id: String,
    balance: f64,
) -> Result<Option<Account>, String> {
    tracing::info!("更新账户余额: {} -> {}", id, balance);
    let conn = db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE accounts_v2 SET current_balance = ?1, last_synced_at = ?2, updated_at = ?3 WHERE id = ?4",
        params![balance, &now, &now, &id],
    )
    .map_err(|e| {
        tracing::error!("更新账户余额失败: {} - {}", id, e);
        format!("更新余额失败: {}", e)
    })?;

    // 查询更新后的账户
    let result = conn
        .query_row(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2 WHERE id = ?1",
            params![&id],
            row_to_account,
        )
        .ok();

    tracing::debug!("账户余额更新成功: {}", id);
    Ok(result)
}

/// 获取账户统计汇总
#[tauri::command]
pub fn get_accounts_summary(db: State<'_, Mutex<Connection>>) -> Result<serde_json::Value, String> {
    let conn = db.lock().unwrap();

    let total: i32 = conn
        .query_row("SELECT COUNT(*) FROM accounts_v2", [], |row| row.get(0))
        .map_err(|e| format!("查询失败: {}", e))?;

    let active: i32 = conn
        .query_row("SELECT COUNT(*) FROM accounts_v2 WHERE status = 'active'", [], |row| row.get(0))
        .map_err(|e| format!("查询失败: {}", e))?;

    let inactive: i32 = conn
        .query_row("SELECT COUNT(*) FROM accounts_v2 WHERE status = 'inactive'", [], |row| row.get(0))
        .map_err(|e| format!("查询失败: {}", e))?;

    let error: i32 = conn
        .query_row("SELECT COUNT(*) FROM accounts_v2 WHERE status = 'error'", [], |row| row.get(0))
        .map_err(|e| format!("查询失败: {}", e))?;

    let total_balance: f64 = conn
        .query_row("SELECT COALESCE(SUM(current_balance), 0) FROM accounts_v2", [], |row| row.get(0))
        .map_err(|e| format!("查询失败: {}", e))?;

    Ok(serde_json::json!({
        "total": total,
        "active": active,
        "inactive": inactive,
        "withErrors": error,
        "totalBalance": total_balance
    }))
}

/// 搜索账户
#[tauri::command]
pub fn search_accounts(
    db: State<'_, Mutex<Connection>>,
    query: String,
) -> Result<Vec<Account>, String> {
    let conn = db.lock().unwrap();
    let search_pattern = format!("%{}%", query);

    let mut stmt = conn
        .prepare(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2
             WHERE name LIKE ?1 OR metadata LIKE ?1 OR type LIKE ?1
             ORDER BY created_at DESC"
        )
        .map_err(|e| format!("查询失败: {}", e))?;

    let accounts = stmt
        .query_map(params![search_pattern], row_to_account)
        .map_err(|e| format!("映射失败: {}", e))?
        .collect::<std::result::Result<Vec<Account>, rusqlite::Error>>()
        .map_err(|e| format!("收集数据失败: {}", e))?;

    Ok(accounts)
}

// ==================== 通用存储命令 ====================

/// 执行 SQL（通用）
#[tauri::command]
pub fn execute_sql(
    _conn_state: State<'_, Mutex<Connection>>,
    _sql: String,
    _params: Option<Vec<String>>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

/// 存储操作（通用键值存储）
#[tauri::command]
pub fn storage_get(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
    _key: String,
) -> Result<Option<serde_json::Value>, String> {
    Ok(None)
}

#[tauri::command]
pub fn storage_set(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
    _key: String,
    _value: serde_json::Value,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn storage_remove(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
    _key: String,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn storage_keys(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
) -> Result<Vec<String>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn storage_size(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
) -> Result<usize, String> {
    Ok(0)
}

#[tauri::command]
pub fn app_get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub fn app_check_updates() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "hasUpdate": false,
        "currentVersion": env!("CARGO_PKG_VERSION")
    }))
}

// ==================== API Key 管理命令 ====================

#[derive(Debug, Deserialize)]
pub struct AddApiKeyParams {
    pub account_id: String,
    pub api_key: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RotateApiKeyParams {
    pub account_id: String,
    pub key_id: String,
    pub new_key: String,
}

/// 添加 API Key
#[tauri::command]
pub fn add_api_key(
    db: State<'_, Mutex<Connection>>,
    params: AddApiKeyParams,
) -> Result<Account, String> {
    let conn = db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    // 获取当前账户
    let current_keys: String = conn
        .query_row(
            "SELECT api_keys FROM accounts_v2 WHERE id = ?1",
            params![&params.account_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("查询账户失败: {}", e))?;

    let mut api_keys: Vec<ApiKeyInfo> = serde_json::from_str(&current_keys)
        .map_err(|e| format!("解析 API Keys 失败: {}", e))?;

    // 加密新密钥
    let encrypted_key = encrypt_api_key(&params.api_key)
        .map_err(|e| format!("加密 API Key 失败: {}", e))?;

    // 添加新密钥
    let new_key = ApiKeyInfo {
        id: uuid::Uuid::new_v4().to_string(),
        key: encrypted_key,
        last_used: now.clone(),
        usage_count: 0,
        is_active: true,
        created_at: now.clone(),
        expires_at: params.expires_at,
    };

    api_keys.push(new_key);

    // 更新数据库
    conn.execute(
        "UPDATE accounts_v2 SET api_keys = ?1, updated_at = ?2 WHERE id = ?3",
        params![
            serde_json::to_string(&api_keys).map_err(|e| format!("序列化失败: {}", e))?,
            &now,
            &params.account_id
        ],
    )
    .map_err(|e| format!("更新账户失败: {}", e))?;

    // 返回更新后的账户
    let account = conn
        .query_row(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2 WHERE id = ?1",
            params![&params.account_id],
            row_to_account,
        )
        .map_err(|e| format!("查询账户失败: {}", e))?;

    Ok(account)
}

/// 删除 API Key
#[tauri::command]
pub fn delete_api_key(
    db: State<'_, Mutex<Connection>>,
    account_id: String,
    key_id: String,
) -> Result<Account, String> {
    let conn = db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    // 获取当前账户
    let current_keys: String = conn
        .query_row(
            "SELECT api_keys FROM accounts_v2 WHERE id = ?1",
            params![&account_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("查询账户失败: {}", e))?;

    let mut api_keys: Vec<ApiKeyInfo> = serde_json::from_str(&current_keys)
        .map_err(|e| format!("解析 API Keys 失败: {}", e))?;

    // 过滤掉要删除的密钥
    api_keys.retain(|k| k.id != key_id);

    // 更新数据库
    conn.execute(
        "UPDATE accounts_v2 SET api_keys = ?1, updated_at = ?2 WHERE id = ?3",
        params![
            serde_json::to_string(&api_keys).map_err(|e| format!("序列化失败: {}", e))?,
            &now,
            &account_id
        ],
    )
    .map_err(|e| format!("更新账户失败: {}", e))?;

    // 返回更新后的账户
    let account = conn
        .query_row(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2 WHERE id = ?1",
            params![&account_id],
            row_to_account,
        )
        .map_err(|e| format!("查询账户失败: {}", e))?;

    Ok(account)
}

/// 激活/停用 API Key
#[tauri::command]
pub fn set_api_key_active(
    db: State<'_, Mutex<Connection>>,
    account_id: String,
    key_id: String,
    is_active: bool,
) -> Result<Account, String> {
    let conn = db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    // 获取当前账户
    let current_keys: String = conn
        .query_row(
            "SELECT api_keys FROM accounts_v2 WHERE id = ?1",
            params![&account_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("查询账户失败: {}", e))?;

    let mut api_keys: Vec<ApiKeyInfo> = serde_json::from_str(&current_keys)
        .map_err(|e| format!("解析 API Keys 失败: {}", e))?;

    // 检查是否至少有一个活跃密钥
    if !is_active {
        let active_count = api_keys.iter().filter(|k| k.is_active).count();
        if active_count <= 1 {
            return Err("不能停用最后一个活跃的 API Key".to_string());
        }
    }

    // 更新密钥状态
    for key in &mut api_keys {
        if key.id == key_id {
            key.is_active = is_active;
        }
    }

    // 更新数据库
    conn.execute(
        "UPDATE accounts_v2 SET api_keys = ?1, updated_at = ?2 WHERE id = ?3",
        params![
            serde_json::to_string(&api_keys).map_err(|e| format!("序列化失败: {}", e))?,
            &now,
            &account_id
        ],
    )
    .map_err(|e| format!("更新账户失败: {}", e))?;

    // 返回更新后的账户
    let account = conn
        .query_row(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2 WHERE id = ?1",
            params![&account_id],
            row_to_account,
        )
        .map_err(|e| format!("查询账户失败: {}", e))?;

    Ok(account)
}

/// 轮换 API Key
#[tauri::command]
pub fn rotate_api_key(
    db: State<'_, Mutex<Connection>>,
    params: RotateApiKeyParams,
) -> Result<Account, String> {
    let conn = db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    // 获取当前账户
    let current_keys: String = conn
        .query_row(
            "SELECT api_keys FROM accounts_v2 WHERE id = ?1",
            params![&params.account_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("查询账户失败: {}", e))?;

    let mut api_keys: Vec<ApiKeyInfo> = serde_json::from_str(&current_keys)
        .map_err(|e| format!("解析 API Keys 失败: {}", e))?;

    // 加密新密钥
    let encrypted_key = encrypt_api_key(&params.new_key)
        .map_err(|e| format!("加密 API Key 失败: {}", e))?;

    // 更新指定密钥
    for key in &mut api_keys {
        if key.id == params.key_id {
            key.key = encrypted_key.clone();
            key.last_used = now.clone();
            key.is_active = true;
            break; // 找到后退出循环
        }
    }

    // 更新数据库
    conn.execute(
        "UPDATE accounts_v2 SET api_keys = ?1, updated_at = ?2 WHERE id = ?3",
        params![
            serde_json::to_string(&api_keys).map_err(|e| format!("序列化失败: {}", e))?,
            &now,
            &params.account_id
        ],
    )
    .map_err(|e| format!("更新账户失败: {}", e))?;

    // 返回更新后的账户
    let account = conn
        .query_row(
            "SELECT id, name, type, status, api_keys, current_balance, currency,
                    usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
             FROM accounts_v2 WHERE id = ?1",
            params![&params.account_id],
            row_to_account,
        )
        .map_err(|e| format!("查询账户失败: {}", e))?;

    Ok(account)
}

// ==================== 数据导出命令 ====================

/// 导出账户数据
#[tauri::command]
pub fn export_accounts(
    db: State<'_, Mutex<Connection>>,
    ids: Option<Vec<String>>,
    format: String,
) -> Result<String, String> {
    let conn = db.lock().unwrap();

    let accounts = if let Some(ref account_ids) = ids {
        // 导出指定账户
        let mut result = Vec::new();
        for id in account_ids {
            let account = conn
                .query_row(
                    "SELECT id, name, type, status, api_keys, current_balance, currency,
                            usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
                     FROM accounts_v2 WHERE id = ?1",
                    params![id],
                    row_to_account,
                )
                .ok();
            if let Some(acc) = account {
                result.push(acc);
            }
        }
        result
    } else {
        // 导出所有账户
        let mut stmt = conn
            .prepare(
                "SELECT id, name, type, status, api_keys, current_balance, currency,
                        usage, alerts, metadata, settings, created_at, updated_at, last_synced_at
                 FROM accounts_v2 ORDER BY created_at DESC"
            )
            .map_err(|e| format!("查询失败: {}", e))?;

        let rows = stmt.query_map([], row_to_account)
            .map_err(|e| format!("映射失败: {}", e))?;
        rows.collect::<std::result::Result<Vec<Account>, rusqlite::Error>>()
            .map_err(|e| format!("收集数据失败: {}", e))?
    };

    // 构建导出数据（移除敏感信息）
    let export_data: Vec<serde_json::Value> = accounts
        .iter()
        .map(|acc| {
            serde_json::json!({
                "id": acc.id,
                "name": acc.name,
                "type": acc.account_type,
                "status": acc.status,
                "balance": {
                    "current": acc.current_balance,
                    "currency": acc.currency
                },
                "usage": acc.usage,
                "metadata": {
                    "organization": acc.metadata.organization,
                    "project": acc.metadata.project,
                    "tags": acc.metadata.tags,
                    "notes": acc.metadata.notes
                },
                "settings": acc.settings,
                "createdAt": acc.created_at,
                "updatedAt": acc.updated_at,
                "lastSyncedAt": acc.last_synced_at
            })
        })
        .collect();

    match format.as_str() {
        "json" => Ok(serde_json::to_string_pretty(&export_data)
            .map_err(|e| format!("序列化失败: {}", e))?),
        "csv" => {
            // CSV 格式导出
            let mut csv = String::from("id,name,type,status,balance,currency,totalTokens,totalCost,createdAt\n");
            for acc in &accounts {
                csv.push_str(&format!(
                    "{},{},{},{},{},{},{},{},{}\n",
                    acc.id,
                    acc.name,
                    acc.account_type,
                    acc.status,
                    acc.current_balance,
                    acc.currency,
                    acc.usage.total_tokens,
                    acc.usage.total_cost,
                    acc.created_at
                ));
            }
            Ok(csv)
        }
        _ => Err(format!("不支持的导出格式: {}", format))
    }
}

// ==================== 账户连接测试命令 ====================

/// 通过账户ID测试连接（在后端解密API Key后测试）
#[tauri::command]
pub async fn test_account_connection_by_id(
    db: State<'_, Mutex<Connection>>,
    account_id: String,
) -> Result<crate::api_client::providers::ApiTestResult, String> {
    use crate::api_client::providers::test_api_connection;

    tracing::info!("测试账户连接: {}", account_id);

    // 获取账户信息
    let (account_type, encrypted_keys): (String, String) = {
        let conn = db.lock().unwrap();
        conn.query_row(
            "SELECT type, api_keys FROM accounts_v2 WHERE id = ?1",
            params![&account_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).map_err(|e| {
            tracing::error!("查询账户失败: {}", e);
            format!("查询账户失败: {}", e)
        })?
    };

    tracing::debug!("账户类型: {}, 原始 API Keys JSON: {}", account_type, encrypted_keys);

    // 解析 API Keys
    let api_keys: Vec<ApiKeyInfo> = serde_json::from_str(&encrypted_keys)
        .map_err(|e| {
            tracing::error!("解析 API Keys 失败: {}", e);
            format!("解析 API Keys 失败: {}", e)
        })?;

    tracing::debug!("解析到 {} 个 API Keys", api_keys.len());

    // 获取活跃的 API Key 并解密（使用智能解密，处理已加密和未加密的情况）
    let decrypted_key = api_keys.iter()
        .find(|k| k.is_active)
        .map(|k| {
            let key_prefix = if k.key.len() >= 10 { &k.key[..10] } else { &k.key };
            tracing::debug!("找到活跃 API Key，存储长度: {}, 前缀: '{}'", k.key.len(), key_prefix);
            decrypt_api_key_smart(&k.key)
        })
        .transpose()
        .map_err(|e| {
            tracing::error!("解密 API Key 失败: {}", e);
            format!("解密 API Key 失败: {}", e)
        })?;

    let api_key = decrypted_key.ok_or("没有可用的 API 密钥")?;

    // 记录 API Key 的前缀用于调试（不记录完整 key）
    let api_key_prefix = if api_key.len() >= 10 { &api_key[..10] } else { &api_key };
    tracing::info!("准备测试 {} API 连接，API Key 前缀: '{}'", account_type, api_key_prefix);

    // 测试连接
    let result = test_api_connection(&account_type, &api_key).await;

    // 更新账户状态
    {
        let conn = db.lock().unwrap();
        let now = chrono::Utc::now().to_rfc3339();
        let new_status = if result.success { "active" } else { "error" };

        conn.execute(
            "UPDATE accounts_v2 SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![new_status, &now, &account_id],
        ).map_err(|e| {
            tracing::error!("更新账户状态失败: {}", e);
            format!("更新账户状态失败: {}", e)
        })?;

        // 如果测试成功且有余额信息，更新余额
        if result.success {
            if let Some(balance) = result.balance {
                conn.execute(
                    "UPDATE accounts_v2 SET current_balance = ?1, updated_at = ?2 WHERE id = ?3",
                    params![balance, &now, &account_id],
                ).map_err(|e| {
                    tracing::error!("更新账户余额失败: {}", e);
                    format!("更新账户余额失败: {}", e)
                })?;
            }
        }
    }

    tracing::info!(
        "账户 {} 连接测试{}",
        account_id,
        if result.success { "成功" } else { "失败" }
    );

    Ok(result)
}
