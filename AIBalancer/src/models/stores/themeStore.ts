import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'auto';

export default defineStore('theme', () => {
  const storedTheme = localStorage.getItem('theme-mode') as ThemeMode;
  const theme = ref<ThemeMode>(storedTheme || 'auto');
  const systemTheme = ref<'light' | 'dark'>('light');

  // 计算实际应用的主题
  const actualTheme = computed(() => {
    if (theme.value === 'auto') {
      return systemTheme.value;
    }
    return theme.value;
  });

  // 应用主题到document
  const applyTheme = (mode: 'light' | 'dark') => {
    const html = document.documentElement;
    if (mode === 'dark') {
      html.classList.remove('light-theme');
      html.classList.add('dark-theme');
    } else {
      html.classList.remove('dark-theme');
      html.classList.add('light-theme');
    }
  };

  // 切换主题
  const toggleTheme = () => {
    if (theme.value === 'light') {
      setTheme('dark');
    } else if (theme.value === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  };

  const setTheme = (mode: ThemeMode) => {
    theme.value = mode;
    localStorage.setItem('theme-mode', mode);
    applyTheme(actualTheme.value);
  };

  // 监听系统主题变化
  const updateSystemTheme = () => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      systemTheme.value = 'dark';
    } else {
      systemTheme.value = 'light';
    }
    if (theme.value === 'auto') {
      applyTheme(systemTheme.value);
    }
  };

  // 初始化
  const initTheme = () => {
    updateSystemTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme);
    applyTheme(actualTheme.value);
  };

  // 监听theme变化
  watch(theme, () => {
    applyTheme(actualTheme.value);
  });

  return {
    theme,
    systemTheme,
    actualTheme,
    toggleTheme,
    setTheme,
    initTheme,
  };
});
