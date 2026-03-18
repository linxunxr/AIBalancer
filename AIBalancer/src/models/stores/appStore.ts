import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface UserProfile {
  name: string;
  status: string;
  avatar?: string;
}

export interface SystemStatus {
  apiConnected: boolean;
  lastUpdate: Date;
  version: string;
}

export interface ActivityLog {
  id: string;
  type: 'balance' | 'api' | 'warning' | 'system' | 'success';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
}

export default defineStore('app', () => {
  // 用户状态管理
  const user = ref<UserProfile>({
    name: '用户',
    status: '在线',
  });

  // 系统状态管理
  const systemStatus = ref<SystemStatus>({
    apiConnected: true,
    lastUpdate: new Date(),
    version: '1.0.0',
  });

  // 余额数据管理
  const balances = ref<any[]>([]);
  const totalBalance = computed(() => {
    return balances.value.reduce((sum, b) => sum + (b.currentBalance || 0), 0);
  });

  // 导航状态
  const currentRoute = ref<string>('/');
  const breadcrumbs = ref<Array<{ key: string; label: string; href: string; icon?: any }>>([]);

  // 最近活动
  const recentActivities = ref<ActivityLog[]>([]);

  // 方法
  const setUser = (profile: UserProfile) => {
    user.value = profile;
    localStorage.setItem('user-profile', JSON.stringify(profile));
  };

  const refreshAllBalances = async () => {
    // TODO: 调用BalanceService刷新所有余额
    systemStatus.value.lastUpdate = new Date();
  };

  const addActivity = (activity: Omit<ActivityLog, 'id'>) => {
    const newActivity: ActivityLog = {
      ...activity,
      id: crypto.randomUUID(),
    };
    recentActivities.value.unshift(newActivity);
    if (recentActivities.value.length > 100) {
      recentActivities.value = recentActivities.value.slice(0, 100);
    }
  };

  const updateBalances = (newBalances: any[]) => {
    balances.value = newBalances;
  };

  const setRoute = (route: string) => {
    currentRoute.value = route;
  };

  const updateBreadcrumbs = (items: typeof breadcrumbs.value) => {
    breadcrumbs.value = items;
  };

  const loadPersistedData = () => {
    const savedUser = localStorage.getItem('user-profile');
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser);
      } catch (e) {
        console.error('Failed to load user profile', e);
      }
    }
  };

  // 初始化
  loadPersistedData();

  return {
    // 状态
    user,
    systemStatus,
    balances,
    totalBalance,
    currentRoute,
    breadcrumbs,
    recentActivities,

    // 方法
    setUser,
    refreshAllBalances,
    addActivity,
    updateBalances,
    setRoute,
    updateBreadcrumbs,
  };
});
