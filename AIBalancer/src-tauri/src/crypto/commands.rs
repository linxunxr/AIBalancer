use super::encryption::{encrypt_api_key, decrypt_api_key};
use serde::{Deserialize, Serialize};

/// 加密结果
#[derive(Debug, Serialize, Deserialize)]
pub struct CryptoResult {
    pub success: bool,
    pub data: Option<String>,
    pub error: Option<String>,
}

/// 加密 API Key 命令
#[tauri::command]
pub fn crypto_encrypt(api_key: String) -> CryptoResult {
    match encrypt_api_key(&api_key) {
        Ok(encrypted) => CryptoResult {
            success: true,
            data: Some(encrypted),
            error: None,
        },
        Err(e) => CryptoResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        },
    }
}

/// 解密 API Key 命令
#[tauri::command]
pub fn crypto_decrypt(encrypted: String) -> CryptoResult {
    match decrypt_api_key(&encrypted) {
        Ok(decrypted) => CryptoResult {
            success: true,
            data: Some(decrypted),
            error: None,
        },
        Err(e) => CryptoResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        },
    }
}

/// 测试加密功能
#[tauri::command]
pub fn crypto_test() -> CryptoResult {
    let test_key = "sk-test-1234567890";

    match encrypt_api_key(test_key) {
        Ok(encrypted) => match decrypt_api_key(&encrypted) {
            Ok(decrypted) => {
                if decrypted == test_key {
                    CryptoResult {
                        success: true,
                        data: Some("加密功能正常工作".to_string()),
                        error: None,
                    }
                } else {
                    CryptoResult {
                        success: false,
                        data: None,
                        error: Some("解密结果不匹配".to_string()),
                    }
                }
            }
            Err(e) => CryptoResult {
                success: false,
                data: None,
                error: Some(format!("解密失败: {}", e)),
            },
        },
        Err(e) => CryptoResult {
            success: false,
            data: None,
            error: Some(format!("加密失败: {}", e)),
        },
    }
}
