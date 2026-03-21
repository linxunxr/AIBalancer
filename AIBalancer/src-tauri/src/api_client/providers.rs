use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// API 测试结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiTestResult {
    pub success: bool,
    pub message: String,
    pub latency: Option<u64>,
    pub balance: Option<f64>,
    pub currency: Option<String>,
    pub details: Option<serde_json::Value>,
}

/// 余额信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BalanceInfo {
    pub balance: f64,
    pub currency: String,
    pub used: Option<f64>,
    pub total: Option<f64>,
}

/// 创建 HTTP 客户端
fn create_client() -> Result<Client, String> {
    tracing::debug!("创建 HTTP 客户端");
    Client::builder()
        .timeout(Duration::from_secs(30))
        .user_agent("AIBalancer/1.0")
        .build()
        .map_err(|e| {
            tracing::error!("创建 HTTP 客户端失败: {}", e);
            format!("创建 HTTP 客户端失败: {}", e)
        })
}

/// 测试 API 连接
pub async fn test_api_connection(
    provider: &str,
    api_key: &str,
) -> ApiTestResult {
    tracing::info!("测试 API 连接: {}", provider);
    let start = std::time::Instant::now();
    let client = match create_client() {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("创建客户端失败: {}", e);
            return ApiTestResult {
                success: false,
                message: e,
                latency: None,
                balance: None,
                currency: None,
                details: None,
            }
        }
    };

    let result = match provider {
        "deepseek" => test_deepseek_api(&client, api_key, start).await,
        "openai" => test_openai_api(&client, api_key, start).await,
        "anthropic" => test_anthropic_api(&client, api_key, start).await,
        "google" => test_google_api(&client, api_key, start).await,
        "azure" => test_azure_api(&client, api_key, start).await,
        _ => ApiTestResult {
            success: false,
            message: format!("不支持的提供商: {}", provider),
            latency: Some(start.elapsed().as_millis() as u64),
            balance: None,
            currency: None,
            details: None,
        },
    };

    if result.success {
        tracing::info!("API 连接测试成功: {} (延迟: {}ms)", provider, result.latency.unwrap_or(0));
    } else {
        tracing::warn!("API 连接测试失败: {} - {}", provider, result.message);
    }

    result
}

/// 获取账户余额
pub async fn get_account_balance(
    provider: &str,
    api_key: &str,
) -> Result<BalanceInfo, String> {
    tracing::info!("获取账户余额: {}", provider);
    let client = create_client()?;

    let result = match provider {
        "deepseek" => get_deepseek_balance(&client, api_key).await,
        "openai" => get_openai_balance(&client, api_key).await,
        "anthropic" => get_anthropic_balance(&client, api_key).await,
        "google" => get_google_balance(&client, api_key).await,
        "azure" => get_azure_balance(&client, api_key).await,
        _ => Err(format!("不支持的提供商: {}", provider)),
    };

    match &result {
        Ok(balance) => tracing::info!("获取余额成功: {} - {} {}", provider, balance.balance, balance.currency),
        Err(e) => tracing::error!("获取余额失败: {} - {}", provider, e),
    }

    result
}

// ==================== DeepSeek API ====================

#[derive(Debug, Deserialize)]
struct DeepSeekModelsResponse {
    object: String,
    data: Vec<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct DeepSeekBalanceResponse {
    is_available: bool,
    balance_infos: Vec<DeepSeekBalanceInfo>,
}

#[derive(Debug, Deserialize)]
struct DeepSeekBalanceInfo {
    currency: String,
    total_balance: String,
    granted_balance: String,
    topped_up_balance: String,
}

async fn test_deepseek_api(
    client: &Client,
    api_key: &str,
    start: std::time::Instant,
) -> ApiTestResult {
    let key_prefix = if api_key.len() >= 10 { &api_key[..10] } else { api_key };
    tracing::debug!("DeepSeek API 测试，API Key 前缀: '{}'", key_prefix);

    // 先尝试获取余额（这是最直接的验证方式）
    match get_deepseek_balance(client, api_key).await {
        Ok(balance) => ApiTestResult {
            success: true,
            message: "DeepSeek API 连接成功".to_string(),
            latency: Some(start.elapsed().as_millis() as u64),
            balance: Some(balance.balance),
            currency: Some(balance.currency),
            details: Some(serde_json::json!({
                "provider": "deepseek",
                "total": balance.total,
                "used": balance.used,
            })),
        },
        Err(e) => {
            tracing::warn!("DeepSeek 余额查询失败: {}，尝试 models 接口", e);
            // 如果余额接口失败，尝试模型列表接口验证 API Key
            let models_result = client
                .get("https://api.deepseek.com/v1/models")
                .header("Authorization", format!("Bearer {}", api_key))
                .send()
                .await;

            match models_result {
                Ok(resp) if resp.status().is_success() => ApiTestResult {
                    success: true,
                    message: "DeepSeek API Key 有效（无法获取余额）".to_string(),
                    latency: Some(start.elapsed().as_millis() as u64),
                    balance: Some(0.0),
                    currency: Some("CNY".to_string()),
                    details: None,
                },
                Ok(resp) => {
                    let status = resp.status();
                    // 获取响应体以便调试
                    let resp_body = resp.text().await.unwrap_or_default();
                    tracing::error!("DeepSeek API 认证失败: HTTP {}，响应体: {}", status, resp_body);
                    ApiTestResult {
                        success: false,
                        message: format!("DeepSeek API 认证失败: HTTP {}", status),
                        latency: Some(start.elapsed().as_millis() as u64),
                        balance: None,
                        currency: None,
                        details: None,
                    }
                },
                Err(e) => ApiTestResult {
                    success: false,
                    message: format!("DeepSeek API 连接失败: {}", e),
                    latency: Some(start.elapsed().as_millis() as u64),
                    balance: None,
                    currency: None,
                    details: None,
                },
            }
        }
    }
}

async fn get_deepseek_balance(client: &Client, api_key: &str) -> Result<BalanceInfo, String> {
    let key_prefix = if api_key.len() >= 10 { &api_key[..10] } else { api_key };
    tracing::debug!("调用 DeepSeek 余额接口，API Key 前缀: '{}'", key_prefix);

    let resp = client
        .get("https://api.deepseek.com/v1/user/balance")
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let status = resp.status();
    if !status.is_success() {
        // 获取响应体以便调试
        let resp_body = resp.text().await.unwrap_or_default();
        tracing::warn!("DeepSeek 余额接口返回非 200，状态码: {}，响应: {}", status, resp_body);
        return Err(format!("API 返回错误: HTTP {}", status));
    }

    let data: DeepSeekBalanceResponse = resp
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    if data.balance_infos.is_empty() {
        return Ok(BalanceInfo {
            balance: 0.0,
            currency: "CNY".to_string(),
            used: None,
            total: None,
        });
    }

    let info = &data.balance_infos[0];
    let total_balance: f64 = info.total_balance.parse().unwrap_or(0.0);

    Ok(BalanceInfo {
        balance: total_balance,
        currency: info.currency.clone(),
        used: None,
        total: Some(total_balance),
    })
}

// ==================== OpenAI API ====================

#[derive(Debug, Deserialize)]
struct OpenAIModelsResponse {
    object: String,
    data: Vec<serde_json::Value>,
}

async fn test_openai_api(
    client: &Client,
    api_key: &str,
    start: std::time::Instant,
) -> ApiTestResult {
    let result = client
        .get("https://api.openai.com/v1/models")
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await;

    match result {
        Ok(resp) if resp.status().is_success() => {
            let balance = get_openai_balance(client, api_key).await.ok();
            ApiTestResult {
                success: true,
                message: "OpenAI API 连接成功".to_string(),
                latency: Some(start.elapsed().as_millis() as u64),
                balance: balance.as_ref().map(|b| b.balance),
                currency: balance.as_ref().map(|b| b.currency.clone()),
                details: Some(serde_json::json!({
                    "provider": "openai",
                })),
            }
        }
        Ok(resp) => ApiTestResult {
            success: false,
            message: format!("OpenAI API 认证失败: HTTP {}", resp.status()),
            latency: Some(start.elapsed().as_millis() as u64),
            balance: None,
            currency: None,
            details: None,
        },
        Err(e) => ApiTestResult {
            success: false,
            message: format!("OpenAI API 连接失败: {}", e),
            latency: Some(start.elapsed().as_millis() as u64),
            balance: None,
            currency: None,
            details: None,
        },
    }
}

async fn get_openai_balance(_client: &Client, _api_key: &str) -> Result<BalanceInfo, String> {
    // OpenAI 没有公开的余额查询 API，需要使用仪表盘 API
    // 这里返回一个占位值，实际余额需要用户在仪表盘中查看
    Ok(BalanceInfo {
        balance: 0.0,
        currency: "USD".to_string(),
        used: None,
        total: None,
    })
}

// ==================== Anthropic API ====================

async fn test_anthropic_api(
    client: &Client,
    api_key: &str,
    start: std::time::Instant,
) -> ApiTestResult {
    // Anthropic 没有专门的验证端点，使用一个最小请求来验证
    let result = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": "claude-3-haiku-20240307",
            "max_tokens": 1,
            "messages": [{"role": "user", "content": "Hi"}]
        }))
        .send()
        .await;

    match result {
        Ok(resp) => {
            let status = resp.status();
            if status.is_success() || status.as_u16() == 400 {
                // 400 可能是因为请求格式，但证明 API Key 有效
                ApiTestResult {
                    success: true,
                    message: "Anthropic API 连接成功".to_string(),
                    latency: Some(start.elapsed().as_millis() as u64),
                    balance: None,
                    currency: Some("USD".to_string()),
                    details: Some(serde_json::json!({
                        "provider": "anthropic",
                    })),
                }
            } else {
                ApiTestResult {
                    success: false,
                    message: format!("Anthropic API 认证失败: HTTP {}", status),
                    latency: Some(start.elapsed().as_millis() as u64),
                    balance: None,
                    currency: None,
                    details: None,
                }
            }
        }
        Err(e) => ApiTestResult {
            success: false,
            message: format!("Anthropic API 连接失败: {}", e),
            latency: Some(start.elapsed().as_millis() as u64),
            balance: None,
            currency: None,
            details: None,
        },
    }
}

async fn get_anthropic_balance(_client: &Client, _api_key: &str) -> Result<BalanceInfo, String> {
    // Anthropic 没有公开的余额查询 API
    Ok(BalanceInfo {
        balance: 0.0,
        currency: "USD".to_string(),
        used: None,
        total: None,
    })
}

// ==================== Google AI API ====================

async fn test_google_api(
    client: &Client,
    api_key: &str,
    start: std::time::Instant,
) -> ApiTestResult {
    let result = client
        .get(format!(
            "https://generativelanguage.googleapis.com/v1beta/models?key={}",
            api_key
        ))
        .send()
        .await;

    match result {
        Ok(resp) if resp.status().is_success() => ApiTestResult {
            success: true,
            message: "Google AI API 连接成功".to_string(),
            latency: Some(start.elapsed().as_millis() as u64),
            balance: None,
            currency: None,
            details: Some(serde_json::json!({
                "provider": "google",
            })),
        },
        Ok(resp) => ApiTestResult {
            success: false,
            message: format!("Google AI API 认证失败: HTTP {}", resp.status()),
            latency: Some(start.elapsed().as_millis() as u64),
            balance: None,
            currency: None,
            details: None,
        },
        Err(e) => ApiTestResult {
            success: false,
            message: format!("Google AI API 连接失败: {}", e),
            latency: Some(start.elapsed().as_millis() as u64),
            balance: None,
            currency: None,
            details: None,
        },
    }
}

async fn get_google_balance(_client: &Client, _api_key: &str) -> Result<BalanceInfo, String> {
    // Google AI 没有公开的余额查询 API（免费层）
    Ok(BalanceInfo {
        balance: 0.0,
        currency: "USD".to_string(),
        used: None,
        total: None,
    })
}

// ==================== Azure OpenAI API ====================

async fn test_azure_api(
    _client: &Client,
    _api_key: &str,
    start: std::time::Instant,
) -> ApiTestResult {
    // Azure OpenAI 需要额外的端点配置
    ApiTestResult {
        success: false,
        message: "Azure OpenAI 需要配置端点 URL".to_string(),
        latency: Some(start.elapsed().as_millis() as u64),
        balance: None,
        currency: None,
        details: None,
    }
}

async fn get_azure_balance(_client: &Client, _api_key: &str) -> Result<BalanceInfo, String> {
    // Azure OpenAI 余额需要通过 Azure 门户查看
    Ok(BalanceInfo {
        balance: 0.0,
        currency: "USD".to_string(),
        used: None,
        total: None,
    })
}
