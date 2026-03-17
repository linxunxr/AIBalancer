use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogConfig {
    pub mode: String, // "development" | "production" | "testing"
    pub default_level: String,
    pub console_output: bool,
    pub file_output: bool,
    pub rotation: RotationConfig,
    pub sources: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotationConfig {
    pub enabled: bool,
    pub max_size: u64, // 字节
    pub max_files: u32,
    pub compression: bool,
    pub compression_level: u32, // 1-9
    pub retention_days: u32,
}

impl Default for LogConfig {
    fn default() -> Self {
        let mode = if cfg!(debug_assertions) {
            "development"
        } else {
            "production"
        }
        .to_string();

        let mut sources = HashMap::new();
        sources.insert("system".to_string(), "INFO".to_string());
        sources.insert("balance".to_string(), "DEBUG".to_string());
        sources.insert("api".to_string(), "INFO".to_string());
        sources.insert("database".to_string(), "WARN".to_string());
        sources.insert("ui".to_string(), "INFO".to_string());
        sources.insert("update".to_string(), "INFO".to_string());
        sources.insert("plugin".to_string(), "DEBUG".to_string());

        Self {
            mode,
            default_level: "INFO".to_string(),
            console_output: true,
            file_output: true,
            rotation: RotationConfig {
                enabled: true,
                max_size: 10 * 1024 * 1024, // 10MB
                max_files: 10,
                compression: true,
                compression_level: 6,
                retention_days: 30,
            },
            sources,
        }
    }
}
