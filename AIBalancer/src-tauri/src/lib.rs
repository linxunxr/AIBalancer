// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod logging;

use std::path::PathBuf;
use std::sync::Mutex;
use logging::{LogConfig, LogManager, LogManagerState};
use logging::commands::*;

#[tauri::command]
fn greet(name: &str) -> String {
    tracing::info!("Greet command called with name: {}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    // Get app data directory for logs
    let config = LogConfig::default();
    let log_dir = get_log_directory();
    let mut log_manager = LogManager::new(config, log_dir);
    log_manager.init().expect("Failed to initialize logging");

    tracing::info!("Starting AIBalancer application");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(LogManagerState(Mutex::new(log_manager)))
        .invoke_handler(tauri::generate_handler![
            greet,
            get_log_config,
            save_log_config,
            get_logs,
            list_log_files,
            export_logs,
            clean_old_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn get_log_directory() -> PathBuf {
    #[cfg(debug_assertions)]
    {
        // In development, write to ./logs in project directory
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("logs")
    }

    #[cfg(not(debug_assertions))]
    {
        // In release, use app data directory
        if let Some(data_dir) = tauri::api::path::app_data_dir(&tauri::api::config::Config::default()) {
            data_dir.join("logs")
        } else {
            std::env::current_dir()
                .unwrap_or_else(|_| PathBuf::from("."))
                .join("logs")
        }
    }
}
