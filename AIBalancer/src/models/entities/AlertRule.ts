/**
 * Alert Rule Entity
 * 告警规则定义
 */

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  platform: PlatformType;
  threshold: number;
  enabled: boolean;
  notificationMethods: NotificationMethod[];
  cooldownMinutes: number;
  lastTriggered?: Date;
  metadata: Record<string, any>;
}

export enum AlertType {
  LOW_BALANCE = 'low_balance',
  HIGH_USAGE = 'high_usage',
  DAILY_BUDGET = 'daily_budget',
  MONTHLY_BUDGET = 'monthly_budget'
}

export enum PlatformType {
  DEEPSEEK = 'deepseek',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  CUSTOM = 'custom'
}

export enum NotificationMethod {
  DESKTOP = 'desktop',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  SOUND = 'sound'
}

/**
 * Alert Rule Entity Class
 */
export class AlertRuleEntity implements AlertRule {
  constructor(
    public id: string,
    public name: string,
    public type: AlertType,
    public platform: PlatformType,
    public threshold: number,
    public enabled: boolean,
    public notificationMethods: NotificationMethod[],
    public cooldownMinutes: number,
    public lastTriggered?: Date,
    public metadata: Record<string, any> = {}
  ) {}

  static create(params: Partial<AlertRule>): AlertRuleEntity {
    return new AlertRuleEntity(
      params.id || crypto.randomUUID(),
      params.name || '',
      params.type || AlertType.LOW_BALANCE,
      params.platform || PlatformType.DEEPSEEK,
      params.threshold || 0,
      params.enabled !== undefined ? params.enabled : true,
      params.notificationMethods || [NotificationMethod.DESKTOP],
      params.cooldownMinutes || 60,
      params.lastTriggered,
      params.metadata || {}
    );
  }

  /**
   * 检查是否可以触发（考虑冷却时间）
   */
  canTrigger(): boolean {
    if (!this.enabled) return false;
    if (!this.lastTriggered) return true;

    const cooldownMs = this.cooldownMinutes * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - this.lastTriggered.getTime();
    return timeSinceLastTrigger >= cooldownMs;
  }

  /**
   * 触发告警
   */
  trigger(): void {
    this.lastTriggered = new Date();
  }

  /**
   * 判断是否满足触发条件
   */
  evaluateCondition(value: number): boolean {
    switch (this.type) {
      case AlertType.LOW_BALANCE:
        return value <= this.threshold;
      case AlertType.HIGH_USAGE:
      case AlertType.DAILY_BUDGET:
      case AlertType.MONTHLY_BUDGET:
        return value >= this.threshold;
      default:
        return false;
    }
  }

  /**
   * 获取告警描述
   */
  getDescription(): string {
    switch (this.type) {
      case AlertType.LOW_BALANCE:
        return `余额低于 ${this.threshold} 元`;
      case AlertType.HIGH_USAGE:
        return `使用量超过 ${this.threshold}`;
      case AlertType.DAILY_BUDGET:
        return `日预算超过 ${this.threshold}`;
      case AlertType.MONTHLY_BUDGET:
        return `月预算超过 ${this.threshold}`;
      default:
        return '未知告警类型';
    }
  }
}
