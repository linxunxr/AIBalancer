use std::sync::Mutex;
use tauri::State;
use serde::Serialize;
use std::time::SystemTime;

use crate::logging::{LogConfig, LogManager, LogEntry, LogFileInfo, LogQueryFilter, LogPeriod};
use crate::logging::error_report::{collect_performance_data, PerformanceData};

// App state for log manager
pub struct LogManagerState(pub Mutex<LogManager>);

#[tauri::command]
pub async fn get_log_config(
    state: State<'_, LogManagerState>,
) -> Result<LogConfig, String> {
    let manager = state.0.lock().map_err(|e| e.to_string())?;
    Ok(manager.get_config().clone())
}

#[tauri::command]
pub async fn save_log_config(
    config: LogConfig,
    state: State<'_, LogManagerState>,
) -> Result<(), String> {
    let mut manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.set_config(config);
    manager.save_config().map_err(|e| e.to_string())?;
    Ok(())
}

/// Log an error from the frontend
#[tauri::command]
pub async fn log_error(
    error_type: String,
    message: String,
    stack_trace: Option<String>,
    context: Option<serde_json::Value>,
    state: State<'_, LogManagerState>,
) -> Result<String, String> {
    let manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.log_error(
        &error_type,
        &message,
        stack_trace.as_deref(),
        context,
    ).map_err(|e| e.to_string())
}

/// Log an info event from the frontend
#[tauri::command]
pub async fn log_info(
    source: String,
    message: String,
    state: State<'_, LogManagerState>,
) -> Result<(), String> {
    let manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.log_info(&source, &message);
    Ok(())
}

/// Log a warning event from the frontend
#[tauri::command]
pub async fn log_warning(
    source: String,
    message: String,
    state: State<'_, LogManagerState>,
) -> Result<(), String> {
    let manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.log_warning(&source, &message);
    Ok(())
}

/// Track an analytics event
#[tauri::command]
pub async fn track_event(
    event_name: String,
    properties: Option<serde_json::Value>,
    state: State<'_, LogManagerState>,
) -> Result<(), String> {
    let manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.track_event(&event_name, properties);
    Ok(())
}

#[tauri::command]
pub async fn get_logs(
    filter: LogQueryFilter,
    state: State<'_, LogManagerState>,
) -> Result<Vec<LogEntry>, String> {
    // Get the log dir while holding the lock
    let log_dir = {
        let manager = state.0.lock().map_err(|e| e.to_string())?;
        manager.log_dir.clone()
    };

    // Find the current log file
    let current_log = log_dir.join("aibalancer.log");

    if !current_log.exists() {
        return Ok(Vec::new());
    }

    // Read and parse
    let content: String = tokio::fs::read_to_string(&current_log)
        .await
        .map_err(|e: std::io::Error| e.to_string())?;

    let mut entries: Vec<LogEntry> = content
        .lines()
        .filter_map(|line| parse_log_line(line))
        .filter(|entry: &LogEntry| matches_filter(entry, &filter))
        .collect();

    // Apply limit
    if let Some(limit) = filter.limit {
        if entries.len() > limit {
            entries = entries.split_off(entries.len() - limit);
        }
    }

    Ok(entries)
}

#[tauri::command]
pub async fn list_log_files(
    state: State<'_, LogManagerState>,
) -> Result<Vec<LogFileInfo>, String> {
    // Get log dir while holding the lock
    let log_dir = {
        let manager = state.0.lock().map_err(|e| e.to_string())?;
        manager.log_dir.clone()
    };

    // Now do all the async work with the lock dropped
    let mut result = Vec::new();
    let mut entries: tokio::fs::ReadDir = tokio::fs::read_dir(&log_dir)
        .await
        .map_err(|e: std::io::Error| e.to_string())?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e: std::io::Error| e.to_string())?
    {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let metadata = tokio::fs::metadata(&path)
            .await
            .map_err(|e: std::io::Error| e.to_string())?;
        let filename = entry.file_name().into_string().unwrap_or_default();

        // Skip non-log files
        if !(filename.ends_with(".log") || filename.ends_with(".gz")) {
            continue;
        }

        let created = metadata
            .created()
            .map_err(|e: std::io::Error| e.to_string())?;
        let modified = metadata
            .modified()
            .map_err(|e: std::io::Error| e.to_string())?;

        result.push(LogFileInfo {
            filename: filename.clone(),
            path: path.to_string_lossy().to_string(),
            size: metadata.len(),
            created: LogManager::format_time(created),
            modified: LogManager::format_time(modified),
            compressed: filename.ends_with(".gz"),
            log_count: 0,
            period: LogPeriod {
                start: LogManager::format_time(created),
                end: LogManager::format_time(modified),
            },
        });
    }

    Ok(result)
}

#[tauri::command]
pub async fn export_logs(
    filter: LogQueryFilter,
    format: String,
    state: State<'_, LogManagerState>,
) -> Result<ExportResult, String> {
    let logs = get_logs(filter, state).await?;
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let filename = format!("aibalancer_logs_{}.{}", timestamp, format);

    let content = match format.as_str() {
        "json" => serde_json::to_string_pretty(&logs).unwrap_or_default(),
        "csv" => {
            let mut csv = String::from("timestamp,level,source,module,message\n");
            for entry in logs {
                let msg = entry.message.replace('"', "\"\"");
                csv.push_str(&format!(
                    "{},{},{},{},{}\n",
                    entry.timestamp, entry.level, entry.source, entry.module, msg
                ));
            }
            csv
        }
        _ => {
            let mut text = String::new();
            for entry in logs {
                text.push_str(&format!(
                    "[{}] [{}] [{}] {}: {}\n",
                    entry.timestamp, entry.level, entry.source, entry.module, entry.message
                ));
            }
            text
        }
    };

    Ok(ExportResult {
        content,
        filename,
    })
}

#[tauri::command]
pub async fn clean_old_logs(
    state: State<'_, LogManagerState>,
) -> Result<CleanResult, String> {
    // Get the config while holding the lock
    let (retention_days, log_dir) = {
        let manager = state.0.lock().map_err(|e| e.to_string())?;
        (manager.config.rotation.retention_days, manager.log_dir.clone())
    };

    // Do the work after dropping the lock
    let mut deleted_count = 0;
    let mut freed_bytes: u64 = 0;
    let now = SystemTime::now();

    let mut entries: tokio::fs::ReadDir = tokio::fs::read_dir(&log_dir)
        .await
        .map_err(|e: std::io::Error| e.to_string())?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e: std::io::Error| e.to_string())?
    {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let metadata = tokio::fs::metadata(&path)
            .await
            .map_err(|e: std::io::Error| e.to_string())?;
        if let Ok(modified) = metadata.modified() {
            if let Ok(elapsed) = now.duration_since(modified) {
                let days = elapsed.as_secs() / (24 * 3600);
                if days > retention_days as u64 {
                    freed_bytes += metadata.len();
                    tokio::fs::remove_file(&path)
                        .await
                        .map_err(|e: std::io::Error| e.to_string())?;
                    deleted_count += 1;
                }
            }
        }
    }

    tracing::info!("Cleaned {} old logs, freed {} bytes", deleted_count, freed_bytes);

    Ok(CleanResult {
        deleted: deleted_count,
        freed_bytes,
    })
}

/// Get current performance data
#[tauri::command]
pub async fn get_performance_data() -> Result<PerformanceData, String> {
    Ok(collect_performance_data())
}

#[derive(Debug, Clone, Serialize)]
pub struct ExportResult {
    pub content: String,
    pub filename: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct CleanResult {
    pub deleted: u32,
    pub freed_bytes: u64,
}

fn parse_log_line(line: &str) -> Option<LogEntry> {
    // Simple parsing - for structured output we'd do better
    // This handles the tracing format
    use uuid::Uuid;

    // Just create a basic entry
    Some(LogEntry {
        id: Uuid::new_v4().to_string(),
        timestamp: chrono::Local::now().to_rfc3339(),
        level: "INFO".to_string(),
        source: "system".to_string(),
        module: "unknown".to_string(),
        message: line.to_string(),
        details: None,
    })
}

fn matches_filter(entry: &LogEntry, filter: &LogQueryFilter) -> bool {
    // Check level
    if let Some(levels) = &filter.levels {
        if !levels.contains(&entry.level) {
            return false;
        }
    }

    // Check source
    if let Some(sources) = &filter.sources {
        if !sources.contains(&entry.source) {
            return false;
        }
    }

    // Check keywords
    if let Some(keywords) = &filter.keywords {
        for keyword in keywords {
            if !entry.message.contains(keyword) {
                return false;
            }
        }
    }

    // Check time range
    if let Some(start) = &filter.start_time {
        if &entry.timestamp < start {
            return false;
        }
    }
    if let Some(end) = &filter.end_time {
        if &entry.timestamp > end {
            return false;
        }
    }

    true
}
