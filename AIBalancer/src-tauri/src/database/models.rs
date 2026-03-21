use serde::{Deserialize, Serialize};

// ==================== 基础实体 ====================

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

// ==================== 多维度配额系统实体 ====================

/// 策略类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum StrategyType {
    Nested,   // 嵌套策略
    Parallel, // 并行策略
    Priority, // 优先级策略
    Single,   // 单维度策略
}

impl Default for StrategyType {
    fn default() -> Self {
        Self::Nested
    }
}

/// 维度类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DimensionType {
    TimeBased,   // 时间维度
    Permanent,   // 永久配额
    UsageBased,  // 使用量维度
}

impl Default for DimensionType {
    fn default() -> Self {
        Self::TimeBased
    }
}

/// 时间周期枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TimePeriod {
    #[serde(rename = "5h")]
    FiveHours,
    #[serde(rename = "7d")]
    Weekly,
    #[serde(rename = "30d")]
    Monthly,
    Permanent,
}

/// 事务状态枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TransactionStatus {
    Pending,
    Committed,
    RolledBack,
}

impl Default for TransactionStatus {
    fn default() -> Self {
        Self::Pending
    }
}

/// 操作类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum OperationType {
    Usage,      // 使用扣减
    Refund,     // 退款
    Adjustment, // 调整
}

/// 额度策略组
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaStrategyGroup {
    pub id: String,
    pub account_id: String,
    pub name: String,
    pub strategy_type: String,
    pub is_active: bool,
    pub priority: i32,
    pub created_at: String,
    pub updated_at: String,
}

/// 额度维度
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaDimension {
    pub id: String,
    pub group_id: String,
    pub dimension_name: String,
    pub dimension_type: String,
    pub unit: String,
    pub total_quota: f64,
    pub current_balance: f64,
    pub reserved_balance: f64,
    pub time_period: Option<String>,
    pub reset_time: Option<String>,
    pub reset_day: Option<i32>,
    pub timezone: String,
    pub last_reset_at: Option<String>,
    pub next_reset_at: Option<String>,
    pub auto_reset: bool,
    pub parent_dimension_id: Option<String>,
    pub nesting_level: i32,
    pub warning_threshold: Option<f64>,
    pub critical_threshold: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
}

impl QuotaDimension {
    /// 计算可用余额（当前余额 - 预留余额）
    pub fn available_balance(&self) -> f64 {
        (self.current_balance - self.reserved_balance).max(0.0)
    }

    /// 计算使用率
    pub fn usage_percentage(&self) -> f64 {
        if self.total_quota <= 0.0 {
            return 0.0;
        }
        ((self.total_quota - self.current_balance) / self.total_quota * 100.0).min(100.0)
    }

    /// 检查是否低于警告阈值
    pub fn is_warning(&self) -> bool {
        if let Some(threshold) = self.warning_threshold {
            return self.current_balance < threshold;
        }
        false
    }

    /// 检查是否低于严重阈值
    pub fn is_critical(&self) -> bool {
        if let Some(threshold) = self.critical_threshold {
            return self.current_balance < threshold;
        }
        false
    }

    /// 检查余额是否耗尽
    pub fn is_depleted(&self) -> bool {
        self.available_balance() <= 0.0
    }
}

/// 维度关联关系
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DimensionRelation {
    pub id: String,
    pub parent_dimension_id: String,
    pub child_dimension_id: String,
    pub relation_type: String,
    pub deduction_ratio: f64,
    pub sync_deduction: bool,
    pub require_both_available: bool,
    pub created_at: String,
}

/// 扣减事务
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeductionTransaction {
    pub transaction_id: String,
    pub account_id: String,
    pub operation_type: String,
    pub total_usage: f64,
    pub usage_unit: String,
    pub status: String,
    pub started_at: String,
    pub committed_at: Option<String>,
    pub rolled_back_at: Option<String>,
    pub error_message: Option<String>,
    pub metadata: String,
}

/// 维度扣减记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DimensionDeduction {
    pub id: String,
    pub transaction_id: String,
    pub dimension_id: String,
    pub deduction_amount: f64,
    pub balance_before: f64,
    pub balance_after: f64,
    pub deduction_status: String,
    pub related_dimension_ids: String,
    pub created_at: String,
}

// ==================== 配额检查结果 ====================

/// 配额可用性检查结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaAvailabilityResult {
    pub is_available: bool,
    pub total_available: f64,
    pub dimension_results: Vec<DimensionAvailabilityResult>,
    pub blocking_reasons: Vec<String>,
}

/// 单个维度的可用性结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DimensionAvailabilityResult {
    pub dimension_id: String,
    pub dimension_name: String,
    pub available_balance: f64,
    pub is_sufficient: bool,
    pub deficit: f64,
}

/// 扣减执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeductionResult {
    pub success: bool,
    pub transaction_id: String,
    pub total_deducted: f64,
    pub dimension_deductions: Vec<DimensionDeductionInfo>,
    pub error_message: Option<String>,
}

/// 扣减维度信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DimensionDeductionInfo {
    pub dimension_id: String,
    pub dimension_name: String,
    pub deducted_amount: f64,
    pub balance_before: f64,
    pub balance_after: f64,
}
