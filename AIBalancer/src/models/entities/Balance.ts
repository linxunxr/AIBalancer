import { PlatformType } from './PlatformType';

export interface BalanceData {
  id: string;
  platform: string;
  platformIcon: string;
  currentBalance: number;
  currency: string;
  lastUpdate: Date;
  trend: {
    dailyChange: number;
    dailyAverageChange: number;
    weeklyChange: number;
  };
  usage?: {
    todayTokens: number;
    todayCost: number;
    monthlyTokens: number;
  };
}

export interface PlatformAccount {
  id: string;
  platform: string;
  apiKey: string;
  enabled: boolean;
  autoBalanceCheck: boolean;
  minBalanceThreshold: number;
}

export interface ActivityLog {
  id: string;
  type: 'balance' | 'api' | 'warning' | 'system' | 'success';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
}

/**
 * 货币类型枚举
 */
export enum Currency {
  CNY = 'CNY',
  USD = 'USD',
  EUR = 'EUR'
}

/**
 * 余额变更原因枚举
 */
export enum BalanceChangeReason {
  RECHARGE = 'recharge',
  USAGE = 'usage',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  SUBSCRIPTION = 'subscription'
}

/**
 * 余额历史记录
 */
export interface BalanceHistory {
  id?: string;
  balanceId: string;
  timestamp: Date;
  balance: number;
  change: number;
  reason: BalanceChangeReason;
  metadata?: Record<string, any>;
}

/**
 * 余额接口
 */
export interface Balance {
  id: string;
  platform: PlatformType;
  currentBalance: number;
  currency: Currency;
  lastUpdated: Date;
  history: BalanceHistory[];
  metadata: Record<string, any>;
}

/**
 * 余额趋势类型
 */
export type BalanceTrend = 'increasing' | 'decreasing' | 'stable';

/**
 * 余额趋势数据
 */
export interface BalanceTrendData {
  trend: BalanceTrend;
  dailyAverageChange: number;
  weeklyAverageChange: number;
  monthlyAverageChange: number;
  estimatedEmptyDays: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class BalanceEntity implements Balance {
  constructor(
    public id: string,
    public platform: PlatformType,
    public currentBalance: number,
    public currency: Currency = Currency.CNY,
    public lastUpdated: Date = new Date(),
    public history: BalanceHistory[] = [],
    public metadata: Record<string, any> = {}
  ) {}

  static create(params: Partial<Balance> & { id?: string; platform?: PlatformType }): BalanceEntity {
    return new BalanceEntity(
      params.id || crypto.randomUUID(),
      params.platform || PlatformType.DEEPSEEK,
      params.currentBalance || 0,
      params.currency || Currency.CNY,
      params.lastUpdated || new Date(),
      params.history || [],
      params.metadata || {}
    );
  }

  // ==================== 基础查询方法 ====================

  /**
   * 检查余额是否低于阈值
   */
  isLowBalance(threshold: number = 50): boolean {
    return this.currentBalance < threshold;
  }

  /**
   * 检查余额是否耗尽
   */
  isDepleted(): boolean {
    return this.currentBalance <= 0;
  }

  /**
   * 格式化余额显示
   */
  formatBalance(): string {
    const symbol = this.getCurrencySymbol();
    return `${symbol}${this.currentBalance.toFixed(2)}`;
  }

  /**
   * 获取货币符号
   */
  getCurrencySymbol(): string {
    const symbols: Record<Currency, string> = {
      [Currency.CNY]: '¥',
      [Currency.USD]: '$',
      [Currency.EUR]: '€'
    };
    return symbols[this.currency] || '¥';
  }

  /**
   * 计算剩余可用天数
   */
  getDaysUntilEmpty(dailyUsage: number): number {
    if (dailyUsage <= 0) return Infinity;
    if (this.currentBalance <= 0) return 0;
    return Math.floor(this.currentBalance / dailyUsage);
  }

  /**
   * 计算余额使用百分比
   */
  getUsagePercentage(maxBalance: number): number {
    if (maxBalance <= 0) return 0;
    return Math.min((this.currentBalance / maxBalance) * 100, 100);
  }

  // ==================== 历史记录管理 ====================

  /**
   * 添加历史记录
   */
  addHistoryEntry(
    balance: number,
    change: number,
    reason: BalanceChangeReason,
    metadata?: Record<string, any>
  ): void {
    const entry: BalanceHistory = {
      id: crypto.randomUUID(),
      balanceId: this.id,
      timestamp: new Date(),
      balance,
      change,
      reason,
      metadata
    };

    this.history.unshift(entry);
    this.lastUpdated = new Date();
  }

  /**
   * 获取指定天数内的历史记录
   */
  getHistoryInDays(days: number): BalanceHistory[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.history.filter(entry => new Date(entry.timestamp) >= cutoffDate);
  }

  /**
   * 获取最近N条历史记录
   */
  getRecentHistory(count: number = 10): BalanceHistory[] {
    return this.history.slice(0, count);
  }

  /**
   * 计算日均变化
   */
  calculateDailyAverageChange(days: number = 7): number {
    const recentHistory = this.getHistoryInDays(days);

    if (recentHistory.length < 2) return 0;

    const oldestEntry = recentHistory[recentHistory.length - 1];
    const latestEntry = recentHistory[0];
    const daysDiff = Math.max(
      1,
      Math.ceil((new Date(latestEntry.timestamp).getTime() - new Date(oldestEntry.timestamp).getTime()) / (24 * 60 * 60 * 1000))
    );

    const totalChange = latestEntry.balance - oldestEntry.balance;
    return totalChange / daysDiff;
  }

  /**
   * 计算周均变化
   */
  calculateWeeklyAverageChange(weeks: number = 4): number {
    return this.calculateDailyAverageChange(weeks * 7) * 7;
  }

  /**
   * 计算月均变化
   */
  calculateMonthlyAverageChange(months: number = 3): number {
    return this.calculateDailyAverageChange(months * 30) * 30;
  }

  // ==================== 趋势分析 ====================

  /**
   * 获取余额趋势
   */
  getTrend(days: number = 7): BalanceTrend {
    const dailyChange = this.calculateDailyAverageChange(days);

    if (Math.abs(dailyChange) < 1) return 'stable';
    return dailyChange > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * 获取完整趋势数据
   */
  getTrendData(dailyUsage: number, days: number = 7): BalanceTrendData {
    const dailyAverageChange = this.calculateDailyAverageChange(days);
    const weeklyAverageChange = this.calculateWeeklyAverageChange();
    const monthlyAverageChange = this.calculateMonthlyAverageChange();
    const estimatedEmptyDays = this.getDaysUntilEmpty(Math.abs(dailyAverageChange) || dailyUsage);
    const trend = this.getTrend(days);
    const riskLevel = this.calculateRiskLevel(estimatedEmptyDays);

    return {
      trend,
      dailyAverageChange,
      weeklyAverageChange,
      monthlyAverageChange,
      estimatedEmptyDays,
      riskLevel
    };
  }

  /**
   * 计算风险等级
   */
  calculateRiskLevel(estimatedEmptyDays: number): 'low' | 'medium' | 'high' | 'critical' {
    if (estimatedEmptyDays <= 3) return 'critical';
    if (estimatedEmptyDays <= 7) return 'high';
    if (estimatedEmptyDays <= 14) return 'medium';
    return 'low';
  }

  /**
   * 获取趋势图标
   */
  getTrendIcon(): string {
    const trend = this.getTrend();
    const icons: Record<BalanceTrend, string> = {
      increasing: 'ion:trending-up',
      decreasing: 'ion:trending-down',
      stable: 'ion:remove-outline'
    };
    return icons[trend];
  }

  /**
   * 获取趋势描述
   */
  getTrendDescription(days: number = 7): string {
    const trend = this.getTrend(days);
    const dailyChange = this.calculateDailyAverageChange(days);
    const sign = dailyChange >= 0 ? '+' : '';
    const formattedChange = `${sign}${dailyChange.toFixed(2)}`;

    const descriptions: Record<BalanceTrend, string> = {
      increasing: `余额稳定增长，日均 ${formattedChange}`,
      decreasing: `余额持续消耗，日均 ${formattedChange}`,
      stable: '余额变化平稳'
    };

    return descriptions[trend];
  }

  // ==================== 余额更新 ====================

  /**
   * 更新余额
   */
  updateBalance(newBalance: number, reason: BalanceChangeReason, metadata?: Record<string, any>): void {
    const change = newBalance - this.currentBalance;
    this.addHistoryEntry(newBalance, change, reason, metadata);
    this.currentBalance = newBalance;
    this.lastUpdated = new Date();
  }

  /**
   * 增加余额
   */
  addBalance(amount: number, reason: BalanceChangeReason, metadata?: Record<string, any>): void {
    const newBalance = this.currentBalance + amount;
    this.updateBalance(newBalance, reason, metadata);
  }

  /**
   * 减少余额
   */
  deductBalance(amount: number, reason: BalanceChangeReason, metadata?: Record<string, any>): void {
    const newBalance = Math.max(0, this.currentBalance - amount);
    this.updateBalance(newBalance, reason, metadata);
  }

  /**
   * 刷新余额（从API获取后调用）
   */
  refreshBalance(newBalance: number): void {
    const change = newBalance - this.currentBalance;
    const reason = change < 0 ? BalanceChangeReason.USAGE : BalanceChangeReason.ADJUSTMENT;

    if (Math.abs(change) > 0.01) {
      this.updateBalance(newBalance, reason);
    }

    this.lastUpdated = new Date();
  }

  // ==================== 序列化与反序列化 ====================

  /**
   * 转换为JSON对象
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      platform: this.platform,
      currentBalance: this.currentBalance,
      currency: this.currency,
      lastUpdated: this.lastUpdated instanceof Date ? this.lastUpdated.toISOString() : this.lastUpdated,
      history: this.history.map(entry => ({
        ...entry,
        timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp
      })),
      metadata: this.metadata
    };
  }

  /**
   * 从JSON恢复
   */
  static fromJSON(json: Record<string, any>): BalanceEntity {
    return new BalanceEntity(
      json.id,
      json.platform,
      json.currentBalance,
      json.currency || Currency.CNY,
      new Date(json.lastUpdated),
      (json.history || []).map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      })),
      json.metadata || {}
    );
  }

  /**
   * 克隆实体
   */
  clone(): BalanceEntity {
    return BalanceEntity.fromJSON(this.toJSON());
  }

  /**
   * 复制数据（用于更新）
   */
  copyFrom(source: Balance): void {
    this.id = source.id;
    this.platform = source.platform;
    this.currentBalance = source.currentBalance;
    this.currency = source.currency;
    this.lastUpdated = source.lastUpdated instanceof Date ? source.lastUpdated : new Date(source.lastUpdated);
    this.history = source.history.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }));
    this.metadata = { ...source.metadata };
  }
}
