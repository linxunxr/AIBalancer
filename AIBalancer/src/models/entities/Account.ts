/**
 * 账户状态枚举
 */
export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  TESTING = 'testing',
  EXPIRED = 'expired'
}

/**
 * 账户基础类型枚举（按计费模式划分）
 */
export enum AccountCategory {
  DIRECT_BALANCE = 'direct_balance',           // 直接余额账户
  COMPREHENSIVE_QUOTA = 'comprehensive_quota', // 综合配额账户
  SUBSCRIPTION_PLAN = 'subscription_plan',     // 订阅计划账户
  TOKENS_ACCOUNT = 'tokens_account'            // Tokens账户
}

/**
 * 账户类型枚举（服务商类型）
 */
export enum AccountType {
  DEEPSEEK = 'deepseek',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  ARK_CODING_PLAN = 'ark_coding_plan',   // 方舟Coding Plan
  ALIYUN_QWEN = 'aliyun_qwen',           // 阿里云通义千问
  CUSTOM = 'custom'
}

/**
 * API 密钥信息
 */
export interface ApiKeyInfo {
  id: string;
  key: string;  // 加密存储
  lastUsed: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

/**
 * 账户使用统计
 */
export interface AccountUsage {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  lastUsed: string;
  dailyAverage: number;
  monthlyUsage: Array<{
    month: string;
    tokens: number;
    cost: number;
  }>;
}

/**
 * 账户告警
 */
export interface AccountAlert {
  id: string;
  type: 'low_balance' | 'high_usage' | 'key_expired' | 'api_error';
  message: string;
  severity: 'info' | 'warning' | 'error';
  triggeredAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

/**
 * 账户元数据
 */
export interface AccountMetadata {
  organization?: string;
  project?: string;
  tags: string[];
  notes?: string;
  customFields: Record<string, any>;
}

/**
 * 账户设置
 */
export interface AccountSettings {
  autoRefresh: boolean;
  refreshInterval: number;  // 分钟
  lowBalanceThreshold: number;
  enableAlerts: boolean;
  usageLimit?: number;
}

/**
 * 账户实体（完整定义）
 */
export interface Account {
  id: string;
  name: string;
  category: AccountCategory;  // 基础类型（计费模式）
  type: AccountType;          // 服务商类型
  status: AccountStatus;
  apiKeys: ApiKeyInfo[];
  currentBalance: number;
  currency: string;
  usage: AccountUsage;
  alerts: AccountAlert[];
  metadata: AccountMetadata;
  settings: AccountSettings;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
}

/**
 * 账户创建参数
 */
export interface CreateAccountParams {
  name: string;
  category?: AccountCategory;  // 基础类型（可选，根据 type 自动推断）
  type: AccountType;
  apiKey: string;
  organization?: string;
  project?: string;
  tags?: string[];
  notes?: string;
  settings?: Partial<AccountSettings>;
}

/**
 * 账户更新参数
 */
export interface UpdateAccountParams {
  id: string;
  name?: string;
  status?: AccountStatus;
  apiKeys?: ApiKeyInfo[];
  metadata?: Partial<AccountMetadata>;
  settings?: Partial<AccountSettings>;
  usage?: Partial<AccountUsage>;
  alerts?: AccountAlert[];
}

/**
 * 账户过滤参数
 */
export interface AccountFilter {
  types?: AccountType[];
  statuses?: AccountStatus[];
  tags?: string[];
  search?: string;
  minBalance?: number;
  maxBalance?: number;
  hasAlerts?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 账户统计汇总
 */
export interface AccountsSummary {
  total: number;
  active: number;
  inactive: number;
  withErrors: number;
  totalBalance: number;
  totalUsage: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

/**
 * 连接测试结果
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  balance?: number;
  details?: Record<string, any>;
}

/**
 * 默认账户设置
 */
export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  autoRefresh: true,
  refreshInterval: 30,
  lowBalanceThreshold: 50,
  enableAlerts: true
};

/**
 * 默认账户使用统计
 */
export const DEFAULT_ACCOUNT_USAGE: AccountUsage = {
  totalTokens: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalCost: 0,
  lastUsed: new Date().toISOString(),
  dailyAverage: 0,
  monthlyUsage: []
};

/**
 * 获取状态显示名称
 */
export function getStatusLabel(status: AccountStatus): string {
  const labels: Record<AccountStatus, string> = {
    [AccountStatus.ACTIVE]: '活跃',
    [AccountStatus.INACTIVE]: '停用',
    [AccountStatus.ERROR]: '异常',
    [AccountStatus.TESTING]: '测试中',
    [AccountStatus.EXPIRED]: '已过期'
  };
  return labels[status] || status;
}

/**
 * 获取类型显示名称
 */
export function getTypeLabel(type: AccountType): string {
  const labels: Record<AccountType, string> = {
    [AccountType.DEEPSEEK]: 'DeepSeek',
    [AccountType.OPENAI]: 'OpenAI',
    [AccountType.ANTHROPIC]: 'Anthropic',
    [AccountType.ARK_CODING_PLAN]: '方舟Coding Plan',
    [AccountType.ALIYUN_QWEN]: '阿里云通义千问',
    [AccountType.CUSTOM]: '自定义'
  };
  return labels[type] || type;
}

/**
 * 获取状态标签类型（用于 UI）
 */
export function getStatusTagType(status: AccountStatus): 'success' | 'warning' | 'error' | 'default' {
  const types: Record<AccountStatus, 'success' | 'warning' | 'error' | 'default'> = {
    [AccountStatus.ACTIVE]: 'success',
    [AccountStatus.INACTIVE]: 'default',
    [AccountStatus.ERROR]: 'error',
    [AccountStatus.TESTING]: 'warning',
    [AccountStatus.EXPIRED]: 'error'
  };
  return types[status] || 'default';
}

/**
 * 兼容旧版本的简化类型（用于迁移）
 */
export interface LegacyAccount {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'custom';
  apiKey: string;
  notes?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 将旧版账户转换为新版账户
 */
export function migrateLegacyAccount(legacy: LegacyAccount): Account {
  const now = new Date().toISOString();
  const typeMap: Record<string, AccountType> = {
    'anthropic': AccountType.ANTHROPIC,
    'openai': AccountType.OPENAI,
    'custom': AccountType.CUSTOM
  };

  const accountType = typeMap[legacy.provider] || AccountType.CUSTOM;

  return {
    id: legacy.id,
    name: legacy.name,
    category: getCategoryForProvider(accountType),
    type: accountType,
    status: legacy.enabled ? AccountStatus.ACTIVE : AccountStatus.INACTIVE,
    apiKeys: [{
      id: crypto.randomUUID(),
      key: legacy.apiKey,
      lastUsed: now,
      usageCount: 0,
      isActive: true,
      createdAt: legacy.createdAt
    }],
    currentBalance: 0,
    currency: 'CNY',
    usage: { ...DEFAULT_ACCOUNT_USAGE },
    alerts: [],
    metadata: {
      notes: legacy.notes,
      tags: [],
      customFields: {}
    },
    settings: { ...DEFAULT_ACCOUNT_SETTINGS },
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    lastSyncedAt: now
  };
}

// ==================== 类型映射常量 ====================

/**
 * 基础类型对应的服务商列表
 */
export const CATEGORY_PROVIDER_MAP: Record<AccountCategory, AccountType[]> = {
  [AccountCategory.DIRECT_BALANCE]: [
    AccountType.DEEPSEEK,
    AccountType.OPENAI,
    AccountType.ANTHROPIC,
    AccountType.ALIYUN_QWEN
  ],
  [AccountCategory.COMPREHENSIVE_QUOTA]: [
    AccountType.ARK_CODING_PLAN
  ],
  [AccountCategory.SUBSCRIPTION_PLAN]: [],  // 预留
  [AccountCategory.TOKENS_ACCOUNT]: [
    AccountType.CUSTOM
  ]
};

/**
 * 服务商对应的基础类型
 */
export const PROVIDER_CATEGORY_MAP: Record<AccountType, AccountCategory> = {
  [AccountType.DEEPSEEK]: AccountCategory.DIRECT_BALANCE,
  [AccountType.OPENAI]: AccountCategory.DIRECT_BALANCE,
  [AccountType.ANTHROPIC]: AccountCategory.DIRECT_BALANCE,
  [AccountType.ALIYUN_QWEN]: AccountCategory.DIRECT_BALANCE,
  [AccountType.ARK_CODING_PLAN]: AccountCategory.COMPREHENSIVE_QUOTA,
  [AccountType.CUSTOM]: AccountCategory.TOKENS_ACCOUNT
};

// ==================== 辅助函数 ====================

/**
 * 获取基础类型显示名称
 */
export function getCategoryLabel(category: AccountCategory): string {
  const labels: Record<AccountCategory, string> = {
    [AccountCategory.DIRECT_BALANCE]: '直接余额账户',
    [AccountCategory.COMPREHENSIVE_QUOTA]: '综合配额账户',
    [AccountCategory.SUBSCRIPTION_PLAN]: '订阅计划账户',
    [AccountCategory.TOKENS_ACCOUNT]: 'Tokens账户'
  };
  return labels[category] || category;
}

/**
 * 获取基础类型描述
 */
export function getCategoryDescription(category: AccountCategory): string {
  const descriptions: Record<AccountCategory, string> = {
    [AccountCategory.DIRECT_BALANCE]: '监控金钱余额、API调用费用',
    [AccountCategory.COMPREHENSIVE_QUOTA]: '方舟Coding Plan等嵌套配额模式',
    [AccountCategory.SUBSCRIPTION_PLAN]: '包年/包月/包周固定刷新',
    [AccountCategory.TOKENS_ACCOUNT]: '永久Tokens或按量Tokens'
  };
  return descriptions[category] || '';
}

/**
 * 根据服务商类型获取对应的基础类型
 */
export function getCategoryForProvider(type: AccountType): AccountCategory {
  return PROVIDER_CATEGORY_MAP[type] || AccountCategory.DIRECT_BALANCE;
}

/**
 * 根据基础类型获取可选的服务商列表
 */
export function getProvidersForCategory(category: AccountCategory): AccountType[] {
  return CATEGORY_PROVIDER_MAP[category] || [];
}
