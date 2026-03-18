import { ref, computed } from 'vue';
import type { BalanceData, ActivityLog } from '../../models/entities/Balance';
import { MockDataService } from '../../models/services/MockDataService';

export function useDashboardViewModel() {
  const state = ref({
    balances: [] as BalanceData[],
    activities: [] as ActivityLog[],
    systemStatus: {
      apiConnected: true,
      lastUpdate: new Date(),
    },
  });

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const totalBalance = computed(() => {
    return state.value.balances.reduce((sum, b) => sum + b.currentBalance, 0);
  });

  const todayUsage = computed(() => {
    return state.value.balances.reduce((sum, b) => sum + (b.usage?.todayTokens || 0), 0);
  });

  const activePlatforms = computed(() => {
    return state.value.balances.filter(b => b.currentBalance > 0).length;
  });

  const totalPlatforms = computed(() => state.value.balances.length);

  const totalTrend = computed(() => {
    if (state.value.balances.length === 0) return 0;
    const trends = state.value.balances.map(b => b.trend.dailyAverageChange);
    return trends.reduce((sum, change) => sum + change, 0) / trends.length;
  });

  const systemOk = computed(() => {
    return state.value.systemStatus.apiConnected && !hasActiveAlerts.value;
  });

  const hasActiveAlerts = computed(() => {
    return state.value.balances.some(b => b.currentBalance < 50);
  });

  const avgDailyUsage = computed(() => 12500);
  const estimatedDays = computed(() => {
    if (avgDailyUsage.value <= 0) return 0;
    return Math.floor(totalBalance.value / avgDailyUsage.value);
  });

  const apiSuccessRate = computed(() => 99.8);

  // 方法
  const refresh = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      state.value.balances = MockDataService.generateBalanceData();
      state.value.systemStatus.lastUpdate = new Date();
      state.value.systemStatus.apiConnected = true;
    } catch (e) {
      error.value = e as string;
      state.value.systemStatus.apiConnected = false;
    } finally {
      isLoading.value = false;
    }
  };

  const updateBalance = (id: string, newBalance: number) => {
    const balance = state.value.balances.find(b => b.id === id);
    if (balance) {
      balance.currentBalance = newBalance;
      balance.lastUpdate = new Date();
    }
  };

  const addActivity = (activity: Omit<ActivityLog, 'id'>) => {
    const newActivity: ActivityLog = {
      ...activity,
      id: crypto.randomUUID(),
    };
    state.value.activities.unshift(newActivity);
  };

  // 初始化数据
  const initData = () => {
    state.value.balances = MockDataService.generateBalanceData();
    state.value.activities = MockDataService.generateActivityLogs();
  };

  initData();

  return {
    // 状态
    state,
    isLoading,
    error,

    // 计算属性
    totalBalance,
    todayUsage,
    activePlatforms,
    totalPlatforms,
    totalTrend,
    systemOk,
    hasActiveAlerts,
    avgDailyUsage,
    estimatedDays,
    apiSuccessRate,

    // 方法
    refresh,
    updateBalance,
    addActivity,
  };
}
