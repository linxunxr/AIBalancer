/**
 * Quota Store
 * 多维度配额状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { QuotaService } from '../services/QuotaService';
import {
  QuotaStrategyGroup,
  QuotaDimension,
  DimensionRelation,
  StrategyType,
  DimensionType,
  TimePeriod,
} from '../entities';
import { AppError } from '../../core/errors';

export interface QuotaOverview {
  accountId: string;
  strategyGroups: QuotaStrategyGroup[];
  dimensions: QuotaDimension[];
  totalAvailable: number;
  totalReserved: number;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'depleted';
}

export const useQuotaStore = defineStore('quota', () => {
  // State
  const strategyGroups = ref<Map<string, QuotaStrategyGroup>>(new Map());
  const dimensions = ref<Map<string, QuotaDimension>>(new Map());
  const dimensionRelations = ref<Map<string, DimensionRelation>>(new Map());
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<Date | null>(null);
  const currentAccountId = ref<string | null>(null);

  // Getters
  const strategyGroupList = computed(() => Array.from(strategyGroups.value.values()));

  const dimensionList = computed(() => Array.from(dimensions.value.values()));

  const activeStrategyGroups = computed(() =>
    strategyGroupList.value.filter((g) => g.isActive)
  );

  const activeDimensions = computed(() => {
    const activeGroupIds = new Set(activeStrategyGroups.value.map((g) => g.id));
    return dimensionList.value.filter((d) => activeGroupIds.has(d.groupId));
  });

  const totalAvailable = computed(() =>
    activeDimensions.value.reduce((sum, d) => sum + Math.max(0, d.currentBalance - d.reservedBalance), 0)
  );

  const totalReserved = computed(() =>
    activeDimensions.value.reduce((sum, d) => sum + d.reservedBalance, 0)
  );

  const healthStatus = computed((): 'healthy' | 'warning' | 'critical' | 'depleted' => {
    const dims = activeDimensions.value;
    if (dims.some((d) => d.currentBalance <= 0)) return 'depleted';
    if (dims.some((d) => d.criticalThreshold !== undefined && d.currentBalance < d.criticalThreshold)) return 'critical';
    if (dims.some((d) => d.warningThreshold !== undefined && d.currentBalance < d.warningThreshold)) return 'warning';
    return 'healthy';
  });

  const dimensionsByGroup = (groupId: string) =>
    dimensionList.value.filter((d) => d.groupId === groupId);

  const dimensionById = (dimensionId: string) =>
    dimensions.value.get(dimensionId);

  const rootDimensions = computed(() =>
    activeDimensions.value.filter((d) => !d.parentDimensionId)
  );

  // 按嵌套层级排序的维度
  const sortedDimensions = computed(() =>
    [...activeDimensions.value].sort((a, b) => a.nestingLevel - b.nestingLevel)
  );

  // 构建维度树
  const dimensionTree = computed(() => buildDimensionTree(rootDimensions.value));

  // Actions
  async function loadQuotaData(accountId: string) {
    loading.value = true;
    error.value = null;
    currentAccountId.value = accountId;

    try {
      const overview = await QuotaService.getQuotaOverview(accountId);

      strategyGroups.value = new Map(
        overview.strategyGroups.map((g) => [g.id, g])
      );
      dimensions.value = new Map(
        overview.dimensions.map((d) => [d.id, d])
      );
      lastUpdated.value = new Date();
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '加载配额数据失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createStrategyGroup(
    name: string,
    strategyType?: StrategyType,
    priority?: number
  ) {
    if (!currentAccountId.value) {
      throw new Error('未选择账户');
    }

    loading.value = true;
    error.value = null;

    try {
      const group = await QuotaService.createStrategyGroup(
        currentAccountId.value,
        name,
        strategyType,
        priority
      );
      strategyGroups.value.set(group.id, group);
      return group;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '创建策略组失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateStrategyGroup(
    id: string,
    updates: {
      name?: string;
      strategyType?: StrategyType;
      isActive?: boolean;
      priority?: number;
    }
  ) {
    loading.value = true;
    error.value = null;

    try {
      const group = await QuotaService.updateStrategyGroup(id, updates);
      strategyGroups.value.set(group.id, group);
      return group;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '更新策略组失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteStrategyGroup(id: string) {
    loading.value = true;
    error.value = null;

    try {
      await QuotaService.deleteStrategyGroup(id);
      strategyGroups.value.delete(id);
      // 同时删除关联的维度
      for (const [dimId, dim] of dimensions.value) {
        if (dim.groupId === id) {
          dimensions.value.delete(dimId);
        }
      }
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '删除策略组失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createDimension(
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
  ) {
    loading.value = true;
    error.value = null;

    try {
      const dimension = await QuotaService.createDimension(
        groupId,
        dimensionName,
        options
      );
      dimensions.value.set(dimension.id, dimension);
      return dimension;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '创建维度失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateDimension(
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
  ) {
    loading.value = true;
    error.value = null;

    try {
      const dimension = await QuotaService.updateDimension(id, updates);
      dimensions.value.set(dimension.id, dimension);
      return dimension;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '更新维度失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDimension(id: string) {
    loading.value = true;
    error.value = null;

    try {
      await QuotaService.deleteDimension(id);
      dimensions.value.delete(id);
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '删除维度失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function checkAvailability(estimatedUsage: number, unit?: string) {
    if (!currentAccountId.value) {
      throw new Error('未选择账户');
    }

    return QuotaService.checkAvailability(currentAccountId.value, estimatedUsage, unit);
  }

  async function executeDeduction(
    usageAmount: number,
    options?: {
      unit?: string;
      operationType?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    if (!currentAccountId.value) {
      throw new Error('未选择账户');
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await QuotaService.executeDeduction(
        currentAccountId.value,
        usageAmount,
        options
      );

      if (result.success) {
        // 更新本地维度数据
        for (const deduction of result.dimensionDeductions) {
          const dim = dimensions.value.get(deduction.dimensionId);
          if (dim) {
            dim.currentBalance = deduction.balanceAfter;
            dim.updatedAt = new Date();
          }
        }
      }

      return result;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '执行扣减失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadDimensionRelations(dimensionId: string) {
    try {
      const relations = await QuotaService.getDimensionRelations(dimensionId);
      for (const relation of relations) {
        dimensionRelations.value.set(relation.id, relation);
      }
      return relations;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '加载维度关联失败';
      throw err;
    }
  }

  async function createDimensionRelation(
    parentDimensionId: string,
    childDimensionId: string,
    options?: {
      relationType?: string;
      deductionRatio?: number;
      syncDeduction?: boolean;
      requireBothAvailable?: boolean;
    }
  ) {
    loading.value = true;
    error.value = null;

    try {
      const relation = await QuotaService.createDimensionRelation(
        parentDimensionId,
        childDimensionId,
        options
      );
      dimensionRelations.value.set(relation.id, relation);
      return relation;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '创建维度关联失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDimensionRelation(id: string) {
    try {
      await QuotaService.deleteDimensionRelation(id);
      dimensionRelations.value.delete(id);
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '删除维度关联失败';
      throw err;
    }
  }

  function clearError() {
    error.value = null;
  }

  function reset() {
    strategyGroups.value.clear();
    dimensions.value.clear();
    dimensionRelations.value.clear();
    currentAccountId.value = null;
    lastUpdated.value = null;
    error.value = null;
  }

  // Helper Functions
  function buildDimensionTree(rootDims: QuotaDimension[]): Map<string, QuotaDimension[]> {
    const tree = new Map<string, QuotaDimension[]>();

    for (const root of rootDims) {
      const children = dimensionList.value.filter((d) => d.parentDimensionId === root.id);
      tree.set(root.id, children);
    }

    return tree;
  }

  return {
    // State
    strategyGroups,
    dimensions,
    dimensionRelations,
    loading,
    error,
    lastUpdated,
    currentAccountId,

    // Getters
    strategyGroupList,
    dimensionList,
    activeStrategyGroups,
    activeDimensions,
    totalAvailable,
    totalReserved,
    healthStatus,
    dimensionsByGroup,
    dimensionById,
    rootDimensions,
    sortedDimensions,
    dimensionTree,

    // Actions
    loadQuotaData,
    createStrategyGroup,
    updateStrategyGroup,
    deleteStrategyGroup,
    createDimension,
    updateDimension,
    deleteDimension,
    checkAvailability,
    executeDeduction,
    loadDimensionRelations,
    createDimensionRelation,
    deleteDimensionRelation,
    clearError,
    reset,
  };
});
