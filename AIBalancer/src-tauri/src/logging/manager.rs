use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use tracing::Level;
use tracing_subscriber::{
    fmt,
    layer::SubscriberExt,
    registry,
    util::SubscriberInitExt,
    EnvFilter,
    Layer,
};
use tracing_appender::{
    non_blocking::{NonBlocking, WorkerGuard},
    rolling::{RollingFileAppender},
};
use tracing_appender::rolling;
use flate2::{write::GzEncoder, Compression};
use tokio::fs;

use crate::logging::config::LogConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub id: String,
    pub timestamp: String,
    pub level: String,
    pub source: String,
    pub module: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogFileInfo {
    pub filename: String,
    pub path: String,
    pub size: u64,
    pub created: String,
    pub modified: String,
    pub compressed: bool,
    pub log_count: u32,
    pub period: LogPeriod,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogPeriod {
    pub start: String,
    pub end: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogQueryFilter {
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub levels: Option<Vec<String>>,
    pub sources: Option<Vec<String>>,
    pub modules: Option<Vec<String>>,
    pub keywords: Option<Vec<String>>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

pub struct LogManager {
    pub config: LogConfig,
    pub log_dir: PathBuf,
    _guard: Option<WorkerGuard>,
}

impl LogManager {
    pub fn new(config: LogConfig, log_dir: PathBuf) -> Self {
        Self {
            config,
            log_dir,
            _guard: None,
        }
    }

    pub fn init(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Create log directory if it doesn't exist
        std::fs::create_dir_all(&self.log_dir)?;

        // Build the subscriber
        let mut layers = Vec::new();

        // Console output layer
        if self.config.console_output {
            let console_layer = fmt::layer()
                .with_target(true)
                .with_thread_ids(true)
                .with_level(true)
                .boxed();
            layers.push(console_layer);
        }

        // File output layer with rotation
        if self.config.file_output {
            if let Some((non_blocking, guard)) = self.create_file_appender() {
                let file_layer = fmt::layer()
                    .with_target(true)
                    .with_thread_ids(true)
                    .with_level(true)
                    .with_ansi(false)
                    .with_writer(non_blocking)
                    .boxed();
                layers.push(file_layer);
                self._guard = Some(guard);
            }
        }

        // Build env filter based on config
        let filter = format!("{},{}",
            EnvFilter::from_default_env(),
            self.level_from_str(&self.config.default_level).to_string()
        );
        let env_filter = EnvFilter::new(filter);

        // Initialize the subscriber
        registry()
            .with(env_filter)
            .with(layers)
            .init();

        tracing::info!("Logging system initialized");

        Ok(())
    }

    fn create_file_appender(&self) -> Option<(NonBlocking, WorkerGuard)> {
        if !self.config.rotation.enabled {
            return None;
        }

        // Use daily rotation (tracing-appender 0.2.x uses constant DAILY constant not method
        let rotation = rolling::Rotation::DAILY;

        let appender = RollingFileAppender::builder()
            .rotation(rotation)
            .filename_prefix("aibalancer")
            .filename_suffix("log")
            .build(&self.log_dir)
            .ok()?;

        let (non_blocking, guard) = tracing_appender::non_blocking(appender);
        Some((non_blocking, guard))
    }

    fn level_from_str(&self, level: &str) -> Level {
        match level.to_uppercase().as_str() {
            "TRACE" => Level::TRACE,
            "DEBUG" => Level::DEBUG,
            "INFO" => Level::INFO,
            "WARN" | "WARNING" => Level::WARN,
            "ERROR" => Level::ERROR,
            _ => Level::INFO,
        }
    }

    pub fn get_config(&self) -> &LogConfig {
        &self.config
    }

    pub fn set_config(&mut self, config: LogConfig) {
        self.config = config;
    }

    pub async fn list_log_files(&self) -> Result<Vec<LogFileInfo>, Box<dyn std::error::Error>> {
        let mut result = Vec::new();
        let mut entries = fs::read_dir(&self.log_dir).await?;

        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if !path.is_file() {
                continue;
            }

            let metadata = fs::metadata(&path).await?;
            let filename = entry.file_name().into_string().unwrap_or_default();

            // Skip non-log files
            if !(filename.ends_with(".log") || filename.ends_with(".gz")) {
                continue;
            }

            let created = metadata.created()?;
            let modified = metadata.modified()?;

            result.push(LogFileInfo {
                filename: filename.clone(),
                path: path.to_string_lossy().to_string(),
                size: metadata.len(),
                created: Self::format_time(created),
                modified: Self::format_time(modified),
                compressed: filename.ends_with(".gz"),
                log_count: 0,
                period: LogPeriod {
                    start: Self::format_time(created),
                    end: Self::format_time(modified),
                },
            });
        }

        Ok(result)
    }

    pub async fn clean_old_logs(&mut self) -> Result<(u32, u64), Box<dyn std::error::Error>> {
        let retention = self.config.rotation.retention_days;
        let mut deleted = 0;
        let mut freed_bytes = 0;

        let mut entries = fs::read_dir(&self.log_dir).await?;
        let now = SystemTime::now();

        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if !path.is_file() {
                continue;
            }

            let metadata = fs::metadata(&path).await?;
            if let Ok(modified) = metadata.modified() {
                if let Ok(elapsed) = now.duration_since(modified) {
                    let days = elapsed.as_secs() / (24 * 3600);
                    if days > retention as u64 {
                        freed_bytes += metadata.len();
                        fs::remove_file(&path).await?;
                        deleted += 1;
                    }
                }
            }
        }

        tracing::info!("Cleaned {} old logs, freed {} bytes", deleted, freed_bytes);

        Ok((deleted, freed_bytes))
    }

    pub fn format_time(time: SystemTime) -> String {
        let datetime: DateTime<Local> = time.into();
        datetime.to_rfc3339()
    }

    pub async fn compress_old_logs(&self) -> Result<(), Box<dyn std::error::Error>> {
        if !self.config.rotation.compression {
            return Ok(());
        }

        let mut entries = fs::read_dir(&self.log_dir).await?;

        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if !path.is_file() {
                continue;
            }

            let filename = entry.file_name().into_string().unwrap_or_default();
            if !filename.ends_with(".log") || filename == "aibalancer.log" {
                continue;
            }

            // Skip if already compressed
            if std::fs::metadata(path.with_extension("log.gz")).is_ok() {
                continue;
            }

            self.compress_file(&path).await?;
            fs::remove_file(&path).await?;
        }

        Ok(())
    }

    async fn compress_file(&self, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        let content = fs::read(path).await?;
        let gz_path = path.with_extension("log.gz");
        let mut encoder = GzEncoder::new(
            Vec::new(),
            Compression::new(self.config.rotation.compression_level),
        );
        encoder.write_all(&content)?;
        let compressed = encoder.finish()?;
        fs::write(&gz_path, compressed).await?;
        Ok(())
    }
}
