/**
 * Settings Store
 * 应用设置状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { AppSettings, Theme } from '../entities/AppSettings';
import { AppError } from '../../core/errors';

export interface SettingsState {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<AppSettings | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Services
  const settingsRepository = new SettingsRepository();

  // Getters
  const isDarkTheme = computed(() => {
    return settings.value?.theme === Theme.DARK ||
           settings.value?.theme === Theme.AUTO;
  });

  const autoCheckUpdates = computed(() => {
    return settings.value?.autoCheckUpdates ?? true;
  });

  const minimizeToTray = computed(() => {
    return settings.value?.minimizeToTray ?? true;
  });

  const notificationEnabled = computed(() => {
    return settings.value?.notificationEnabled ?? true;
  });

  const lowBalanceThreshold = computed(() => {
    return settings.value?.lowBalanceThreshold ?? 50;
  });

  // Actions
  async function fetchSettings() {
    loading.value = true;
    error.value = null;

    try {
      const appSettings = await settingsRepository.getAppSettings();
      settings.value = appSettings;
      return appSettings;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '获取设置失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function saveSettings(newSettings: AppSettings) {
    loading.value = true;
    error.value = null;

    try {
      const saved = await settingsRepository.saveAppSettings(newSettings);
      settings.value = saved;
      return saved;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '保存设置失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) {
    loading.value = true;
    error.value = null;

    try {
      const updated = await settingsRepository.updateSetting(key, value);
      if (settings.value) {
        settings.value[key] = value;
      }
      return updated;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '更新设置失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function resetSettings() {
    loading.value = true;
    error.value = null;

    try {
      const defaultSettings = await settingsRepository.resetToDefaults();
      settings.value = defaultSettings;
      return defaultSettings;
    } catch (err) {
      error.value = err instanceof AppError ? err.message : '重置设置失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function setTheme(theme: Theme) {
    await updateSetting('theme', theme);
  }

  async function setLanguage(language: string) {
    await updateSetting('language', language);
  }

  async function setAutoCheckUpdates(enabled: boolean) {
    await updateSetting('autoCheckUpdates', enabled);
  }

  async function setMinimizeToTray(enabled: boolean) {
    await updateSetting('minimizeToTray', enabled);
  }

  async function setNotificationEnabled(enabled: boolean) {
    await updateSetting('notificationEnabled', enabled);
  }

  async function setLowBalanceThreshold(threshold: number) {
    await updateSetting('lowBalanceThreshold', threshold);
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    settings,
    loading,
    error,

    // Getters
    isDarkTheme,
    autoCheckUpdates,
    minimizeToTray,
    notificationEnabled,
    lowBalanceThreshold,

    // Actions
    fetchSettings,
    saveSettings,
    updateSetting,
    resetSettings,
    setTheme,
    setLanguage,
    setAutoCheckUpdates,
    setMinimizeToTray,
    setNotificationEnabled,
    setLowBalanceThreshold,
    clearError
  };
});
