use rusqlite::params;
use rusqlite::Connection;
use serde_json;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn execute_sql(
    _conn_state: State<'_, Mutex<Connection>>,
    _sql: String,
    _params: Option<Vec<String>>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn storage_get(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
    _key: String,
) -> Result<Option<serde_json::Value>, String> {
    Ok(None)
}

#[tauri::command]
pub fn storage_set(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
    _key: String,
    _value: serde_json::Value,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn storage_remove(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
    _key: String,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn storage_clear(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn storage_keys(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
) -> Result<Vec<String>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn storage_size(
    _db: State<'_, Mutex<Connection>>,
    _table: String,
) -> Result<usize, String> {
    Ok(0)
}

#[tauri::command]
pub fn app_get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub fn app_check_updates() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "hasUpdate": false,
        "currentVersion": env!("CARGO_PKG_VERSION")
    }))
}
