/**
 * 维度类型枚举
 */
export enum DimensionType {
  TIME_BASED = 'time_based',   // 时间维度
  PERMANENT = 'permanent',     // 永久配额
  USAGE_BASED = 'usage_based'  // 使用量维度
}

/**
 * 时间周期枚举
 */
export enum TimePeriod {
  FIVE_HOURS = '5h',   // 5小时
  WEEKLY = '7d',       // 周
  MONTHLY = '30d',     // 月
  PERMANENT = 'permanent' // 永久
}

/**
 * 额度维度接口
 */
export interface QuotaDimension {
  id: string;
  groupId: string;
  dimensionName: string;
  dimensionType: DimensionType;
  unit: string;
  totalQuota: number;
  currentBalance: number;
  reservedBalance: number;
  timePeriod?: TimePeriod;
  resetTime?: string;
  resetDay?: number;
  timezone: string;
  lastResetAt?: Date;
  nextResetAt?: Date;
  autoReset: boolean;
  parentDimensionId?: string;
  nestingLevel: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 额度维度实体类
 */
export class QuotaDimensionEntity implements QuotaDimension {
  constructor(
    public id: string,
    public groupId: string,
    public dimensionName: string,
    public dimensionType: DimensionType = DimensionType.PERMANENT,
    public unit: string = 'tokens',
    public totalQuota: number = 0,
    public currentBalance: number = 0,
    public reservedBalance: number = 0,
    public timePeriod?: TimePeriod,
    public resetTime?: string,
    public resetDay?: number,
    public timezone: string = 'Asia/Shanghai',
    public lastResetAt?: Date,
    public nextResetAt?: Date,
    public autoReset: boolean = true,
    public parentDimensionId?: string,
    public nestingLevel: number = 0,
    public warningThreshold?: number,
    public criticalThreshold?: number,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  /**
   * 创建维度
   */
  static create(params: Partial<QuotaDimension> & { id?: string; groupId: string }): QuotaDimensionEntity {
    return new QuotaDimensionEntity(
      params.id || crypto.randomUUID(),
      params.groupId,
      params.dimensionName || '新维度',
      params.dimensionType || DimensionType.PERMANENT,
      params.unit || 'tokens',
      params.totalQuota || 0,
      params.currentBalance || 0,
      params.reservedBalance || 0,
      params.timePeriod,
      params.resetTime,
      params.resetDay,
      params.timezone || 'Asia/Shanghai',
      params.lastResetAt ? new Date(params.lastResetAt) : undefined,
      params.nextResetAt ? new Date(params.nextResetAt) : undefined,
      params.autoReset ?? true,
      params.parentDimensionId,
      params.nestingLevel || 0,
      params.warningThreshold,
      params.criticalThreshold,
      params.createdAt ? new Date(params.createdAt) : new Date(),
      params.updatedAt ? new Date(params.updatedAt) : new Date()
    );
  }

  // ==================== 余额计算方法 ====================

  /**
   * 计算可用余额（当前余额 - 预留余额）
   */
  getAvailableBalance(): number {
    return Math.max(0, this.currentBalance - this.reservedBalance);
  }

  /**
   * 计算使用率
   */
  getUsagePercentage(): number {
    if (this.totalQuota <= 0) return 0;
    return Math.min(100, ((this.totalQuota - this.currentBalance) / this.totalQuota) * 100);
  }

  /**
   * 计算剩余百分比
   */
  getRemainingPercentage(): number {
    return 100 - this.getUsagePercentage();
  }

  // ==================== 状态检查方法 ====================

  /**
   * 检查是否低于警告阈值
   */
  isWarning(): boolean {
    if (this.warningThreshold === undefined) return false;
    return this.currentBalance < this.warningThreshold;
  }

  /**
   * 检查是否低于严重阈值
   */
  isCritical(): boolean {
    if (this.criticalThreshold === undefined) return false;
    return this.currentBalance < this.criticalThreshold;
  }

  /**
   * 检查余额是否耗尽
   */
  isDepleted(): boolean {
    return this.getAvailableBalance() <= 0;
  }

  /**
   * 检查是否有足够的余额
   */
  hasSufficientBalance(amount: number): boolean {
    return this.getAvailableBalance() >= amount;
  }

  /**
   * 获取风险等级
   */
  getRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.isDepleted()) return 'critical';
    if (this.isCritical()) return 'high';
    if (this.isWarning()) return 'medium';
    return 'low';
  }

  // ==================== 时间周期相关方法 ====================

  /**
   * 获取时间周期显示名称
   */
  getTimePeriodDisplayName(): string {
    if (!this.timePeriod) return '无限制';
    const displayNames: Record<TimePeriod, string> = {
      [TimePeriod.FIVE_HOURS]: '5小时',
      [TimePeriod.WEEKLY]: '周',
      [TimePeriod.MONTHLY]: '月',
      [TimePeriod.PERMANENT]: '永久'
    };
    return displayNames[this.timePeriod] || this.timePeriod;
  }

  /**
   * 获取维度类型显示名称
   */
  getDimensionTypeDisplayName(): string {
    const displayNames: Record<DimensionType, string> = {
      [DimensionType.TIME_BASED]: '时间维度',
      [DimensionType.PERMANENT]: '永久配额',
      [DimensionType.USAGE_BASED]: '使用量维度'
    };
    return displayNames[this.dimensionType] || this.dimensionType;
  }

  /**
   * 计算下次重置时间
   */
  calculateNextResetTime(): Date | null {
    if (this.timePeriod === TimePeriod.PERMANENT || !this.timePeriod) {
      return null;
    }

    const now = new Date();
    
    switch (this.timePeriod) {
      case TimePeriod.FIVE_HOURS:
        return new Date(now.getTime() + 5 * 60 * 60 * 1000);
      
      case TimePeriod.WEEKLY:
        const weekLater = new Date(now);
        weekLater.setDate(weekLater.getDate() + 7);
        return weekLater;
      
      case TimePeriod.MONTHLY:
        const monthLater = new Date(now);
        monthLater.setMonth(monthLater.getMonth() + 1);
        return monthLater;
      
      default:
        return null;
    }
  }

  // ==================== 余额操作方法 ====================

  /**
   * 预留余额
   */
  reserve(amount: number): boolean {
    if (!this.hasSufficientBalance(amount)) return false;
    this.reservedBalance += amount;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * 释放预留余额
   */
  releaseReservation(amount: number): void {
    this.reservedBalance = Math.max(0, this.reservedBalance - amount);
    this.updatedAt = new Date();
  }

  /**
   * 执行扣减
   */
  deduct(amount: number): boolean {
    if (!this.hasSufficientBalance(amount)) return false;
    this.currentBalance -= amount;
    // 同时减少预留余额（如果有）
    if (this.reservedBalance > 0) {
      this.reservedBalance = Math.max(0, this.reservedBalance - amount);
    }
    this.updatedAt = new Date();
    return true;
  }

  /**
   * 重置余额（刷新周期）
   */
  reset(): void {
    this.currentBalance = this.totalQuota;
    this.reservedBalance = 0;
    this.lastResetAt = new Date();
    this.nextResetAt = this.calculateNextResetTime() || undefined;
    this.updatedAt = new Date();
  }

  // ==================== 序列化方法 ====================

  /**
   * 转换为JSON对象
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      groupId: this.groupId,
      dimensionName: this.dimensionName,
      dimensionType: this.dimensionType,
      unit: this.unit,
      totalQuota: this.totalQuota,
      currentBalance: this.currentBalance,
      reservedBalance: this.reservedBalance,
      timePeriod: this.timePeriod,
      resetTime: this.resetTime,
      resetDay: this.resetDay,
      timezone: this.timezone,
      lastResetAt: this.lastResetAt?.toISOString(),
      nextResetAt: this.nextResetAt?.toISOString(),
      autoReset: this.autoReset,
      parentDimensionId: this.parentDimensionId,
      nestingLevel: this.nestingLevel,
      warningThreshold: this.warningThreshold,
      criticalThreshold: this.criticalThreshold,
      createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : this.createdAt,
      updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : this.updatedAt
    };
  }

  /**
   * 从JSON恢复
   */
  static fromJSON(json: Record<string, any>): QuotaDimensionEntity {
    return new QuotaDimensionEntity(
      json.id,
      json.groupId || json.group_id,
      json.dimensionName || json.dimension_name,
      json.dimensionType || json.dimension_type || DimensionType.PERMANENT,
      json.unit || 'tokens',
      json.totalQuota ?? json.total_quota ?? 0,
      json.currentBalance ?? json.current_balance ?? 0,
      json.reservedBalance ?? json.reserved_balance ?? 0,
      json.timePeriod || json.time_period,
      json.resetTime || json.reset_time,
      json.resetDay || json.reset_day,
      json.timezone || 'Asia/Shanghai',
      json.lastResetAt || json.last_reset_at ? new Date(json.lastResetAt || json.last_reset_at) : undefined,
      json.nextResetAt || json.next_reset_at ? new Date(json.nextResetAt || json.next_reset_at) : undefined,
      json.autoReset ?? json.auto_reset ?? true,
      json.parentDimensionId || json.parent_dimension_id,
      json.nestingLevel ?? json.nesting_level ?? 0,
      json.warningThreshold ?? json.warning_threshold,
      json.criticalThreshold ?? json.critical_threshold,
      new Date(json.createdAt || json.created_at),
      new Date(json.updatedAt || json.updated_at)
    );
  }

  /**
   * 克隆实体
   */
  clone(): QuotaDimensionEntity {
    return QuotaDimensionEntity.fromJSON(this.toJSON());
  }
}

/**
 * 维度关联关系接口
 */
export interface DimensionRelation {
  id: string;
  parentDimensionId: string;
  childDimensionId: string;
  relationType: string;
  deductionRatio: number;
  syncDeduction: boolean;
  requireBothAvailable: boolean;
  createdAt: Date;
}
