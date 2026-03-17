import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LogSystemConfig, DefaultLogConfig } from '../entities';
import { logService } from '../services/LogService';

export const useLogStore = defineStore('log', () => {
  // State
  const config = ref<LogSystemConfig>(DefaultLogConfig);
  const loading = ref<boolean>(false);
  const initialized = ref<boolean>(false);

  // Computed
  const isDevelopment = computed(() => config.value.mode === 'development');

  // Actions
  async function loadConfig() {
    loading.value = true;
    try {
      const loaded = await logService.getConfig();
      config.value = loaded;
      initialized.value = true;
    } catch (error) {
      console.error('Failed to load log config:', error);
      // Use default config on error
      config.value = DefaultLogConfig;
    } finally {
      loading.value = false;
    }
  }

  async function saveConfig(newConfig: LogSystemConfig) {
    loading.value = true;
    try {
      await logService.saveConfig(newConfig);
      config.value = newConfig;
    } catch (error) {
      console.error('Failed to save log config:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  function resetToDefault() {
    config.value = { ...DefaultLogConfig };
  }

  return {
    config,
    loading,
    initialized,
    isDevelopment,
    loadConfig,
    saveConfig,
    resetToDefault,
  };
});
