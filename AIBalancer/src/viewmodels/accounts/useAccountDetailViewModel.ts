import { BaseViewModel, useViewModel } from '../BaseViewModel';
import { accountService } from '../../models/services/AccountService';
import type {
  Account,
  ConnectionTestResult,
  AccountAlert
} from '../../models/entities/Account';
import {
  AccountStatus,
  getStatusLabel,
  getTypeLabel,
  getStatusTagType
} from '../../models/entities/Account';

// ==================== 类型定义 ====================

/**
 * AccountDetailViewModel状态
 */
export interface AccountDetailState {
  account: Account | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isTestingConnection: boolean;
  connectionTestResult: ConnectionTestResult | null;
  activeTab: string;
}

// ==================== ViewModel ====================

/**
 * 账户详情ViewModel
 * 处理账户详情展示、刷新、API Key管理等逻辑
 */
export class AccountDetailViewModel extends BaseViewModel<AccountDetailState> {
  constructor() {
    super({
      account: null,
      isLoading: false,
      isRefreshing: false,
      isTestingConnection: false,
      connectionTestResult: null,
      activeTab: 'overview'
    });
  }

  // ==================== 公共方法 ====================

  /**
   * 设置当前账户
   * @param account 账户对象
   */
  public setAccount(account: Account | null): void {
    this.state.account = account;
    this.state.connectionTestResult = null;
    this.clearError();
  }

  /**
   * 刷新账户数据
   */
  public async refreshAccount(): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    this.state.isRefreshing = true;

    try {
      const updated = await accountService.getAccountById(this.state.account.id);
      if (updated) {
        this.state.account = updated;
      }
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '刷新失败');
      return null;
    } finally {
      this.state.isRefreshing = false;
    }
  }

  /**
   * 刷新账户余额
   */
  public async refreshBalance(): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    this.state.isRefreshing = true;

    try {
      const updated = await accountService.refreshAccountBalance(this.state.account.id);
      if (updated) {
        this.state.account = updated;
      }
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '刷新余额失败');
      return null;
    } finally {
      this.state.isRefreshing = false;
    }
  }

  /**
   * 测试连接
   */
  public async testConnection(): Promise<ConnectionTestResult | null> {
    if (!this.state.account) {
      return null;
    }

    this.state.isTestingConnection = true;

    try {
      const result = await accountService.testAccountConnection(this.state.account.id);
      this.state.connectionTestResult = result;

      // 刷新账户数据以更新状态
      await this.refreshAccount();

      return result;
    } catch (error) {
      const result: ConnectionTestResult = {
        success: false,
        message: error instanceof Error ? error.message : '连接测试失败'
      };
      this.state.connectionTestResult = result;
      return result;
    } finally {
      this.state.isTestingConnection = false;
    }
  }

  /**
   * 切换账户状态
   */
  public async toggleStatus(): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    try {
      const updated = await accountService.toggleAccount(this.state.account.id);
      if (updated) {
        this.state.account = updated;
      }
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '切换状态失败');
      return null;
    }
  }

  /**
   * 激活账户
   */
  public async activateAccount(): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    try {
      const updated = await accountService.activateAccount(this.state.account.id);
      if (updated) {
        this.state.account = updated;
      }
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '激活失败');
      return null;
    }
  }

  /**
   * 停用账户
   */
  public async deactivateAccount(): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    try {
      const updated = await accountService.deactivateAccount(this.state.account.id);
      if (updated) {
        this.state.account = updated;
      }
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '停用失败');
      return null;
    }
  }

  /**
   * 添加API Key
   * @param apiKey API Key
   * @param expiresAt 过期时间（可选）
   */
  public async addApiKey(apiKey: string, expiresAt?: string): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    try {
      const updated = await accountService.addApiKey(
        this.state.account.id,
        apiKey,
        expiresAt
      );
      this.state.account = updated;
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '添加API Key失败');
      return null;
    }
  }

  /**
   * 删除API Key
   * @param keyId API Key ID
   */
  public async deleteApiKey(keyId: string): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    try {
      const updated = await accountService.deleteApiKey(this.state.account.id, keyId);
      this.state.account = updated;
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '删除API Key失败');
      return null;
    }
  }

  /**
   * 激活API Key
   * @param keyId API Key ID
   */
  public async activateApiKey(keyId: string): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    try {
      const updated = await accountService.activateApiKey(this.state.account.id, keyId);
      this.state.account = updated;
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '激活API Key失败');
      return null;
    }
  }

  /**
   * 停用API Key
   * @param keyId API Key ID
   */
  public async deactivateApiKey(keyId: string): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    try {
      const updated = await accountService.deactivateApiKey(this.state.account.id, keyId);
      this.state.account = updated;
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '停用API Key失败');
      return null;
    }
  }

  /**
   * 轮换API Key
   * @param keyId 旧API Key ID
   * @param newKey 新API Key
   */
  public async rotateApiKey(keyId: string, newKey: string): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    try {
      const updated = await accountService.rotateApiKey(
        this.state.account.id,
        keyId,
        newKey
      );
      this.state.account = updated;
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '轮换API Key失败');
      return null;
    }
  }

  /**
   * 解除告警
   * @param alertId 告警ID
   */
  public async resolveAlert(alertId: string): Promise<Account | null> {
    if (!this.state.account) {
      return null;
    }

    try {
      const updated = await accountService.resolveAlert(
        this.state.account.id,
        alertId
      );
      if (updated) {
        this.state.account = updated;
      }
      return updated;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '解除告警失败');
      return null;
    }
  }

  /**
   * 设置活动标签页
   * @param tab 标签页名称
   */
  public setActiveTab(tab: string): void {
    this.state.activeTab = tab;
  }

  // ==================== 计算属性 ====================

  /**
   * 获取账户
   */
  public get account(): Account | null {
    return this.state.account;
  }

  /**
   * 获取账户ID
   */
  public get accountId(): string | null {
    return this.state.account?.id || null;
  }

  /**
   * 获取账户名称
   */
  public get accountName(): string {
    return this.state.account?.name || '';
  }

  /**
   * 获取账户类型
   */
  public get accountType(): string {
    return this.state.account ? getTypeLabel(this.state.account.type) : '';
  }

  /**
   * 获取账户状态
   */
  public get accountStatus(): string {
    return this.state.account ? getStatusLabel(this.state.account.status) : '';
  }

  /**
   * 获取状态标签类型
   */
  public get statusTagType(): 'success' | 'warning' | 'error' | 'default' {
    return this.state.account ? getStatusTagType(this.state.account.status) : 'default';
  }

  /**
   * 获取当前余额
   */
  public get currentBalance(): number {
    return this.state.account?.currentBalance || 0;
  }

  /**
   * 获取货币
   */
  public get currency(): string {
    return this.state.account?.currency || 'CNY';
  }

  /**
   * 获取格式化的余额
   */
  public get formattedBalance(): string {
    const balance = this.currentBalance;
    const currency = this.currency;
    return currency === 'CNY' ? `¥${balance.toFixed(2)}` : `$${balance.toFixed(2)}`;
  }

  /**
   * 获取使用统计
   */
  public get usage() {
    return this.state.account?.usage || {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalCost: 0,
      lastUsed: '',
      dailyAverage: 0,
      monthlyUsage: []
    };
  }

  /**
   * 获取API Keys
   */
  public get apiKeys() {
    return this.state.account?.apiKeys || [];
  }

  /**
   * 获取告警列表
   */
  public get alerts(): AccountAlert[] {
    return this.state.account?.alerts || [];
  }

  /**
   * 获取未解决的告警
   */
  public get unresolvedAlerts(): AccountAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * 获取是否有未解决的告警
   */
  public get hasUnresolvedAlerts(): boolean {
    return this.unresolvedAlerts.length > 0;
  }

  /**
   * 获取元数据
   */
  public get metadata() {
    return this.state.account?.metadata || {
      organization: null,
      project: null,
      tags: [],
      notes: null,
      customFields: {}
    };
  }

  /**
   * 获取设置
   */
  public get settings() {
    return this.state.account?.settings || {
      autoRefresh: true,
      refreshInterval: 30,
      lowBalanceThreshold: 50,
      enableAlerts: true
    };
  }

  /**
   * 获取是否为活跃状态
   */
  public get isActive(): boolean {
    return this.state.account?.status === AccountStatus.ACTIVE;
  }

  /**
   * 获取是否为错误状态
   */
  public get hasError(): boolean {
    return this.state.account?.status === AccountStatus.ERROR;
  }

  /**
   * 获取连接测试结果
   */
  public get connectionTestResult(): ConnectionTestResult | null {
    return this.state.connectionTestResult;
  }

  /**
   * 获取活动标签页
   */
  public get activeTab(): string {
    return this.state.activeTab;
  }

  /**
   * 获取是否正在刷新
   */
  public get isRefreshing(): boolean {
    return this.state.isRefreshing;
  }

  /**
   * 获取是否正在测试连接
   */
  public get isTestingConnection(): boolean {
    return this.state.isTestingConnection;
  }

  /**
   * 获取创建时间
   */
  public get createdAt(): string {
    return this.state.account?.createdAt || '';
  }

  /**
   * 获取更新时间
   */
  public get updatedAt(): string {
    return this.state.account?.updatedAt || '';
  }

  /**
   * 获取最后同步时间
   */
  public get lastSyncedAt(): string {
    return this.state.account?.lastSyncedAt || '';
  }
}

// ==================== Composition函数 ====================

/**
 * 账户详情ViewModel Composition函数
 */
export function useAccountDetailViewModel() {
  return useViewModel(AccountDetailViewModel);
}
