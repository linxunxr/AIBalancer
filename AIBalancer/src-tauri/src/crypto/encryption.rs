use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::RngCore;
use std::sync::OnceLock;

/// 加密密钥服务名称
const SERVICE_NAME: &str = "aibalancer";

/// 加密密钥账户名称
const KEY_ACCOUNT: &str = "encryption_key";

/// 全局加密器实例
static ENCRYPTOR: OnceLock<Encryptor> = OnceLock::new();

/// 加密错误类型
#[derive(Debug)]
pub enum CryptoError {
    KeyGenerationFailed(String),
    EncryptionFailed(String),
    DecryptionFailed(String),
    InvalidData(String),
    KeyringError(String),
}

impl std::fmt::Display for CryptoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CryptoError::KeyGenerationFailed(msg) => write!(f, "密钥生成失败: {}", msg),
            CryptoError::EncryptionFailed(msg) => write!(f, "加密失败: {}", msg),
            CryptoError::DecryptionFailed(msg) => write!(f, "解密失败: {}", msg),
            CryptoError::InvalidData(msg) => write!(f, "无效数据: {}", msg),
            CryptoError::KeyringError(msg) => write!(f, "密钥环错误: {}", msg),
        }
    }
}

impl std::error::Error for CryptoError {}

/// 加密器
pub struct Encryptor {
    cipher: Aes256Gcm,
}

impl Encryptor {
    /// 创建新的加密器实例
    pub fn new() -> Result<Self, CryptoError> {
        let key = Self::get_or_create_key()?;
        let cipher = Aes256Gcm::new_from_slice(&key)
            .map_err(|e| CryptoError::KeyGenerationFailed(e.to_string()))?;
        Ok(Self { cipher })
    }

    /// 获取或创建加密密钥
    fn get_or_create_key() -> Result<[u8; 32], CryptoError> {
        // 尝试从系统密钥环获取密钥
        #[cfg(not(target_os = "linux"))]
        {
            if let Ok(keyring) = keyring::Entry::new(SERVICE_NAME, KEY_ACCOUNT) {
                if let Ok(key_b64) = keyring.get_password() {
                    if let Ok(key_bytes) = BASE64.decode(&key_b64) {
                        if key_bytes.len() == 32 {
                            let mut key = [0u8; 32];
                            key.copy_from_slice(&key_bytes);
                            return Ok(key);
                        }
                    }
                }
            }
        }

        // 生成新密钥
        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);

        // 尝试保存到密钥环（失败不影响使用）
        #[cfg(not(target_os = "linux"))]
        {
            if let Ok(keyring) = keyring::Entry::new(SERVICE_NAME, KEY_ACCOUNT) {
                let _ = keyring.set_password(&BASE64.encode(&key));
            }
        }

        Ok(key)
    }

    /// 加密数据
    pub fn encrypt(&self, plaintext: &str) -> Result<String, CryptoError> {
        // 生成随机 nonce
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // 加密
        let ciphertext = self
            .cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

        // 组合 nonce 和 ciphertext，然后 base64 编码
        let mut combined = nonce_bytes.to_vec();
        combined.extend_from_slice(&ciphertext);

        Ok(BASE64.encode(&combined))
    }

    /// 解密数据
    pub fn decrypt(&self, encrypted: &str) -> Result<String, CryptoError> {
        // Base64 解码
        let combined = BASE64
            .decode(encrypted)
            .map_err(|e| CryptoError::InvalidData(e.to_string()))?;

        if combined.len() < 12 {
            return Err(CryptoError::InvalidData("数据过短".to_string()));
        }

        // 分离 nonce 和 ciphertext
        let nonce = Nonce::from_slice(&combined[..12]);
        let ciphertext = &combined[12..];

        // 解密
        let plaintext = self
            .cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

        String::from_utf8(plaintext).map_err(|e| CryptoError::InvalidData(e.to_string()))
    }
}

/// 获取全局加密器实例
pub fn get_encryptor() -> &'static Encryptor {
    ENCRYPTOR.get_or_init(|| {
        Encryptor::new().expect("Failed to initialize encryptor")
    })
}

/// 加密 API Key
pub fn encrypt_api_key(api_key: &str) -> Result<String, CryptoError> {
    let encryptor = get_encryptor();
    encryptor.encrypt(api_key)
}

/// 解密 API Key
pub fn decrypt_api_key(encrypted: &str) -> Result<String, CryptoError> {
    let encryptor = get_encryptor();
    encryptor.decrypt(encrypted)
}

/// 检查字符串是否已加密（以特定前缀开头）
pub fn is_encrypted(value: &str) -> bool {
    // 加密后的数据是 base64 格式，且长度 >= 16 (12 bytes nonce + 至少 4 bytes ciphertext)
    // 我们用特定前缀标记加密数据
    value.starts_with("ENC:") || (value.len() >= 16 && value.chars().all(|c| c.is_alphanumeric() || c == '+' || c == '/' || c == '='))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let encryptor = Encryptor::new().unwrap();
        let original = "sk-test-api-key-123456";
        let encrypted = encryptor.encrypt(original).unwrap();
        let decrypted = encryptor.decrypt(&encrypted).unwrap();
        assert_eq!(original, decrypted);
    }

    #[test]
    fn test_different_encryptions() {
        let encryptor = Encryptor::new().unwrap();
        let original = "test-key";
        let enc1 = encryptor.encrypt(original).unwrap();
        let enc2 = encryptor.encrypt(original).unwrap();
        // 每次加密结果应该不同（因为 nonce 不同）
        assert_ne!(enc1, enc2);
        // 但解密后应该相同
        assert_eq!(encryptor.decrypt(&enc1).unwrap(), encryptor.decrypt(&enc2).unwrap());
    }
}
