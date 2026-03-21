/**
 * 策略类型枚举
 */
export enum StrategyType {
  NESTED = 'nested',     // 嵌套策略
  PARALLEL = 'parallel', // 并行策略
  PRIORITY = 'priority', // 优先级策略
  SINGLE = 'single'      // 单维度策略
}

/**
 * 额度策略组接口
 */
export interface QuotaStrategyGroup {
  id: string;
  accountId: string;
  name: string;
  strategyType: StrategyType;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 额度策略组实体类
 */
export class QuotaStrategyGroupEntity implements QuotaStrategyGroup {
  constructor(
    public id: string,
    public accountId: string,
    public name: string,
    public strategyType: StrategyType = StrategyType.SINGLE,
    public isActive: boolean = true,
    public priority: number = 0,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  /**
   * 创建策略组
   */
  static create(params: Partial<QuotaStrategyGroup> & { id?: string; accountId: string }): QuotaStrategyGroupEntity {
    return new QuotaStrategyGroupEntity(
      params.id || crypto.randomUUID(),
      params.accountId,
      params.name || '新策略组',
      params.strategyType || StrategyType.SINGLE,
      params.isActive ?? true,
      params.priority || 0,
      params.createdAt ? new Date(params.createdAt) : new Date(),
      params.updatedAt ? new Date(params.updatedAt) : new Date()
    );
  }

  /**
   * 获取策略类型显示名称
   */
  getStrategyTypeDisplayName(): string {
    const displayNames: Record<StrategyType, string> = {
      [StrategyType.NESTED]: '嵌套策略',
      [StrategyType.PARALLEL]: '并行策略',
      [StrategyType.PRIORITY]: '优先级策略',
      [StrategyType.SINGLE]: '单维度策略'
    };
    return displayNames[this.strategyType] || this.strategyType;
  }

  /**
   * 转换为JSON对象
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      accountId: this.accountId,
      name: this.name,
      strategyType: this.strategyType,
      isActive: this.isActive,
      priority: this.priority,
      createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : this.createdAt,
      updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : this.updatedAt
    };
  }

  /**
   * 从JSON恢复
   */
  static fromJSON(json: Record<string, any>): QuotaStrategyGroupEntity {
    return new QuotaStrategyGroupEntity(
      json.id,
      json.accountId || json.account_id,
      json.name,
      json.strategyType || json.strategy_type || StrategyType.SINGLE,
      json.isActive ?? json.is_active ?? true,
      json.priority || 0,
      new Date(json.createdAt || json.created_at),
      new Date(json.updatedAt || json.updated_at)
    );
  }

  /**
   * 克隆实体
   */
  clone(): QuotaStrategyGroupEntity {
    return QuotaStrategyGroupEntity.fromJSON(this.toJSON());
  }
}
