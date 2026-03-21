use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

/// 代理配置结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    /// 是否启用代理
    pub enabled: bool,
    /// 代理类型
    pub proxy_type: ProxyType,
    /// 代理地址
    pub host: String,
    /// 代理端口
    pub port: u16,
    /// 代理协议（http, https, socks5）
    pub protocol: String,
    /// 认证用户名（可选）
    pub username: Option<String>,
    /// 认证密码（加密存储）
    pub password: Option<String>,
    /// 需要代理的域名列表
    pub bypass_list: Vec<String>,
    /// 排除的域名列表
    pub exclude_list: Vec<String>,
    /// 是否对所有请求使用代理
    pub global: bool,
    /// 是否启用代理认证
    pub auth_enabled: bool,
}

/// 代理类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProxyType {
    /// HTTP代理
    Http,
    /// HTTPS代理
    Https,
    /// SOCKS5代理
    Socks5,
    /// 系统代理
    System,
    /// 无代理
    None,
}

/// 代理测试结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyTestResult {
    /// 是否成功
    pub success: bool,
    /// 响应时间（毫秒）
    pub latency: u64,
    /// 错误信息
    pub error: Option<String>,
    /// 代理响应内容
    pub response: Option<String>,
}

/// 代理状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyStatus {
    /// 代理是否启用
    pub enabled: bool,
    /// 代理类型
    pub proxy_type: ProxyType,
    /// 连接状态
    pub connection_status: ConnectionStatus,
    /// 最后测试时间
    pub last_test: Option<String>,
    /// 最后成功连接时间
    pub last_success: Option<String>,
}

/// 连接状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConnectionStatus {
    /// 已连接
    Connected,
    /// 未连接
    Disconnected,
    /// 连接中
    Connecting,
    /// 连接失败
    Failed,
    /// 超时
    Timeout,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            proxy_type: ProxyType::None,
            host: String::new(),
            port: 0,
            protocol: "http".to_string(),
            username: None,
            password: None,
            bypass_list: vec![
                "localhost".to_string(),
                "127.0.0.1".to_string(),
                "::1".to_string(),
            ],
            exclude_list: vec![],
            global: false,
            auth_enabled: false,
        }
    }
}

/// 获取代理配置
#[tauri::command]
pub fn get_proxy_config(db: State<'_, Mutex<Connection>>) -> Result<ProxyConfig, String> {
    let conn = db.lock().map_err(|e| format!("数据库锁失败: {}", e))?;

    let config_json: Option<String> = conn
        .query_row(
            "SELECT config FROM app_config WHERE key = 'proxy_config' LIMIT 1",
            [],
            |row: &rusqlite::Row| row.get(0),
        )
        .ok();

    match config_json {
        Some(json) => {
            serde_json::from_str(&json)
                .map_err(|e| format!("解析配置失败: {}", e))
        }
        None => Ok(ProxyConfig::default()),
    }
}

/// 保存代理配置
#[tauri::command]
pub fn save_proxy_config(
    db: State<'_, Mutex<Connection>>,
    config: ProxyConfig,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| format!("数据库锁失败: {}", e))?;
    let config_json = serde_json::to_string(&config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;

    let now = chrono::Utc::now().to_rfc3339();

    // 使用 UPSERT
    conn.execute(
        "INSERT INTO app_config (key, config, updated_at)
         VALUES ('proxy_config', ?1, ?2)
         ON CONFLICT(key) DO UPDATE SET config = ?1, updated_at = ?2",
        params![&config_json, &now],
    )
    .map_err(|e| format!("保存配置失败: {}", e))?;

    tracing::info!("代理配置已保存");
    Ok(())
}

/// 测试代理连接
#[tauri::command]
pub async fn test_proxy_connection(config: ProxyConfig) -> Result<ProxyTestResult, String> {
    use std::time::Instant;

    let start = Instant::now();

    // 构建代理URL
    let proxy_url = match (&config.username, &config.password) {
        (Some(user), Some(pass)) => {
            format!(
                "{}://{}:{}@{}:{}",
                config.protocol, user, pass, config.host, config.port
            )
        }
        _ => {
            format!(
                "{}://{}:{}",
                config.protocol, config.host, config.port
            )
        }
    };

    // 根据协议类型创建带代理的HTTP客户端
    let client_builder = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10));

    // 在 Client 上设置代理
    let client = match config.protocol.as_str() {
        "http" => {
            client_builder
                .proxy(reqwest::Proxy::http(&proxy_url).map_err(|e| format!("代理配置错误: {}", e))?)
                .build()
                .map_err(|e| format!("创建HTTP客户端失败: {}", e))?
        }
        "https" => {
            client_builder
                .proxy(reqwest::Proxy::https(&proxy_url).map_err(|e| format!("代理配置错误: {}", e))?)
                .build()
                .map_err(|e| format!("创建HTTP客户端失败: {}", e))?
        }
        "socks5" => {
            // reqwest 0.12 使用 all 方法处理 SOCKS5
            client_builder
                .proxy(reqwest::Proxy::all(&proxy_url).map_err(|e| format!("代理配置错误: {}", e))?)
                .build()
                .map_err(|e| format!("创建HTTP客户端失败: {}", e))?
        }
        _ => {
            return Err(format!("不支持的代理协议: {}", config.protocol));
        }
    };

    // 测试连接到代理
    let test_url = "https://httpbin.org/ip";

    let latency = start.elapsed().as_millis() as u64;

    match client.get(test_url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                let body = response.text().await.unwrap_or_default();
                Ok(ProxyTestResult {
                    success: true,
                    latency,
                    error: None,
                    response: Some(body),
                })
            } else {
                Ok(ProxyTestResult {
                    success: false,
                    latency,
                    error: Some(format!("HTTP错误: {}", response.status())),
                    response: None,
                })
            }
        }
        Err(e) => {
            Ok(ProxyTestResult {
                success: false,
                latency,
                error: Some(format!("连接失败: {}", e)),
                response: None,
            })
        }
    }
}

/// 获取代理状态
#[tauri::command]
pub fn get_proxy_status(db: State<'_, Mutex<Connection>>) -> Result<ProxyStatus, String> {
    let config = get_proxy_config(db)?;

    let status = ProxyStatus {
        enabled: config.enabled,
        proxy_type: config.proxy_type,
        connection_status: if config.enabled {
            ConnectionStatus::Disconnected
        } else {
            ConnectionStatus::Disconnected
        },
        last_test: None,
        last_success: None,
    };

    Ok(status)
}

/// 清除代理配置
#[tauri::command]
pub fn clear_proxy_config(db: State<'_, Mutex<Connection>>) -> Result<(), String> {
    let conn = db.lock().map_err(|e| format!("数据库锁失败: {}", e))?;

    conn.execute(
        "DELETE FROM app_config WHERE key = 'proxy_config'",
        [],
    )
    .map_err(|e| format!("清除配置失败: {}", e))?;

    tracing::info!("代理配置已清除");
    Ok(())
}

/// 检查域名是否应该使用代理
#[tauri::command]
pub fn should_use_proxy(host: String, config: ProxyConfig) -> bool {
    if !config.enabled {
        return false;
    }

    // 检查是否在排除列表中
    if config.exclude_list.iter().any(|pattern| {
        if pattern.starts_with('*') {
            host.ends_with(&pattern[1..])
        } else {
            host == *pattern
        }
    }) {
        return false;
    }

    // 检查是否在绕过列表中（绕过列表不适用代理）
    if config.bypass_list.iter().any(|pattern| {
        if pattern.starts_with('*') {
            host.ends_with(&pattern[1..])
        } else {
            host == *pattern
        }
    }) {
        return false;
    }

    config.global || true
}
