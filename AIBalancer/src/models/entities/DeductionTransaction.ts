/**
 * 事务状态枚举
 */
export enum TransactionStatus {
  PENDING = 'pending',
  COMMITTED = 'committed',
  ROLLED_BACK = 'rolled_back'
}

/**
 * 操作类型枚举
 */
export enum OperationType {
  USAGE = 'usage',       // 使用扣减
  REFUND = 'refund',     // 退款
  ADJUSTMENT = 'adjustment' // 调整
}

/**
 * 扣减事务接口
 */
export interface DeductionTransaction {
  transactionId: string;
  accountId: string;
  operationType: OperationType;
  totalUsage: number;
  usageUnit: string;
  status: TransactionStatus;
  startedAt: Date;
  committedAt?: Date;
  rolledBackAt?: Date;
  errorMessage?: string;
  metadata: Record<string, any>;
}

/**
 * 维度扣减记录接口
 */
export interface DimensionDeduction {
  id: string;
  transactionId: string;
  dimensionId: string;
  deductionAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  deductionStatus: TransactionStatus;
  relatedDimensionIds: string[];
  createdAt: Date;
}

/**
 * 扣减事务实体类
 */
export class DeductionTransactionEntity implements DeductionTransaction {
  constructor(
    public transactionId: string,
    public accountId: string,
    public operationType: OperationType = OperationType.USAGE,
    public totalUsage: number = 0,
    public usageUnit: string = 'tokens',
    public status: TransactionStatus = TransactionStatus.PENDING,
    public startedAt: Date = new Date(),
    public committedAt?: Date,
    public rolledBackAt?: Date,
    public errorMessage?: string,
    public metadata: Record<string, any> = {}
  ) {}

  /**
   * 创建事务
   */
  static create(params: Partial<DeductionTransaction> & { transactionId?: string; accountId: string }): DeductionTransactionEntity {
    return new DeductionTransactionEntity(
      params.transactionId || crypto.randomUUID(),
      params.accountId,
      params.operationType || OperationType.USAGE,
      params.totalUsage || 0,
      params.usageUnit || 'tokens',
      params.status || TransactionStatus.PENDING,
      params.startedAt ? new Date(params.startedAt) : new Date(),
      params.committedAt ? new Date(params.committedAt) : undefined,
      params.rolledBackAt ? new Date(params.rolledBackAt) : undefined,
      params.errorMessage,
      params.metadata || {}
    );
  }

  // ==================== 状态检查方法 ====================

  /**
   * 检查是否为待处理状态
   */
  isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  /**
   * 检查是否已提交
   */
  isCommitted(): boolean {
    return this.status === TransactionStatus.COMMITTED;
  }

  /**
   * 检查是否已回滚
   */
  isRolledBack(): boolean {
    return this.status === TransactionStatus.ROLLED_BACK;
  }

  /**
   * 检查是否已完成（提交或回滚）
   */
  isCompleted(): boolean {
    return this.isCommitted() || this.isRolledBack();
  }

  // ==================== 状态变更方法 ====================

  /**
   * 提交事务
   */
  commit(): void {
    if (!this.isPending()) {
      throw new Error('只能提交待处理状态的事务');
    }
    this.status = TransactionStatus.COMMITTED;
    this.committedAt = new Date();
  }

  /**
   * 回滚事务
   */
  rollback(errorMessage?: string): void {
    if (!this.isPending()) {
      throw new Error('只能回滚待处理状态的事务');
    }
    this.status = TransactionStatus.ROLLED_BACK;
    this.rolledBackAt = new Date();
    if (errorMessage) {
      this.errorMessage = errorMessage;
    }
  }

  /**
   * 设置错误信息
   */
  setError(message: string): void {
    this.errorMessage = message;
  }

  // ==================== 显示方法 ====================

  /**
   * 获取操作类型显示名称
   */
  getOperationTypeDisplayName(): string {
    const displayNames: Record<OperationType, string> = {
      [OperationType.USAGE]: '使用扣减',
      [OperationType.REFUND]: '退款',
      [OperationType.ADJUSTMENT]: '调整'
    };
    return displayNames[this.operationType] || this.operationType;
  }

  /**
   * 获取状态显示名称
   */
  getStatusDisplayName(): string {
    const displayNames: Record<TransactionStatus, string> = {
      [TransactionStatus.PENDING]: '待处理',
      [TransactionStatus.COMMITTED]: '已提交',
      [TransactionStatus.ROLLED_BACK]: '已回滚'
    };
    return displayNames[this.status] || this.status;
  }

  /**
   * 获取状态颜色
   */
  getStatusColor(): string {
    const colors: Record<TransactionStatus, string> = {
      [TransactionStatus.PENDING]: '#faad14',   // 橙色
      [TransactionStatus.COMMITTED]: '#52c41a', // 绿色
      [TransactionStatus.ROLLED_BACK]: '#f5222d' // 红色
    };
    return colors[this.status] || '#d9d9d9';
  }

  // ==================== 序列化方法 ====================

  /**
   * 转换为JSON对象
   */
  toJSON(): Record<string, any> {
    return {
      transactionId: this.transactionId,
      accountId: this.accountId,
      operationType: this.operationType,
      totalUsage: this.totalUsage,
      usageUnit: this.usageUnit,
      status: this.status,
      startedAt: this.startedAt instanceof Date ? this.startedAt.toISOString() : this.startedAt,
      committedAt: this.committedAt?.toISOString(),
      rolledBackAt: this.rolledBackAt?.toISOString(),
      errorMessage: this.errorMessage,
      metadata: this.metadata
    };
  }

  /**
   * 从JSON恢复
   */
  static fromJSON(json: Record<string, any>): DeductionTransactionEntity {
    return new DeductionTransactionEntity(
      json.transactionId || json.transaction_id,
      json.accountId || json.account_id,
      json.operationType || json.operation_type || OperationType.USAGE,
      json.totalUsage ?? json.total_usage ?? 0,
      json.usageUnit || json.usage_unit || 'tokens',
      json.status || TransactionStatus.PENDING,
      new Date(json.startedAt || json.started_at),
      json.committedAt || json.committed_at ? new Date(json.committedAt || json.committed_at) : undefined,
      json.rolledBackAt || json.rolled_back_at ? new Date(json.rolledBackAt || json.rolled_back_at) : undefined,
      json.errorMessage || json.error_message,
      json.metadata || {}
    );
  }

  /**
   * 克隆实体
   */
  clone(): DeductionTransactionEntity {
    return DeductionTransactionEntity.fromJSON(this.toJSON());
  }
}

/**
 * 维度扣减记录实体类
 */
export class DimensionDeductionEntity implements DimensionDeduction {
  constructor(
    public id: string,
    public transactionId: string,
    public dimensionId: string,
    public deductionAmount: number,
    public balanceBefore: number,
    public balanceAfter: number,
    public deductionStatus: TransactionStatus = TransactionStatus.PENDING,
    public relatedDimensionIds: string[] = [],
    public createdAt: Date = new Date()
  ) {}

  /**
   * 创建维度扣减记录
   */
  static create(params: Partial<DimensionDeduction> & { id?: string; transactionId: string; dimensionId: string }): DimensionDeductionEntity {
    return new DimensionDeductionEntity(
      params.id || crypto.randomUUID(),
      params.transactionId,
      params.dimensionId,
      params.deductionAmount || 0,
      params.balanceBefore || 0,
      params.balanceAfter || 0,
      params.deductionStatus || TransactionStatus.PENDING,
      params.relatedDimensionIds || [],
      params.createdAt ? new Date(params.createdAt) : new Date()
    );
  }

  /**
   * 转换为JSON对象
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      transactionId: this.transactionId,
      dimensionId: this.dimensionId,
      deductionAmount: this.deductionAmount,
      balanceBefore: this.balanceBefore,
      balanceAfter: this.balanceAfter,
      deductionStatus: this.deductionStatus,
      relatedDimensionIds: this.relatedDimensionIds,
      createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : this.createdAt
    };
  }

  /**
   * 从JSON恢复
   */
  static fromJSON(json: Record<string, any>): DimensionDeductionEntity {
    return new DimensionDeductionEntity(
      json.id,
      json.transactionId || json.transaction_id,
      json.dimensionId || json.dimension_id,
      json.deductionAmount ?? json.deduction_amount ?? 0,
      json.balanceBefore ?? json.balance_before ?? 0,
      json.balanceAfter ?? json.balance_after ?? 0,
      json.deductionStatus || json.deduction_status || TransactionStatus.PENDING,
      json.relatedDimensionIds || json.related_dimension_ids || [],
      new Date(json.createdAt || json.created_at)
    );
  }
}

/**
 * 配额可用性检查结果
 */
export interface QuotaAvailabilityResult {
  isAvailable: boolean;
  totalAvailable: number;
  dimensionResults: DimensionAvailabilityResult[];
  blockingReasons: string[];
}

/**
 * 单个维度的可用性结果
 */
export interface DimensionAvailabilityResult {
  dimensionId: string;
  dimensionName: string;
  availableBalance: number;
  isSufficient: boolean;
  deficit: number;
}

/**
 * 扣减执行结果
 */
export interface DeductionResult {
  success: boolean;
  transactionId: string;
  totalDeducted: number;
  dimensionDeductions: DimensionDeductionInfo[];
  errorMessage?: string;
}

/**
 * 扣减维度信息
 */
export interface DimensionDeductionInfo {
  dimensionId: string;
  dimensionName: string;
  deductedAmount: number;
  balanceBefore: number;
  balanceAfter: number;
}
