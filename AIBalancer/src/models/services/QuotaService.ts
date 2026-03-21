import { invoke } from '@tauri-apps/api/core';
import {
  QuotaStrategyGroup,
  QuotaStrategyGroupEntity,
  QuotaDimension,
  QuotaDimensionEntity,
  DimensionRelation,
  QuotaAvailabilityResult,
  DeductionResult,
  StrategyType,
  DimensionType,
  TimePeriod,
} from '../entities';

/**
 * 配额服务 - 处理配额相关的业务逻辑
 */
export class QuotaService {
  // ==================== 策略组管理 ====================

  /**
   * 创建策略组
   */
  static async createStrategyGroup(
    accountId: string,
    name: string,
    strategyType?: StrategyType,
    priority?: number
  ): Promise<QuotaStrategyGroup> {
    const result = await invoke<{
      id: string;
      account_id: string;
      name: string;
      strategy_type: string;
      is_active: boolean;
      priority: number;
      created_at: string;
      updated_at: string;
    }>('create_quota_strategy_group', {
      accountId,
      name,
      strategyType,
      priority,
    });

    return QuotaStrategyGroupEntity.fromJSON(result);
  }

  /**
   * 获取账户的所有策略组
   */
  static async getStrategyGroups(accountId: string): Promise<QuotaStrategyGroup[]> {
    const results = await invoke<Array<Record<string, unknown>>>('get_quota_strategy_groups', {
      accountId,
    });

    return results.map((r) => QuotaStrategyGroupEntity.fromJSON(r));
  }

  /**
   * 更新策略组
   */
  static async updateStrategyGroup(
    id: string,
    updates: {
      name?: string;
      strategyType?: StrategyType;
      isActive?: boolean;
      priority?: number;
    }
  ): Promise<QuotaStrategyGroup> {
    const result = await invoke<Record<string, unknown>>('update_quota_strategy_group', {
      id,
      name: updates.name,
      strategyType: updates.strategyType,
      isActive: updates.isActive,
      priority: updates.priority,
    });

    return QuotaStrategyGroupEntity.fromJSON(result);
  }

  /**
   * 删除策略组
   */
  static async deleteStrategyGroup(id: string): Promise<boolean> {
    return invoke<boolean>('delete_quota_strategy_group', { id });
  }

  // ==================== 维度管理 ====================

  /**
   * 创建维度
   */
  static async createDimension(
    groupId: string,
    dimensionName: string,
    options: {
      dimensionType?: DimensionType;
      unit?: string;
      totalQuota: number;
      timePeriod?: TimePeriod;
      resetTime?: string;
      resetDay?: number;
      autoReset?: boolean;
      parentDimensionId?: string;
      warningThreshold?: number;
      criticalThreshold?: number;
    }
  ): Promise<QuotaDimension> {
    const result = await invoke<Record<string, unknown>>('create_quota_dimension', {
      groupId,
      dimensionName,
      dimensionType: options.dimensionType,
      unit: options.unit,
      totalQuota: options.totalQuota,
      timePeriod: options.timePeriod,
      resetTime: options.resetTime,
      resetDay: options.resetDay,
      autoReset: options.autoReset,
      parentDimensionId: options.parentDimensionId,
      warningThreshold: options.warningThreshold,
      criticalThreshold: options.criticalThreshold,
    });

    return QuotaDimensionEntity.fromJSON(result);
  }

  /**
   * 获取策略组的所有维度
   */
  static async getDimensions(groupId: string): Promise<QuotaDimension[]> {
    const results = await invoke<Array<Record<string, unknown>>>('get_quota_dimensions', {
      groupId,
    });

    return results.map((r) => QuotaDimensionEntity.fromJSON(r));
  }

  /**
   * 获取单个维度详情
   */
  static async getDimension(dimensionId: string): Promise<QuotaDimension> {
    const result = await invoke<Record<string, unknown>>('get_quota_dimension', {
      dimensionId,
    });

    return QuotaDimensionEntity.fromJSON(result);
  }

  /**
   * 更新维度
   */
  static async updateDimension(
    id: string,
    updates: {
      dimensionName?: string;
      totalQuota?: number;
      currentBalance?: number;
      timePeriod?: TimePeriod;
      resetTime?: string;
      resetDay?: number;
      autoReset?: boolean;
      warningThreshold?: number;
      criticalThreshold?: number;
    }
  ): Promise<QuotaDimension> {
    const result = await invoke<Record<string, unknown>>('update_quota_dimension', {
      id,
      dimensionName: updates.dimensionName,
      totalQuota: updates.totalQuota,
      currentBalance: updates.currentBalance,
      timePeriod: updates.timePeriod,
      resetTime: updates.resetTime,
      resetDay: updates.resetDay,
      autoReset: updates.autoReset,
      warningThreshold: updates.warningThreshold,
      criticalThreshold: updates.criticalThreshold,
    });

    return QuotaDimensionEntity.fromJSON(result);
  }

  /**
   * 删除维度
   */
  static async deleteDimension(id: string): Promise<boolean> {
    return invoke<boolean>('delete_quota_dimension', { id });
  }

  // ==================== 维度关联管理 ====================

  /**
   * 创建维度关联
   */
  static async createDimensionRelation(
    parentDimensionId: string,
    childDimensionId: string,
    options?: {
      relationType?: string;
      deductionRatio?: number;
      syncDeduction?: boolean;
      requireBothAvailable?: boolean;
    }
  ): Promise<DimensionRelation> {
    return invoke<DimensionRelation>('create_dimension_relation', {
      parentDimensionId,
      childDimensionId,
      relationType: options?.relationType,
      deductionRatio: options?.deductionRatio,
      syncDeduction: options?.syncDeduction,
      requireBothAvailable: options?.requireBothAvailable,
    });
  }

  /**
   * 获取维度的关联关系
   */
  static async getDimensionRelations(dimensionId: string): Promise<DimensionRelation[]> {
    return invoke<DimensionRelation[]>('get_dimension_relations', { dimensionId });
  }

  /**
   * 删除维度关联
   */
  static async deleteDimensionRelation(id: string): Promise<boolean> {
    return invoke<boolean>('delete_dimension_relation', { id });
  }

  // ==================== 配额检查与扣减 ====================

  /**
   * 检查配额可用性
   */
  static async checkAvailability(
    accountId: string,
    estimatedUsage: number,
    unit?: string
  ): Promise<QuotaAvailabilityResult> {
    return invoke<QuotaAvailabilityResult>('check_quota_availability_cmd', {
      accountId,
      estimatedUsage,
      unit,
    });
  }

  /**
   * 执行扣减
   */
  static async executeDeduction(
    accountId: string,
    usageAmount: number,
    options?: {
      unit?: string;
      operationType?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<DeductionResult> {
    return invoke<DeductionResult>('execute_deduction_cmd', {
      accountId,
      usageAmount,
      unit: options?.unit,
      operationType: options?.operationType,
      metadata: options?.metadata ? JSON.stringify(options.metadata) : undefined,
    });
  }

  // ==================== 配额概览 ====================

  /**
   * 获取账户配额概览
   */
  static async getQuotaOverview(accountId: string): Promise<{
    accountId: string;
    strategyGroups: QuotaStrategyGroup[];
    dimensions: QuotaDimension[];
    totalAvailable: number;
    totalReserved: number;
    healthStatus: string;
  }> {
    const result = await invoke<{
      account_id: string;
      strategy_groups: Array<Record<string, unknown>>;
      dimensions: Array<Record<string, unknown>>;
      total_available: number;
      total_reserved: number;
      health_status: string;
    }>('get_quota_overview', { accountId });

    return {
      accountId: result.account_id,
      strategyGroups: result.strategy_groups.map((g) => QuotaStrategyGroupEntity.fromJSON(g)),
      dimensions: result.dimensions.map((d) => QuotaDimensionEntity.fromJSON(d)),
      totalAvailable: result.total_available,
      totalReserved: result.total_reserved,
      healthStatus: result.health_status,
    };
  }

  // ==================== 刷新调度 ====================

  /**
   * 获取刷新调度信息
   */
  static async getRefreshSchedule(accountId: string): Promise<
    Array<{
      dimensionId: string;
      dimensionName: string;
      timePeriod: string;
      nextResetAt?: string;
      autoReset: boolean;
      resetStrategy: string;
    }>
  > {
    const results = await invoke<
      Array<{
        dimension_id: string;
        dimension_name: string;
        time_period: string;
        next_reset_at?: string;
        auto_reset: boolean;
        reset_strategy: string;
      }>
    >('get_refresh_schedule', { accountId });

    return results.map((r) => ({
      dimensionId: r.dimension_id,
      dimensionName: r.dimension_name,
      timePeriod: r.time_period,
      nextResetAt: r.next_reset_at,
      autoReset: r.auto_reset,
      resetStrategy: r.reset_strategy,
    }));
  }
}

export default QuotaService;
