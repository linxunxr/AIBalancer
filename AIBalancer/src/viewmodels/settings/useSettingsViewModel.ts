/**
 * Settings ViewModel
 * 设置页面的视图逻辑
 */

import { BaseViewModel } from '../BaseViewModel';
import { computed } from 'vue';
import { useSettingsStore } from '../../models/stores/settingsStore';
import { AppSettings, Theme, AppSettingsEntity } from '../../models/entities/AppSettings';

interface SettingsState {
  settings: AppSettings | null;
  showAdvanced: boolean;
  activeTab: 'general' | 'notifications' | 'updates' | 'about';
}

export class SettingsViewModel extends BaseViewModel<SettingsState> {
  private settingsStore = useSettingsStore();

  // Computed properties
  readonly isDark = computed(() => this.settingsStore.isDarkTheme);
  readonly currentTheme = computed(() => this.state.settings?.theme ?? Theme.DARK);
  readonly autoCheckUpdates = computed(() => this.state.settings?.autoCheckUpdates ?? true);
  readonly minimizeToTray = computed(() => this.state.settings?.minimizeToTray ?? true);
  readonly startMinimized = computed(() => this.state.settings?.startMinimized ?? false);
  readonly notificationEnabled = computed(() => this.state.settings?.notificationEnabled ?? true);
  readonly lowBalanceThreshold = computed(() => this.state.settings?.lowBalanceThreshold ?? 50);
  readonly dailyBudgetWarning = computed(() => this.state.settings?.dailyBudgetWarning ?? 100);
  readonly monthlyBudgetWarning = computed(() => this.state.settings?.monthlyBudgetWarning ?? 3000);

  constructor() {
    super({
      settings: null,
      showAdvanced: false,
      activeTab: 'general'
    });
  }

  protected async onInitialize(): Promise<void> {
    await this.loadSettings();
  }

  /**
   * 加载设置
   */
  async loadSettings(): Promise<void> {
    try {
      const settings = await this.settingsStore.fetchSettings();
      this.state.settings = settings;
    } catch (error) {
      this.setError('加载设置失败');
      throw error;
    }
  }

  /**
   * 保存设置
   */
  async saveSettings(): Promise<void> {
    try {
      if (this.state.settings) {
        await this.settingsStore.saveSettings(this.state.settings);
      }
    } catch (error) {
      this.setError('保存设置失败');
      throw error;
    }
  }

  /**
   * 更新主题
   */
  async updateTheme(theme: Theme): Promise<void> {
    try {
      await this.settingsStore.setTheme(theme);

      if (this.state.settings) {
        this.state.settings.theme = theme;
      }
    } catch (error) {
      this.setError('更新主题失败');
      throw error;
    }
  }

  /**
   * 更新语言
   */
  async updateLanguage(language: string): Promise<void> {
    try {
      await this.settingsStore.setLanguage(language);

      if (this.state.settings) {
        this.state.settings.language = language;
      }
    } catch (error) {
      this.setError('更新语言失败');
      throw error;
    }
  }

  /**
   * 切换自动检查更新
   */
  async toggleAutoCheckUpdates(): Promise<void> {
    try {
      const newValue = !this.autoCheckUpdates.value;
      await this.settingsStore.setAutoCheckUpdates(newValue);

      if (this.state.settings) {
        this.state.settings.autoCheckUpdates = newValue;
      }
    } catch (error) {
      this.setError('更新失败');
      throw error;
    }
  }

  /**
   * 切换最小化到托盘
   */
  async toggleMinimizeToTray(): Promise<void> {
    try {
      const newValue = !this.minimizeToTray.value;
      await this.settingsStore.setMinimizeToTray(newValue);

      if (this.state.settings) {
        this.state.settings.minimizeToTray = newValue;
      }
    } catch (error) {
      this.setError('更新失败');
      throw error;
    }
  }

  /**
   * 切换通知
   */
  async toggleNotificationEnabled(): Promise<void> {
    try {
      const newValue = !this.notificationEnabled.value;
      await this.settingsStore.setNotificationEnabled(newValue);

      if (this.state.settings) {
        this.state.settings.notificationEnabled = newValue;
      }
    } catch (error) {
      this.setError('更新失败');
      throw error;
    }
  }

  /**
   * 更新低余额阈值
   */
  async updateLowBalanceThreshold(value: number): Promise<void> {
    try {
      await this.settingsStore.setLowBalanceThreshold(value);

      if (this.state.settings) {
        this.state.settings.lowBalanceThreshold = value;
      }
    } catch (error) {
      this.setError('更新失败');
      throw error;
    }
  }

  /**
   * 重置为默认设置
   */
  async resetToDefaults(): Promise<void> {
    try {
      const defaultSettings = await this.settingsStore.resetSettings();
      this.state.settings = defaultSettings;
    } catch (error) {
      this.setError('重置设置失败');
      throw error;
    }
  }

  /**
   * 切换高级选项
   */
  toggleAdvanced(): void {
    this.state.showAdvanced = !this.state.showAdvanced;
  }

  /**
   * 设置活动标签页
   */
  setActiveTab(tab: 'general' | 'notifications' | 'updates' | 'about'): void {
    this.state.activeTab = tab;
  }

  /**
   * 验证设置
   */
  validateSettings(): { valid: boolean; errors: string[] } {
    if (!this.state.settings) {
      return { valid: false, errors: ['设置未加载'] };
    }

    // 使用AppSettingsEntity的validate方法
    const entity = this.state.settings instanceof AppSettingsEntity
      ? this.state.settings
      : AppSettingsEntity.create(this.state.settings);
    return entity.validate();
  }
}
