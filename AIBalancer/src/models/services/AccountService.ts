import { invoke } from '@tauri-apps/api/core';
import { accountRepository, AccountRepository } from '../repositories/AccountRepository';
import type {
  Account,
  CreateAccountParams,
  UpdateAccountParams,
  AccountFilter,
  AccountsSummary,
  AccountStatus,
  AccountType,
  ConnectionTestResult,
  AccountAlert
} from '../entities/Account';

/**
 * 账户服务
 * 提供账户管理的业务逻辑
 */
export class AccountService {
  private repository: AccountRepository;

  constructor() {
    this.repository = accountRepository;
  }

  // ==================== 基础 CRUD 操作 ====================

  /**
   * 获取所有账户
   */
  async getAllAccounts(): Promise<Account[]> {
    try {
      return await this.repository.findAll();
    } catch (error) {
      console.error('获取账户列表失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取账户
   */
  async getAccountById(id: string): Promise<Account | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      console.error('获取账户详情失败:', error);
      return null;
    }
  }

  /**
   * 获取活跃账户
   */
  async getActiveAccounts(): Promise<Account[]> {
    try {
      return await this.repository.findActive();
    } catch (error) {
      console.error('获取活跃账户失败:', error);
      return [];
    }
  }

  /**
   * 按状态获取账户
   */
  async getAccountsByStatus(status: AccountStatus): Promise<Account[]> {
    try {
      return await this.repository.findByStatus(status);
    } catch (error) {
      console.error(`获取 ${status} 状态账户失败:`, error);
      return [];
    }
  }

  /**
   * 按类型获取账户
   */
  async getAccountsByType(type: AccountType): Promise<Account[]> {
    try {
      return await this.repository.findByType(type);
    } catch (error) {
      console.error(`获取 ${type} 类型账户失败:`, error);
      return [];
    }
  }

  /**
   * 按过滤条件获取账户
   */
  async getAccountsWithFilter(filter: AccountFilter): Promise<Account[]> {
    try {
      return await this.repository.findWithFilter(filter);
    } catch (error) {
      console.error('获取过滤账户失败:', error);
      return [];
    }
  }

  /**
   * 搜索账户
   */
  async searchAccounts(query: string): Promise<Account[]> {
    try {
      return await this.repository.search(query);
    } catch (error) {
      console.error('搜索账户失败:', error);
      return [];
    }
  }

  /**
   * 获取账户统计汇总
   */
  async getAccountsSummary(): Promise<AccountsSummary | null> {
    try {
      return await this.repository.getSummary();
    } catch (error) {
      console.error('获取账户统计失败:', error);
      return null;
    }
  }

  // ==================== 账户创建与更新 ====================

  /**
   * 创建账户
   */
  async createAccount(params: CreateAccountParams): Promise<Account> {
    // 验证必填字段
    if (!params.name || !params.apiKey) {
      throw new Error('账户名称和 API Key 不能为空');
    }

    // 检查名称是否已存在
    const existing = await this.repository.findAll();
    if (existing.some(a => a.name === params.name)) {
      throw new Error('账户名称已存在');
    }

    try {
      const account = await this.repository.create(params);

      // 异步测试连接
      this.testAccountConnection(account.id).catch(err => {
        console.warn(`账户 ${account.name} 连接测试失败:`, err);
      });

      return account;
    } catch (error) {
      console.error('创建账户失败:', error);
      throw error;
    }
  }

  /**
   * 更新账户
   */
  async updateAccount(id: string, params: Omit<UpdateAccountParams, 'id'>): Promise<Account | null> {
    // 检查名称是否与其他账户冲突
    if (params.name) {
      const existing = await this.repository.findAll();
      const conflict = existing.find(a => a.name === params.name && a.id !== id);
      if (conflict) {
        throw new Error('账户名称已存在');
      }
    }

    try {
      return await this.repository.update(id, params);
    } catch (error) {
      console.error('更新账户失败:', error);
      throw error;
    }
  }

  /**
   * 删除账户
   */
  async deleteAccount(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error('删除账户失败:', error);
      return false;
    }
  }

  /**
   * 切换账户启用状态
   */
  async toggleAccount(id: string): Promise<Account | null> {
    try {
      return await this.repository.toggleEnabled(id);
    } catch (error) {
      console.error('切换账户状态失败:', error);
      return null;
    }
  }

  /**
   * 激活账户
   */
  async activateAccount(id: string): Promise<Account | null> {
    return this.updateAccount(id, { status: 'active' as AccountStatus });
  }

  /**
   * 停用账户
   */
  async deactivateAccount(id: string): Promise<Account | null> {
    return this.updateAccount(id, { status: 'inactive' as AccountStatus });
  }

  // ==================== 余额管理 ====================

  /**
   * 刷新账户余额
   */
  async refreshAccountBalance(id: string): Promise<Account | null> {
    const account = await this.repository.findById(id);
    if (!account) {
      throw new Error(`账户 ${id} 不存在`);
    }

    try {
      // 测试连接并获取余额
      const testResult = await this.testApiKey(account.type, account.apiKeys[0]?.key || '');

      if (testResult.success && testResult.balance !== undefined) {
        return await this.repository.updateBalance(id, testResult.balance);
      }

      // 如果测试失败，更新状态为 error
      await this.updateAccount(id, { status: 'error' as AccountStatus });
      return null;
    } catch (error) {
      console.error('刷新账户余额失败:', error);
      throw error;
    }
  }

  /**
   * 批量刷新余额
   */
  async refreshAllBalances(): Promise<Account[]> {
    const accounts = await this.repository.findActive();
    const results: Account[] = [];

    for (const account of accounts) {
      try {
        const updated = await this.refreshAccountBalance(account.id);
        if (updated) {
          results.push(updated);
        }
      } catch (error) {
        console.warn(`刷新账户 ${account.name} 余额失败:`, error);
      }
    }

    return results;
  }

  /**
   * 更新账户余额
   */
  async updateBalance(id: string, balance: number): Promise<Account | null> {
    return await this.repository.updateBalance(id, balance);
  }

  // ==================== API 测试 ====================

  /**
   * 测试账户连接
   */
  async testAccountConnection(id: string): Promise<ConnectionTestResult> {
    try {
      // 调用后端命令，在后端解密 API Key 后测试连接
      const result = await invoke<ConnectionTestResult>('test_account_connection_by_id', {
        accountId: id
      });

      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接测试失败'
      };
    }
  }

  /**
   * 测试 API Key
   */
  private async testApiKey(type: AccountType, apiKey: string): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // 调用 Rust 后端的真实 API 测试
      const result = await invoke<ConnectionTestResult>('api_test_connection', {
        params: {
          provider: type,
          api_key: apiKey
        }
      });

      return {
        success: result.success,
        message: result.message,
        latency: result.latency || Date.now() - startTime,
        balance: result.balance,
        details: result.details
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'API 验证失败',
        latency: Date.now() - startTime
      };
    }
  }

  // ==================== 批量操作 ====================

  /**
   * 批量激活账户
   */
  async batchActivateAccounts(ids: string[]): Promise<number> {
    const results = await this.repository.batchUpdateStatus(ids, 'active' as AccountStatus);
    return results.filter(r => r !== null).length;
  }

  /**
   * 批量停用账户
   */
  async batchDeactivateAccounts(ids: string[]): Promise<number> {
    const results = await this.repository.batchUpdateStatus(ids, 'inactive' as AccountStatus);
    return results.filter(r => r !== null).length;
  }

  /**
   * 批量删除账户
   */
  async batchDeleteAccounts(ids: string[]): Promise<number> {
    const results = await this.repository.batchDelete(ids);
    return results.filter(r => r).length;
  }

  /**
   * 批量刷新余额
   */
  async batchRefreshBalances(ids: string[]): Promise<Account[]> {
    const results: Account[] = [];

    for (const id of ids) {
      try {
        const account = await this.refreshAccountBalance(id);
        if (account) {
          results.push(account);
        }
      } catch (error) {
        console.warn(`刷新账户 ${id} 余额失败:`, error);
      }
    }

    return results;
  }

  // ==================== API 密钥管理 ====================

  /**
   * 添加 API 密钥
   */
  async addApiKey(accountId: string, apiKey: string, expiresAt?: string): Promise<Account> {
    return await this.repository.addApiKey(accountId, apiKey, expiresAt);
  }

  /**
   * 删除 API 密钥
   */
  async deleteApiKey(accountId: string, keyId: string): Promise<Account> {
    return await this.repository.deleteApiKey(accountId, keyId);
  }

  /**
   * 激活 API 密钥
   */
  async activateApiKey(accountId: string, keyId: string): Promise<Account> {
    return await this.repository.setApiKeyActive(accountId, keyId, true);
  }

  /**
   * 停用 API 密钥
   */
  async deactivateApiKey(accountId: string, keyId: string): Promise<Account> {
    return await this.repository.setApiKeyActive(accountId, keyId, false);
  }

  /**
   * 轮换 API 密钥
   */
  async rotateApiKey(accountId: string, oldKeyId: string, newKey: string): Promise<Account> {
    return await this.repository.rotateApiKey(accountId, oldKeyId, newKey);
  }

  // ==================== 告警管理 ====================

  /**
   * 检查账户告警
   */
  async checkAccountAlerts(account: Account): Promise<AccountAlert[]> {
    const alerts: AccountAlert[] = [];

    // 检查低余额
    if (account.settings.enableAlerts && account.currentBalance < account.settings.lowBalanceThreshold) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'low_balance',
        message: `余额低于阈值: ${account.currentBalance.toFixed(2)} < ${account.settings.lowBalanceThreshold}`,
        severity: 'warning',
        triggeredAt: new Date().toISOString(),
        resolved: false
      });
    }

    // 检查使用量限制
    if (account.settings.enableAlerts && account.settings.usageLimit) {
      const usagePercentage = (account.usage.totalTokens / account.settings.usageLimit) * 100;
      if (usagePercentage > 90) {
        alerts.push({
          id: crypto.randomUUID(),
          type: 'high_usage',
          message: `使用量超过90%: ${usagePercentage.toFixed(1)}%`,
          severity: 'warning',
          triggeredAt: new Date().toISOString(),
          resolved: false
        });
      }
    }

    // 检查 API 密钥过期
    const now = Date.now();
    for (const key of account.apiKeys) {
      if (key.expiresAt) {
        const expiresAt = new Date(key.expiresAt).getTime();
        const daysUntilExpiry = (expiresAt - now) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiry < 7 && key.isActive) {
          alerts.push({
            id: crypto.randomUUID(),
            type: 'key_expired',
            message: `API 密钥将在 ${Math.ceil(daysUntilExpiry)} 天后过期`,
            severity: 'warning',
            triggeredAt: new Date().toISOString(),
            resolved: false
          });
        }
      }
    }

    return alerts;
  }

  /**
   * 获取有告警的账户
   */
  async getAccountsWithAlerts(): Promise<Account[]> {
    const accounts = await this.repository.findAll();
    return accounts.filter(a => a.alerts.length > 0);
  }

  /**
   * 解除告警
   */
  async resolveAlert(accountId: string, alertId: string): Promise<Account | null> {
    const account = await this.repository.findById(accountId);
    if (!account) {
      throw new Error(`账户 ${accountId} 不存在`);
    }

    const updatedAlerts = account.alerts.map(alert => {
      if (alert.id === alertId) {
        return {
          ...alert,
          resolved: true,
          resolvedAt: new Date().toISOString()
        };
      }
      return alert;
    });

    return await this.repository.update(accountId, {
      alerts: updatedAlerts as any
    });
  }

  // ==================== 使用统计 ====================

  /**
   * 记录使用量
   */
  async recordUsage(accountId: string, tokens: number, cost: number): Promise<Account | null> {
    const account = await this.repository.findById(accountId);
    if (!account) {
      throw new Error(`账户 ${accountId} 不存在`);
    }

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const updatedUsage = {
      ...account.usage,
      totalTokens: account.usage.totalTokens + tokens,
      totalCost: account.usage.totalCost + cost,
      lastUsed: now.toISOString()
    };

    // 更新月使用量
    const monthUsage = updatedUsage.monthlyUsage.find(m => m.month === currentMonth);
    if (monthUsage) {
      monthUsage.tokens += tokens;
      monthUsage.cost += cost;
    } else {
      updatedUsage.monthlyUsage.push({
        month: currentMonth,
        tokens,
        cost
      });
    }

    return await this.repository.update(accountId, {
      usage: updatedUsage as any
    });
  }

  // ==================== 导出功能 ====================

  /**
   * 导出账户数据
   */
  async exportAccounts(ids?: string[], format: 'json' | 'csv' = 'json'): Promise<string> {
    return await this.repository.exportAccounts(ids, format);
  }

  /**
   * 下载导出文件
   */
  downloadExport(data: string, filename: string, format: 'json' | 'csv'): void {
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// 导出单例
export const accountService = new AccountService();
