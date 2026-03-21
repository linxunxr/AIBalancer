use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

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
        // 强制使用开发模式，输出更多日志
        let mode = "development".to_string();

        let mut sources = HashMap::new();
        // 开发模式下所有模块都使用DEBUG级别
        sources.insert("system".to_string(), "DEBUG".to_string());
        sources.insert("balance".to_string(), "DEBUG".to_string());
        sources.insert("api".to_string(), "DEBUG".to_string());
        sources.insert("database".to_string(), "DEBUG".to_string());
        sources.insert("ui".to_string(), "DEBUG".to_string());
        sources.insert("update".to_string(), "DEBUG".to_string());
        sources.insert("plugin".to_string(), "DEBUG".to_string());
        sources.insert("account".to_string(), "DEBUG".to_string());
        sources.insert("crypto".to_string(), "DEBUG".to_string());
        sources.insert("tauri".to_string(), "DEBUG".to_string());

        Self {
            mode,
            default_level: "DEBUG".to_string(),
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

impl LogConfig {
    /// Save configuration to a YAML file
    pub fn save_to_file(&self, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let yaml = serde_yaml::to_string(self)?;
        std::fs::write(path, yaml)?;

        tracing::info!("Log config saved to {:?}", path);
        Ok(())
    }

    /// Load configuration from a YAML file
    pub fn load_from_file(path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        if !path.exists() {
            tracing::info!("Log config file not found at {:?}, using defaults", path);
            return Ok(Self::default());
        }

        let content = std::fs::read_to_string(path)?;
        let config: LogConfig = serde_yaml::from_str(&content)?;

        tracing::info!("Log config loaded from {:?}", path);
        Ok(config)
    }

    /// Get the default config file path (in software installation directory)
    pub fn get_default_config_path() -> std::path::PathBuf {
        std::env::current_dir()
            .unwrap_or_else(|_| std::path::PathBuf::from("."))
            .join("logs")
            .join("config")
            .join("config.yaml")
    }
}
