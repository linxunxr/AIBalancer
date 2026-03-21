use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::sync::OnceLock;
use crate::logging::filter::{filter_sensitive_json, filter_sensitive_string};
use sysinfo::{System, Disks};

/// Error report structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorReport {
    pub id: String,
    pub timestamp: String,
    pub error_type: String,
    pub message: String,
    pub stack_trace: Option<String>,
    pub context: Option<serde_json::Value>,
    pub system_info: SystemInfo,
}

/// System information for error reports
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub app_version: String,
    pub rust_version: String,
}

impl Default for SystemInfo {
    fn default() -> Self {
        Self {
            os: std::env::consts::OS.to_string(),
            arch: std::env::consts::ARCH.to_string(),
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            rust_version: "stable".to_string(), // Simplified version info
        }
    }
}

/// Panic information captured from panic hook
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PanicInfo {
    pub timestamp: String,
    pub message: String,
    pub location: Option<String>,
    pub backtrace: Option<String>,
    pub system_info: SystemInfo,
}

/// Error report manager
pub struct ErrorReportManager {
    error_dir: PathBuf,
    panic_dir: PathBuf,
    system_info: SystemInfo,
}

impl ErrorReportManager {
    pub fn new(log_dir: &PathBuf) -> Self {
        let error_dir = log_dir.join("errors");
        let panic_dir = log_dir.join("panics");

        // Create directories
        let _ = fs::create_dir_all(&error_dir);
        let _ = fs::create_dir_all(&panic_dir);

        Self {
            error_dir,
            panic_dir,
            system_info: SystemInfo::default(),
        }
    }

    /// Create an error report from an error
    pub fn create_error_report(
        &self,
        error_type: &str,
        message: &str,
        stack_trace: Option<&str>,
        context: Option<serde_json::Value>,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let id = uuid::Uuid::new_v4().to_string();
        let timestamp = Utc::now().to_rfc3339();

        // Filter sensitive information
        let filtered_message = filter_sensitive_string(message);
        let filtered_stack_trace = stack_trace.map(|s| filter_sensitive_string(s));
        let filtered_context = context.map(|c| filter_sensitive_json(&c));

        let report = ErrorReport {
            id: id.clone(),
            timestamp,
            error_type: error_type.to_string(),
            message: filtered_message,
            stack_trace: filtered_stack_trace,
            context: filtered_context,
            system_info: self.system_info.clone(),
        };

        let filename = format!("error-{}.json", chrono::Local::now().format("%Y%m%d_%H%M%S"));
        let filepath = self.error_dir.join(&filename);

        let content = serde_json::to_string_pretty(&report)?;
        fs::write(&filepath, content)?;

        tracing::error!("Error report created: {} at {:?}", id, filepath);

        Ok(id)
    }

    /// Create a panic report
    pub fn create_panic_report(
        &self,
        panic_info: &PanicInfo,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let id = uuid::Uuid::new_v4().to_string();
        let filename = format!("panic-{}.json", chrono::Local::now().format("%Y%m%d_%H%M%S"));
        let filepath = self.panic_dir.join(&filename);

        // Filter sensitive information from panic info
        let filtered_panic_info = PanicInfo {
            timestamp: panic_info.timestamp.clone(),
            message: filter_sensitive_string(&panic_info.message),
            location: panic_info.location.as_ref().map(|l| filter_sensitive_string(l)),
            backtrace: panic_info.backtrace.as_ref().map(|b| filter_sensitive_string(b)),
            system_info: panic_info.system_info.clone(),
        };

        let content = serde_json::to_string_pretty(&filtered_panic_info)?;
        fs::write(&filepath, content)?;

        // Also write to panic.log for quick access
        let panic_log = self.panic_dir.join("panic.log");
        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&panic_log)
        {
            let _ = writeln!(file, "[{}] {}", filtered_panic_info.timestamp, filtered_panic_info.message);
        }

        Ok(id)
    }

    /// Get all error reports
    pub fn list_error_reports(&self) -> Result<Vec<ErrorReportMeta>, Box<dyn std::error::Error>> {
        let mut reports = Vec::new();

        if !self.error_dir.exists() {
            return Ok(reports);
        }

        for entry in fs::read_dir(&self.error_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().map(|e| e == "json").unwrap_or(false) {
                if let Ok(metadata) = entry.metadata() {
                    reports.push(ErrorReportMeta {
                        filename: path.file_name().unwrap().to_string_lossy().to_string(),
                        path: path.to_string_lossy().to_string(),
                        size: metadata.len(),
                        created: metadata.created()
                            .map(|t| {
                                let datetime: chrono::DateTime<chrono::Local> = t.into();
                                datetime.to_rfc3339()
                            })
                            .unwrap_or_default(),
                    });
                }
            }
        }

        // Sort by creation time, newest first
        reports.sort_by(|a, b| b.created.cmp(&a.created));

        Ok(reports)
    }

    /// Clean old error reports
    pub fn clean_old_reports(&self, retention_days: u32) -> Result<(u32, u64), Box<dyn std::error::Error>> {
        let mut deleted = 0u32;
        let mut freed_bytes = 0u64;
        let now = std::time::SystemTime::now();

        for dir in [&self.error_dir, &self.panic_dir] {
            if !dir.exists() {
                continue;
            }

            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();

                if let Ok(metadata) = entry.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        if let Ok(elapsed) = now.duration_since(modified) {
                            let days = elapsed.as_secs() / (24 * 3600);
                            if days > retention_days as u64 {
                                freed_bytes += metadata.len();
                                fs::remove_file(&path)?;
                                deleted += 1;
                            }
                        }
                    }
                }
            }
        }

        Ok((deleted, freed_bytes))
    }
}

/// Error report metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorReportMeta {
    pub filename: String,
    pub path: String,
    pub size: u64,
    pub created: String,
}

/// Setup panic hook to capture panics
pub fn setup_panic_hook(log_dir: PathBuf) {
    let error_manager = std::sync::Arc::new(ErrorReportManager::new(&log_dir));

    std::panic::set_hook(Box::new(move |panic_info| {
        // Extract panic message
        let message = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "Unknown panic".to_string()
        };

        // Extract location
        let location = panic_info.location().map(|loc| {
            format!("{}:{}:{}", loc.file(), loc.line(), loc.column())
        });

        // Get backtrace
        let backtrace = std::backtrace::Backtrace::capture();
        let backtrace_str = if backtrace.status() == std::backtrace::BacktraceStatus::Captured {
            Some(format!("{:?}", backtrace))
        } else {
            None
        };

        let panic_report = PanicInfo {
            timestamp: Utc::now().to_rfc3339(),
            message: message.clone(),
            location,
            backtrace: backtrace_str,
            system_info: SystemInfo::default(),
        };

        // Write panic report
        if let Err(e) = error_manager.create_panic_report(&panic_report) {
            eprintln!("Failed to write panic report: {}", e);
        }

        // Log to tracing
        tracing::error!(
            "Application panic: {} at {:?}",
            message,
            panic_report.location
        );

        // Also write to stderr
        eprintln!("\n========================================");
        eprintln!("APPLICATION PANIC");
        eprintln!("========================================");
        eprintln!("Message: {}", message);
        if let Some(ref loc) = panic_report.location {
            eprintln!("Location: {}", loc);
        }
        eprintln!("A panic report has been saved to the logs directory.");
        eprintln!("========================================\n");
    }));
}

/// Performance data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceData {
    pub timestamp: String,
    pub memory: MemoryInfo,
    pub cpu: CpuInfo,
    pub disk: DiskInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryInfo {
    pub used_mb: u64,
    pub total_mb: u64,
    pub available_mb: u64,
    pub usage_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuInfo {
    pub usage_percent: f64,
    pub num_cores: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub total_gb: u64,
    pub available_gb: u64,
    pub used_gb: u64,
    pub usage_percent: f64,
}

/// Global system info instance
static SYS_INFO: OnceLock<std::sync::Mutex<System>> = OnceLock::new();

/// Get or create the system info instance
fn get_system() -> &'static std::sync::Mutex<System> {
    SYS_INFO.get_or_init(|| {
        let mut sys = System::new_all();
        sys.refresh_all();
        std::sync::Mutex::new(sys)
    })
}

/// Collect real performance data using sysinfo
pub fn collect_performance_data() -> PerformanceData {
    let sys = get_system();
    let timestamp = Utc::now().to_rfc3339();

    let (memory, cpu, disk) = if let Ok(mut sys_guard) = sys.lock() {
        // Refresh system data
        sys_guard.refresh_memory();
        sys_guard.refresh_cpu_all();

        // Memory info
        let total_memory = sys_guard.total_memory() / 1024 / 1024; // Convert to MB
        let available_memory = sys_guard.available_memory() / 1024 / 1024;
        let used_memory = total_memory.saturating_sub(available_memory);
        let memory_usage = if total_memory > 0 {
            (used_memory as f64 / total_memory as f64) * 100.0
        } else {
            0.0
        };

        let memory = MemoryInfo {
            used_mb: used_memory,
            total_mb: total_memory,
            available_mb: available_memory,
            usage_percent: (memory_usage * 100.0).round() / 100.0,
        };

        // CPU info
        let cpu_usage: f64 = sys_guard.global_cpu_usage() as f64;
        let num_cores = sys_guard.cpus().len();

        let cpu = CpuInfo {
            usage_percent: (cpu_usage * 100.0).round() / 100.0,
            num_cores,
        };

        // Disk info (use the root/main disk)
        let disks = Disks::new_with_refreshed_list();
        let disk = if let Some(first_disk) = disks.iter().next() {
            let total_bytes = first_disk.total_space() / 1024 / 1024 / 1024; // Convert to GB
            let available_bytes = first_disk.available_space() / 1024 / 1024 / 1024;
            let used_bytes: u64 = total_bytes.saturating_sub(available_bytes);
            let disk_usage = if total_bytes > 0 {
                (used_bytes as f64 / total_bytes as f64) * 100.0
            } else {
                0.0
            };

            DiskInfo {
                total_gb: total_bytes,
                available_gb: available_bytes,
                used_gb: used_bytes,
                usage_percent: (disk_usage * 100.0).round() / 100.0,
            }
        } else {
            DiskInfo {
                total_gb: 0,
                available_gb: 0,
                used_gb: 0,
                usage_percent: 0.0,
            }
        };

        (memory, cpu, disk)
    } else {
        // Fallback if lock fails
        let memory = MemoryInfo {
            used_mb: 0,
            total_mb: 0,
            available_mb: 0,
            usage_percent: 0.0,
        };
        let cpu = CpuInfo {
            usage_percent: 0.0,
            num_cores: num_cpus::get(),
        };
        let disk = DiskInfo {
            total_gb: 0,
            available_gb: 0,
            used_gb: 0,
            usage_percent: 0.0,
        };
        (memory, cpu, disk)
    };

    PerformanceData {
        timestamp,
        memory,
        cpu,
        disk,
    }
}
