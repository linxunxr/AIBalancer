use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
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
use crate::logging::error_report::{ErrorReportManager, setup_panic_hook, collect_performance_data};

/// Configuration file name
const CONFIG_FILE_NAME: &str = "config.yaml";

/// Default cleanup interval in seconds (24 hours)
const DEFAULT_CLEANUP_INTERVAL_SECS: u64 = 24 * 60 * 60;

/// Default performance monitoring interval in seconds (60 seconds)
const DEFAULT_PERF_MONITOR_INTERVAL_SECS: u64 = 60;

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
    pub config_dir: PathBuf,
    _guard: Option<WorkerGuard>,
    error_report_manager: Option<ErrorReportManager>,
    cleanup_running: Arc<AtomicBool>,
    perf_monitor_running: Arc<AtomicBool>,
}

impl LogManager {
    pub fn new(config: LogConfig, log_dir: PathBuf) -> Self {
        // Config is stored in the log directory (software installation directory)
        let config_dir = log_dir.join("config");

        Self {
            config,
            log_dir,
            config_dir,
            _guard: None,
            error_report_manager: None,
            cleanup_running: Arc::new(AtomicBool::new(false)),
            perf_monitor_running: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Create a LogManager with auto-detected paths (uses current directory)
    pub fn with_default_paths() -> Self {
        let config = LogConfig::default();
        // Use current directory (software installation directory) instead of APPDATA
        let log_dir = std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("logs");

        Self::new(config, log_dir)
    }

    pub fn init(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Create log directory if it doesn't exist
        std::fs::create_dir_all(&self.log_dir)?;

        // Create config directory
        std::fs::create_dir_all(&self.config_dir)?;

        // Try to load config from file, use defaults if not found
        let config_path = self.config_dir.join(CONFIG_FILE_NAME);
        if config_path.exists() {
            match LogConfig::load_from_file(&config_path) {
                Ok(loaded_config) => {
                    self.config = loaded_config;
                    tracing::info!("Loaded logging config from {:?}", config_path);
                }
                Err(e) => {
                    tracing::warn!("Failed to load logging config, using defaults: {}", e);
                }
            }
        } else {
            // Save default config
            if let Err(e) = self.config.save_to_file(&config_path) {
                tracing::warn!("Failed to save default logging config: {}", e);
            }
        }

        // Initialize error report manager
        self.error_report_manager = Some(ErrorReportManager::new(&self.log_dir));

        // Setup panic hook for crash reporting
        setup_panic_hook(self.log_dir.clone());

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
                    .json()  // Use JSON format
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
        tracing::info!("Error reporting enabled - panic reports will be saved to {:?}", self.log_dir.join("panics"));

        // Start background cleanup task
        self.start_cleanup_task();

        // Start performance monitoring
        self.start_performance_monitoring();

        Ok(())
    }

    /// Start performance monitoring task
    fn start_performance_monitoring(&self) {
        // Don't start if already running
        if self.perf_monitor_running.swap(true, Ordering::SeqCst) {
            tracing::debug!("Performance monitoring already running");
            return;
        }

        let running = self.perf_monitor_running.clone();

        std::thread::spawn(move || {
            tracing::info!("Performance monitoring started");

            loop {
                // Check if we should stop
                if !running.load(Ordering::SeqCst) {
                    break;
                }

                // Sleep for the monitoring interval
                std::thread::sleep(std::time::Duration::from_secs(DEFAULT_PERF_MONITOR_INTERVAL_SECS));

                // Check again after sleeping
                if !running.load(Ordering::SeqCst) {
                    break;
                }

                // Collect and log performance data
                let perf = collect_performance_data();
                tracing::debug!(
                    memory_usage_percent = perf.memory.usage_percent,
                    memory_used_mb = perf.memory.used_mb,
                    cpu_usage_percent = perf.cpu.usage_percent,
                    disk_usage_percent = perf.disk.usage_percent,
                    "Performance metrics"
                );

                // Warn if resource usage is high
                if perf.memory.usage_percent > 80.0 {
                    tracing::warn!(
                        usage_percent = perf.memory.usage_percent,
                        "High memory usage detected"
                    );
                }

                if perf.cpu.usage_percent > 90.0 {
                    tracing::warn!(
                        usage_percent = perf.cpu.usage_percent,
                        "High CPU usage detected"
                    );
                }

                if perf.disk.usage_percent > 90.0 {
                    tracing::warn!(
                        usage_percent = perf.disk.usage_percent,
                        available_gb = perf.disk.available_gb,
                        "Low disk space detected"
                    );
                }
            }

            tracing::info!("Performance monitoring stopped");
        });
    }

    /// Stop the performance monitoring task
    pub fn stop_performance_monitoring(&self) {
        self.perf_monitor_running.store(false, Ordering::SeqCst);
    }

    /// Start the background cleanup task
    fn start_cleanup_task(&self) {
        // Don't start if already running
        if self.cleanup_running.swap(true, Ordering::SeqCst) {
            tracing::debug!("Cleanup task already running");
            return;
        }

        let log_dir = self.log_dir.clone();
        let retention_days = self.config.rotation.retention_days;
        let running = self.cleanup_running.clone();

        std::thread::spawn(move || {
            tracing::info!("Log cleanup task started (retention: {} days)", retention_days);

            loop {
                // Check if we should stop
                if !running.load(Ordering::SeqCst) {
                    break;
                }

                // Sleep for the cleanup interval
                std::thread::sleep(std::time::Duration::from_secs(DEFAULT_CLEANUP_INTERVAL_SECS));

                // Check again after sleeping
                if !running.load(Ordering::SeqCst) {
                    break;
                }

                // Perform cleanup
                if let Err(e) = Self::do_cleanup(&log_dir, retention_days) {
                    tracing::error!("Log cleanup failed: {}", e);
                }
            }

            tracing::info!("Log cleanup task stopped");
        });
    }

    /// Perform the actual cleanup (static method for background thread)
    fn do_cleanup(log_dir: &PathBuf, retention_days: u32) -> Result<(u32, u64), Box<dyn std::error::Error + Send + Sync>> {
        let mut deleted = 0u32;
        let mut freed_bytes = 0u64;
        let now = SystemTime::now();

        if !log_dir.exists() {
            return Ok((0, 0));
        }

        for entry in std::fs::read_dir(log_dir)? {
            let entry = entry?;
            let path = entry.path();

            if !path.is_file() {
                continue;
            }

            if let Ok(metadata) = entry.metadata() {
                if let Ok(modified) = metadata.modified() {
                    if let Ok(elapsed) = now.duration_since(modified) {
                        let days = elapsed.as_secs() / (24 * 3600);
                        if days > retention_days as u64 {
                            freed_bytes += metadata.len();
                            std::fs::remove_file(&path)?;
                            deleted += 1;
                            tracing::debug!("Cleaned old log file: {:?}", path);
                        }
                    }
                }
            }
        }

        if deleted > 0 {
            tracing::info!("Automatic cleanup: deleted {} old logs, freed {} bytes", deleted, freed_bytes);
        }

        Ok((deleted, freed_bytes))
    }

    /// Stop the cleanup task
    pub fn stop_cleanup_task(&self) {
        self.cleanup_running.store(false, Ordering::SeqCst);
    }

    /// Stop all background tasks
    pub fn stop_all_tasks(&self) {
        self.stop_cleanup_task();
        self.stop_performance_monitoring();
        tracing::info!("All background tasks stopped");
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

    /// Save current config to file
    pub fn save_config(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_path = self.config_dir.join(CONFIG_FILE_NAME);
        self.config.save_to_file(&config_path)
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

    /// Log an error from the frontend
    pub fn log_error(
        &self,
        error_type: &str,
        message: &str,
        stack_trace: Option<&str>,
        context: Option<serde_json::Value>,
    ) -> Result<String, Box<dyn std::error::Error>> {
        // Log to tracing
        tracing::error!(
            error_type = error_type,
            message = message,
            "Frontend error reported"
        );

        // Create error report if manager is available
        if let Some(ref manager) = self.error_report_manager {
            manager.create_error_report(error_type, message, stack_trace, context)
        } else {
            Ok("error-report-manager-not-initialized".to_string())
        }
    }

    /// Log an info event (for tracking)
    pub fn log_info(&self, source: &str, message: &str) {
        tracing::info!(source = source, message = message, "Frontend event");
    }

    /// Log a warning event
    pub fn log_warning(&self, source: &str, message: &str) {
        tracing::warn!(source = source, message = message, "Frontend warning");
    }

    /// Track an analytics event
    pub fn track_event(&self, event_name: &str, properties: Option<serde_json::Value>) {
        tracing::info!(
            event = event_name,
            properties = ?properties,
            "Analytics event"
        );
    }
}
