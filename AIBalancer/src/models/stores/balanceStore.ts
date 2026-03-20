/**
 * Balance Store
 * 余额状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { BalanceService } from '../services/BalanceService';
import { Balance, PlatformType, Currency } from '../entities';
import { AppError } from '../../core/errors';

export interface BalanceState {
  balances: Map<string, Balance>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useBalanceStore = defineStore('balance', () => {
  // State
  const balances = ref<Map<string, Balance>>(new Map());
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<Date | null>(null);

  // Services
  const balanceService = new BalanceService();

  // Getters
  const balanceList = computed(() => Array.from(balances.value.values()));

  const totalBalance = computed(() => {
    return Array.from(balances.value.values()).reduce(
      (sum, b) => sum + b.currentBalance,
      0
    );
  });

  const lowBalances = computed(() => {
    return Array.from(balances.value.values()).filter(b => b.currentBalance < 50);
  });

  const balanceByPlatform = (platform: PlatformType) => {
    return balances.value.get(platform);
  };

  const isLowBalance = (platform: PlatformType) => {
    const balance = balanceByPlatform(platform);
    return balance ? balance.currentBalance < 50 : false;
  };

  // Actions
  async function fetchBalances() {
    loading.value = true;
    error.value = null;

    try {
      const allBalances = await balanceService.getAllBalances();
      balances.value = new Map(
        allBalances.map(b => [b.platform, b])
      );
      lastUpdated.value = new Date();
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '获取余额失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchBalance(platform: PlatformType, currency?: Currency) {
    loading.value = true;
    error.value = null;

    try {
      const balance = await balanceService.getCurrentBalance(platform, currency);
      balances.value.set(platform, balance);
      lastUpdated.value = new Date();
      return balance;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '获取余额失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function setBalance(platform: PlatformType, amount: number, currency?: Currency) {
    loading.value = true;
    error.value = null;

    try {
      const balance = await balanceService.setBalance(platform, amount, currency);
      balances.value.set(platform, balance);
      lastUpdated.value = new Date();
      return balance;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '设置余额失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function adjustBalance(platform: PlatformType, delta: number) {
    loading.value = true;
    error.value = null;

    try {
      const balance = await balanceService.adjustBalance(platform, delta);
      balances.value.set(platform, balance);
      lastUpdated.value = new Date();
      return balance;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '调整余额失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function checkLowBalances() {
    try {
      const lowBalanceList = await balanceService.getLowBalances(50);
      return lowBalanceList;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '检查低余额失败';
      throw err;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    balances,
    loading,
    error,
    lastUpdated,

    // Getters
    balanceList,
    totalBalance,
    lowBalances,
    balanceByPlatform,
    isLowBalance,

    // Actions
    fetchBalances,
    fetchBalance,
    setBalance,
    adjustBalance,
    checkLowBalances,
    clearError
  };
});
