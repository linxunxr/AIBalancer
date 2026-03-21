import { ref, computed } from 'vue';
import { accountService } from '../../models/services/AccountService';
import type { Account, AccountsSummary } from '../../models/entities/Account';
import type { BalanceData, ActivityLog } from '../../models/entities/Balance';
import { getTypeLabel } from '../../models/entities/Account';

export function useDashboardViewModel() {
  const state = ref({
    balances: [] as BalanceData[],
    activities: [] as ActivityLog[],
    accounts: [] as Account[],
    summary: null as AccountsSummary | null,
    systemStatus: {
      apiConnected: true,
      lastUpdate: new Date(),
    },
  });

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ==================== 计算属性 ====================

  /**
   * 总余额
   */
  const totalBalance = computed(() => {
    return state.value.accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  });

  /**
   * 今日使用量（Tokens）
   */
  const todayUsage = computed(() => {
    return state.value.accounts.reduce((sum, acc) => {
      // 从 usage 获取今日使用量，如果没有则计算
      return sum + (acc.usage?.totalTokens || 0);
    }, 0);
  });

  /**
   * 活跃平台数
   */
  const activePlatforms = computed(() => {
    return state.value.accounts.filter(acc => acc.status === 'active').length;
  });

  /**
   * 总平台数
   */
  const totalPlatforms = computed(() => state.value.accounts.length);

  /**
   * 余额趋势（百分比）
   */
  const totalTrend = computed(() => {
    if (state.value.accounts.length === 0) return 0;
    // 基于账户数量变化或使用趋势计算
    return 0; // 暂时返回0，后续可基于历史数据计算
  });

  /**
   * 系统状态是否正常
   */
  const systemOk = computed(() => {
    // 检查是否有账户处于 error 状态
    const hasErrors = state.value.accounts.some(acc => acc.status === 'error');
    return !hasErrors && state.value.systemStatus.apiConnected;
  });

  /**
   * 平均每日使用量
   */
  const avgDailyUsage = computed(() => {
    const totalUsage = state.value.accounts.reduce((sum, acc) => {
      return sum + (acc.usage?.dailyAverage || 0);
    }, 0);
    return totalUsage || 12500; // 默认值
  });

  /**
   * 预计剩余天数
   */
  const estimatedDays = computed(() => {
    if (avgDailyUsage.value <= 0) return 0;
    return Math.floor(totalBalance.value / avgDailyUsage.value);
  });

  /**
   * API 成功率
   */
  const apiSuccessRate = computed(() => {
    const total = state.value.accounts.length;
    if (total === 0) return 100;
    const successful = state.value.accounts.filter(acc => acc.status === 'active').length;
    return Math.round((successful / total) * 1000) / 10;
  });

  // ==================== 数据转换 ====================

  /**
   * 平台类型对应的图标
   */
  const platformIcons: Record<string, string> = {
    'deepseek': '🔮',
    'openai': '🤖',
    'anthropic': '🧠',
    'google': '🔍',
    'azure': '☁️',
    'custom': '⚙️',
  };

  /**
   * 将账户转换为余额卡片数据
   */
  function accountToBalanceData(account: Account): BalanceData {
    const platformKey = account.type.toLowerCase();
    return {
      id: account.id,
      platform: getTypeLabel(account.type),
      platformIcon: platformIcons[platformKey] || '💳',
      currentBalance: account.currentBalance || 0,
      currency: account.currency || 'CNY',
      lastUpdate: account.lastSyncedAt ? new Date(account.lastSyncedAt) : new Date(),
      trend: {
        dailyChange: 0,
        dailyAverageChange: account.usage?.dailyAverage || 0,
        weeklyChange: 0,
      },
      usage: {
        todayTokens: account.usage?.totalTokens || 0,
        todayCost: account.usage?.totalCost || 0,
        monthlyTokens: account.usage?.monthlyUsage?.reduce((sum, m) => sum + m.tokens, 0) || 0,
      },
    };
  }

  // ==================== 方法 ====================

  /**
   * 刷新数据
   */
  const refresh = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // 获取所有账户
      const accounts = await accountService.getAllAccounts();
      state.value.accounts = accounts;

      // 获取统计汇总
      const summary = await accountService.getAccountsSummary();
      state.value.summary = summary;

      // 转换为余额数据
      state.value.balances = accounts.map(accountToBalanceData);

      // 更新系统状态
      state.value.systemStatus.lastUpdate = new Date();
      state.value.systemStatus.apiConnected = true;

      // 添加刷新活动日志
      addActivity({
        type: 'system',
        title: '数据刷新',
        description: `已刷新 ${accounts.length} 个账户数据`,
        timestamp: new Date(),
        status: '成功',
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败';
      state.value.systemStatus.apiConnected = false;
      console.error('仪表盘数据刷新失败:', e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 刷新单个账户余额
   */
  const refreshBalance = async (id: string) => {
    try {
      const updated = await accountService.refreshAccountBalance(id);

      if (updated) {
        // 更新本地数据
        const index = state.value.accounts.findIndex(acc => acc.id === id);
        if (index !== -1) {
          state.value.accounts[index] = updated;
          state.value.balances[index] = accountToBalanceData(updated);
        }

        addActivity({
          type: 'balance',
          title: '余额刷新',
          description: `${updated.name} 余额已更新为 ¥${updated.currentBalance.toFixed(2)}`,
          timestamp: new Date(),
          status: '成功',
        });

        return true;
      }
    } catch (e) {
      console.error('刷新余额失败:', e);
      addActivity({
        type: 'warning',
        title: '余额刷新失败',
        description: e instanceof Error ? e.message : '未知错误',
        timestamp: new Date(),
        status: '失败',
      });
    }
    return false;
  };

  /**
   * 刷新所有账户余额
   */
  const refreshAllBalances = async () => {
    isLoading.value = true;
    let successCount = 0;
    let failCount = 0;

    try {
      for (const account of state.value.accounts) {
        if (account.status === 'active') {
          const result = await accountService.refreshAccountBalance(account.id);
          if (result) {
            successCount++;
            // 更新本地数据
            const index = state.value.accounts.findIndex(acc => acc.id === account.id);
            if (index !== -1) {
              state.value.accounts[index] = result;
              state.value.balances[index] = accountToBalanceData(result);
            }
          } else {
            failCount++;
          }
        }
      }

      addActivity({
        type: 'balance',
        title: '批量刷新',
        description: `成功 ${successCount} 个，失败 ${failCount} 个`,
        timestamp: new Date(),
        status: failCount === 0 ? '成功' : '部分成功',
      });
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 添加活动日志
   */
  const addActivity = (activity: Omit<ActivityLog, 'id'>) => {
    const newActivity: ActivityLog = {
      ...activity,
      id: crypto.randomUUID(),
    };
    state.value.activities.unshift(newActivity);
    // 保持最多50条活动记录
    if (state.value.activities.length > 50) {
      state.value.activities.pop();
    }
  };

  /**
   * 初始化数据
   */
  const initData = () => {
    refresh();
  };

  // 初始化
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
    avgDailyUsage,
    estimatedDays,
    apiSuccessRate,

    // 兼容旧接口
    balances: computed(() => state.value.balances),
    activities: computed(() => state.value.activities),

    // 方法
    refresh,
    refreshBalance,
    refreshAllBalances,
    addActivity,
  };
}
