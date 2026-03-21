// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod logging;
mod database;
mod crypto;
mod api_client;
mod proxy;

use std::path::PathBuf;
use std::sync::Mutex;
use rusqlite::Connection;
use logging::{LogConfig, LogManager, LogManagerState};
use logging::commands::*;
use database::commands::*;
use crypto::commands::*;
use api_client::commands::*;
use proxy::commands::*;

#[tauri::command]
fn greet(name: &str) -> String {
    tracing::info!("Greet command called with name: {}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 设置 panic hook 来捕获并记录 panic
    std::panic::set_hook(Box::new(|panic_info| {
        let msg = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "Unknown panic".to_string()
        };

        let location = panic_info.location()
            .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
            .unwrap_or_else(|| "unknown location".to_string());

        eprintln!("[PANIC] {} at {}", msg, location);

        // 尝试写入 panic 日志
        if let Ok(log_dir) = std::env::current_dir() {
            let log_file = log_dir.join("logs").join("panic.log");
            if let Ok(mut file) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&log_file)
            {
                use std::io::Write;
                let timestamp = chrono::Utc::now().to_rfc3339();
                let _ = writeln!(file, "[{}] PANIC: {} at {}", timestamp, msg, location);
            }
        }
    }));

    // Initialize logging
    // Use software installation directory for logs
    let config = LogConfig::default();
    let log_dir = get_log_directory();
    let mut log_manager = LogManager::new(config, log_dir);
    log_manager.init().expect("Failed to initialize logging");

    tracing::info!("Starting Starting application");

    // Initialize database
    let db_path = get_db_path();
    let db = Connection::open(&db_path).expect("Failed to open database");
    database::migrations::run_migrations(&db).expect("Failed to run migrations");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(LogManagerState(Mutex::new(log_manager)))
        .manage(Mutex::new(db))
        .invoke_handler(tauri::generate_handler![
            greet,
            // 日志命令
            get_log_config,
            save_log_config,
            get_logs,
            list_log_files,
            export_logs,
            clean_old_logs,
            get_performance_data,
            // 新增：错误报告命令
            log_error,
            log_info,
            log_warning,
            track_event,
            // 账户命令
            get_all_accounts,
            get_accounts_by_status,
            get_accounts_by_type,
            create_account,
            update_account,
            delete_account,
            toggle_account,
            update_account_balance,
            get_accounts_summary,
            search_accounts,
            // 存储命令
            execute_sql,
            storage_get,
            storage_set,
            storage_remove,
            storage_keys,
            storage_size,
            // 应用命令
            app_get_version,
            app_check_updates,
            // 加密命令
            crypto_encrypt,
            crypto_decrypt,
            crypto_test,
            // API 客户端命令
            api_test_connection,
            api_get_balance,
            api_test_batch,
            // API Key 管理命令
            add_api_key,
            delete_api_key,
            set_api_key_active,
            rotate_api_key,
            // 数据导出命令
            export_accounts,
            // 账户连接测试命令
            test_account_connection_by_id,
            // 代理配置命令
            get_proxy_config,
            save_proxy_config,
            test_proxy_connection,
            get_proxy_status,
            clear_proxy_config,
            should_use_proxy,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn get_project_root() -> PathBuf {
    // 获取当前工作目录
    let current_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));

    // 如果当前在 src-tauri 目录下，则使用其父目录
    if current_dir.file_name().map(|n| n == "src-tauri").unwrap_or(false) {
        current_dir.parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| PathBuf::from("."))
    } else {
        current_dir
    }
}

fn get_db_path() -> PathBuf {
    // 数据库存放在项目根目录
    get_project_root().join("aibalancer.db")
}

fn get_log_directory() -> PathBuf {
    // 日志存放在项目根目录
    get_project_root().join("logs")
}
