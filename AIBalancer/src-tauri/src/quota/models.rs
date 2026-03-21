use serde::{Deserialize, Serialize};
use crate::database::models::{
    QuotaStrategyGroup, QuotaDimension, DimensionRelation,
};

/// 创建策略组请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateStrategyGroupRequest {
    pub account_id: String,
    pub name: String,
    pub strategy_type: Option<String>,
    pub priority: Option<i32>,
}

/// 更新策略组请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateStrategyGroupRequest {
    pub id: String,
    pub name: Option<String>,
    pub strategy_type: Option<String>,
    pub is_active: Option<bool>,
    pub priority: Option<i32>,
}

/// 创建维度请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDimensionRequest {
    pub group_id: String,
    pub dimension_name: String,
    pub dimension_type: Option<String>,
    pub unit: Option<String>,
    pub total_quota: f64,
    pub time_period: Option<String>,
    pub reset_time: Option<String>,
    pub reset_day: Option<i32>,
    pub auto_reset: Option<bool>,
    pub parent_dimension_id: Option<String>,
    pub warning_threshold: Option<f64>,
    pub critical_threshold: Option<f64>,
}

/// 更新维度请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDimensionRequest {
    pub id: String,
    pub dimension_name: Option<String>,
    pub total_quota: Option<f64>,
    pub current_balance: Option<f64>,
    pub time_period: Option<String>,
    pub reset_time: Option<String>,
    pub reset_day: Option<i32>,
    pub auto_reset: Option<bool>,
    pub warning_threshold: Option<f64>,
    pub critical_threshold: Option<f64>,
}

/// 创建维度关联请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDimensionRelationRequest {
    pub parent_dimension_id: String,
    pub child_dimension_id: String,
    pub relation_type: Option<String>,
    pub deduction_ratio: Option<f64>,
    pub sync_deduction: Option<bool>,
    pub require_both_available: Option<bool>,
}

/// 检查配额可用性请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckQuotaRequest {
    pub account_id: String,
    pub estimated_usage: f64,
    pub unit: Option<String>,
}

/// 执行扣减请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteDeductionRequest {
    pub account_id: String,
    pub usage_amount: f64,
    pub unit: Option<String>,
    pub operation_type: Option<String>,
    pub metadata: Option<String>,
}

/// 刷新维度请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefreshDimensionRequest {
    pub dimension_id: String,
    pub reset_strategy: Option<String>, // hard, soft, dynamic
}

/// 配额概览
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaOverview {
    pub account_id: String,
    pub strategy_groups: Vec<QuotaStrategyGroup>,
    pub dimensions: Vec<QuotaDimension>,
    pub total_available: f64,
    pub total_reserved: f64,
    pub health_status: String, // healthy, warning, critical, depleted
}

/// 维度树节点（用于展示嵌套关系）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DimensionTreeNode {
    pub dimension: QuotaDimension,
    pub children: Vec<DimensionTreeNode>,
    pub relations: Vec<DimensionRelation>,
}

/// 刷新调度信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefreshSchedule {
    pub dimension_id: String,
    pub dimension_name: String,
    pub time_period: String,
    pub next_reset_at: Option<String>,
    pub auto_reset: bool,
    pub reset_strategy: String,
}
