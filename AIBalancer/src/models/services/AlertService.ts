/**
 * Alert Service
 * 告警服务
 */

import { SettingsRepository } from '../repositories/SettingsRepository';
import { AlertRule, AlertRuleEntity, AlertType, PlatformType, NotificationMethod } from '../entities/AlertRule';
import { AppError, ErrorCode } from '../../core/errors';

export interface Alert {
  id: string;
  type: AlertType;
  platform: PlatformType;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export class AlertService {
  private settingsRepository: SettingsRepository;
  private alerts: Map<string, Alert> = new Map();
  private alertRules: AlertRule[] = [];

  constructor(settingsRepository?: AppSettingsRepository) {
    this.settingsRepository = settingsRepository || new SettingsRepository();
  }

  /**
   * 初始化告警服务
   */
  async initialize(): Promise<void> {
    try {
      await this.loadAlertRules();
    } catch (error) {
      console.error('[AlertService] Initialization failed:', error);
    }
  }

  /**
   * 加载告警规则
   */
  private async loadAlertRules(): Promise<void> {
    // TODO: 从数据库加载告警规则
    // 这里使用默认规则
    this.alertRules = [
      AlertRuleEntity.create({
        name: '低余额告警',
        type: AlertType.LOW_BALANCE,
        platform: PlatformType.DEEPSEEK,
        threshold: 50,
        enabled: true,
        notificationMethods: [NotificationMethod.DESKTOP],
        cooldownMinutes: 60
      })
    ];
  }

  /**
   * 触发低余额告警
   */
  async triggerLowBalanceAlert(balance: any): Promise<void> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      type: AlertType.LOW_BALANCE,
      platform: balance.platform,
      message: `${balance.platform} 余额低于阈值: ¥${balance.currentBalance}`,
      severity: 'warning',
      timestamp: new Date(),
      read: false
    };

    await this.sendAlert(alert);
  }

  /**
   * 触发高使用量告警
   */
  async triggerHighUsageAlert(
    platform: PlatformType,
    usage: number,
    threshold: number
  ): Promise<void> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      type: AlertType.HIGH_USAGE,
      platform,
      message: `${platform} 今日使用量超过阈值: ${usage} > ${threshold}`,
      severity: 'warning',
      timestamp: new Date(),
      read: false
    };

    await this.sendAlert(alert);
  }

  /**
   * 触发预算告警
   */
  async triggerBudgetAlert(
    platform: PlatformType,
    usage: number,
    budget: number,
    period: 'daily' | 'monthly'
  ): Promise<void> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      type: period === 'daily' ? AlertType.DAILY_BUDGET : AlertType.MONTHLY_BUDGET,
      platform,
      message: `${platform} ${period === 'daily' ? '日' : '月'}预算警告: ¥${usage} / ¥${budget}`,
      severity: usage >= budget ? 'error' : 'warning',
      timestamp: new Date(),
      read: false
    };

    await this.sendAlert(alert);
  }

  /**
   * 发送告警
   */
  private async sendAlert(alert: Alert): Promise<void> {
    // 保存告警
    this.alerts.set(alert.id, alert);

    // 获取告警规则
    const rule = this.alertRules.find(r =>
      r.type === alert.type && r.platform === alert.platform && r.enabled
    );

    if (!rule) {
      return;
    }

    // 检查冷却时间
    if (!rule.canTrigger()) {
      return;
    }

    // 发送通知
    await this.sendNotifications(alert, rule.notificationMethods);

    // 更新规则触发时间
    rule.trigger();
  }

  /**
   * 发送通知
   */
  private async sendNotifications(
    alert: Alert,
    methods: NotificationMethod[]
  ): Promise<void> {
    const settings = await this.settingsRepository.getAppSettings();

    if (!settings.notificationEnabled) {
      return;
    }

    for (const method of methods) {
      switch (method) {
        case NotificationMethod.DESKTOP:
          await this.sendDesktopNotification(alert);
          break;
        case NotificationMethod.SOUND:
          await this.playSound(alert);
          break;
        case NotificationMethod.EMAIL:
          // TODO: 实现邮件通知
          break;
        case NotificationMethod.WEBHOOK:
          // TODO: 实现Webhook通知
          break;
      }
    }
  }

  /**
   * 发送桌面通知
   */
  private async sendDesktopNotification(alert: Alert): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('AIBalancer 告警', {
        body: alert.message,
        icon: '/icon.png',
        badge: '/icon.png',
        requireInteraction: alert.severity === 'error'
      });
    }
  }

  /**
   * 播放提示音
   */
  private async playSound(alert: Alert): Promise<void> {
    try {
      const audio = new Audio('/sounds/alert.mp3');
      audio.volume = alert.severity === 'error' ? 0.8 : 0.5;
      await audio.play();
    } catch (error) {
      console.error('[AlertService] Failed to play sound:', error);
    }
  }

  /**
   * 获取所有告警
   */
  getAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 获取未读告警
   */
  getUnreadAlerts(): Alert[] {
    return this.getAlerts().filter(alert => !alert.read);
  }

  /**
   * 标记告警为已读
   */
  markAsRead(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.read = true;
    }
  }

  /**
   * 清除所有已读告警
   */
  clearReadAlerts(): void {
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.read) {
        this.alerts.delete(id);
      }
    }
  }

  /**
   * 清除所有告警
   */
  clearAllAlerts(): void {
    this.alerts.clear();
  }

  /**
   * 添加告警规则
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * 移除告警规则
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules = this.alertRules.filter(r => r.id !== ruleId);
  }

  /**
   * 获取所有告警规则
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * 更新告警规则
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  /**
   * 请求通知权限
   */
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}
