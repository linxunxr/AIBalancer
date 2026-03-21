use super::providers::{test_api_connection, get_account_balance, ApiTestResult, BalanceInfo};
use serde::Deserialize;

/// API 测试参数
#[derive(Debug, Deserialize)]
pub struct ApiTestParams {
    pub provider: String,
    pub api_key: String,
}

/// API 测试命令
#[tauri::command]
pub async fn api_test_connection(params: ApiTestParams) -> ApiTestResult {
    test_api_connection(&params.provider, &params.api_key).await
}

/// 余额查询命令
#[tauri::command]
pub async fn api_get_balance(provider: String, api_key: String) -> Result<BalanceInfo, String> {
    get_account_balance(&provider, &api_key).await
}

/// 批量测试 API 连接
#[tauri::command]
pub async fn api_test_batch(accounts: Vec<(String, String)>) -> Vec<ApiTestResult> {
    let mut results = Vec::new();
    for (provider, api_key) in accounts {
        let result = test_api_connection(&provider, &api_key).await;
        results.push(result);
    }
    results
}
