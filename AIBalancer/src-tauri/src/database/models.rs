use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Balance {
    pub id: String,
    pub platform: String,
    pub current_balance: f64,
    pub currency: String,
    pub last_updated: String,
    pub history: String,
    pub metadata: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageRecord {
    pub id: String,
    pub platform: String,
    pub date: String,
    pub tokens_used: i64,
    pub requests_count: i64,
    pub cost: f64,
    pub metadata: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertRule {
    pub id: String,
    pub name: String,
    pub r_type: String,
    pub platform: String,
    pub threshold: f64,
    pub enabled: bool,
    pub notification_methods: String,
    pub cooldown_minutes: i64,
    pub last_triggered: Option<String>,
    pub metadata: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub id: String,
    pub theme: String,
    pub language: String,
    pub auto_check_updates: bool,
    pub auto_check_interval: i64,
    pub minimize_to_tray: bool,
    pub start_minimized: bool,
    pub low_balance_threshold: f64,
    pub daily_budget_warning: f64,
    pub monthly_budget_warning: f64,
    pub notification_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageItem<T> {
    pub value: T,
    pub timestamp: i64,
    pub ttl: Option<i64>,
}
