/**
 * App Settings Entity
 * 应用设置
 */

export interface AppSettings {
  id: string;
  theme: Theme;
  language: string;
  autoCheckUpdates: boolean;
  autoCheckInterval: number;
  minimizeToTray: boolean;
  startMinimized: boolean;
  lowBalanceThreshold: number;
  dailyBudgetWarning: number;
  monthlyBudgetWarning: number;
  notificationEnabled: boolean;
{
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

/**
 * App Settings Entity Class
 */
export class AppSettingsEntity implements AppSettings {
  constructor(
    public id: string,
    public theme: Theme,
    public language: string,
    public autoCheckUpdates: boolean,
    public autoCheckInterval: number,
    public minimizeToTray: boolean,
    public startMinimized: boolean,
    public lowBalanceThreshold: number,
    public dailyBudgetWarning: number,
    public monthlyBudgetWarning: number,
    public notificationEnabled: boolean,
  ) {}

  static create(params: Partial<AppSettings>): AppSettingsEntity {
    return new AppSettingsEntity(
      params.id || 'app-settings',
      params.theme || Theme.DARK,
      params.language || 'zh-CN',
      params.autoCheckUpdates !== undefined ? params.autoCheckUpdates : true,
      params.autoCheckInterval || 3600000,
      params.minimizeToTray !== undefined ? params.minimizeToTray : true,
      params.startMinimized !== undefined ? params.startMinimized : false,
      params.lowBalanceThreshold ?? 50,
      params.dailyBudgetWarning ?? 100,
      params.monthlyBudgetWarning ?? 3000,
      params.notificationEnabled !== undefined ? params.notificationEnabled : true,
    );
  }

  /**
   * 获取默认设置
   */
  static getDefault(): AppSettingsEntity {
    return AppSettingsEntity.create({});
  }

  /**
   * 验证设置有效性
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.autoCheckInterval < 60000) {
      errors.push('自动检查间隔不能小于1分钟');
    }

    if (this.lowBalanceThreshold < 0) {
      errors.push('低余额阈值不能为负数');
    }

    if (this.dailyBudgetWarning < 0) {
      errors.push('日预算告警阈值不能为负数');
    }

    if (this.monthlyBudgetWarning < 0) {
      errors.push('月预算告警阈值不能为负数');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 转换为可序列化的对象
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      theme: this.theme,
      language: this.language,
      autoCheckUpdates: this.autoCheckUpdates,
      autoCheckInterval: this.autoCheckInterval,
      minimizeToTray: this.minimizeToTray,
      startMinimized: this.startMinimized,
      lowBalanceThreshold: this.lowBalanceThreshold,
      dailyBudgetWarning: this.dailyBudgetWarning,
      monthlyBudgetWarning: this.monthlyBudgetWarning,
      notificationEnabled: this.notificationEnabled
    };
  }

  /**
   * 从JSON对象恢复
   */
  static fromJSON(json: Record<string, any>): AppSettingsEntity {
    return AppSettingsEntity.create({
      id: json.id,
      theme: json.theme,
      language: json.language,
      autoCheckUpdates: json.autoCheckUpdates,
      autoCheckInterval: json.autoCheckInterval,
      minimizeToTray: json.minimizeToTray,
      startMinimized: json.startMinimized,
      lowBalanceThreshold: json.lowBalanceThreshold,
      dailyBudgetWarning: json.dailyBudgetWarning,
      monthlyBudgetWarning: json.monthlyBudgetWarning,
      notificationEnabled: json.notificationEnabled
    });
  }
}
