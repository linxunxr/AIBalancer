import { invoke } from '@tauri-apps/api/core';
import type {
  Account,
  CreateAccountParams,
  UpdateAccountParams,
  AccountFilter,
  AccountsSummary,
  AccountStatus,
  AccountType
} from '../entities/Account';

/**
 * 账户数据仓库
 * 直接调用 Tauri 命令进行数据操作
 */
export class AccountRepository {
  /**
   * 获取所有账户
   */
  async findAll(): Promise<Account[]> {
    return await invoke<Account[]>('get_all_accounts');
  }

  /**
   * 获取指定状态的账户
   */
  async findByStatus(status: AccountStatus): Promise<Account[]> {
    return await invoke<Account[]>('get_accounts_by_status', { status });
  }

  /**
   * 获取指定类型的账户
   */
  async findByType(type: AccountType): Promise<Account[]> {
    return await invoke<Account[]>('get_accounts_by_type', { accountType: type });
  }

  /**
   * 根据ID获取账户
   */
  async findById(id: string): Promise<Account | null> {
    const accounts = await this.findAll();
    return accounts.find(a => a.id === id) || null;
  }

  /**
   * 创建账户
   */
  async create(params: CreateAccountParams): Promise<Account> {
    return await invoke<Account>('create_account', { params });
  }

  /**
   * 更新账户
   */
  async update(id: string, params: Omit<UpdateAccountParams, 'id'>): Promise<Account | null> {
    const result = await invoke<Account | null>('update_account', {
      params: { id, ...params }
    });
    return result;
  }

  /**
   * 删除账户
   */
  async delete(id: string): Promise<boolean> {
    return await invoke<boolean>('delete_account', { id });
  }

  /**
   * 切换账户启用状态
   */
  async toggleEnabled(id: string): Promise<Account | null> {
    const result = await invoke<Account | null>('toggle_account', { id });
    return result;
  }

  /**
   * 更新账户余额
   */
  async updateBalance(id: string, balance: number): Promise<Account | null> {
    const result = await invoke<Account | null>('update_account_balance', { id, balance });
    return result;
  }

  /**
   * 搜索账户
   */
  async search(query: string): Promise<Account[]> {
    return await invoke<Account[]>('search_accounts', { query });
  }

  /**
   * 获取账户统计汇总
   */
  async getSummary(): Promise<AccountsSummary> {
    return await invoke<AccountsSummary>('get_accounts_summary');
  }

  /**
   * 应用过滤条件查询
   */
  async findWithFilter(filter: AccountFilter): Promise<Account[]> {
    let accounts = await this.findAll();

    // 按类型过滤
    if (filter.types && filter.types.length > 0) {
      accounts = accounts.filter(a => filter.types!.includes(a.type));
    }

    // 按状态过滤
    if (filter.statuses && filter.statuses.length > 0) {
      accounts = accounts.filter(a => filter.statuses!.includes(a.status));
    }

    // 按标签过滤
    if (filter.tags && filter.tags.length > 0) {
      accounts = accounts.filter(a =>
        filter.tags!.every(tag => a.metadata.tags.includes(tag))
      );
    }

    // 搜索过滤
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      accounts = accounts.filter(a =>
        a.name.toLowerCase().includes(searchLower) ||
        a.metadata.notes?.toLowerCase().includes(searchLower) ||
        a.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 余额范围过滤
    if (filter.minBalance !== undefined) {
      accounts = accounts.filter(a => a.currentBalance >= filter.minBalance!);
    }
    if (filter.maxBalance !== undefined) {
      accounts = accounts.filter(a => a.currentBalance <= filter.maxBalance!);
    }

    // 告警过滤
    if (filter.hasAlerts !== undefined) {
      accounts = accounts.filter(a =>
        filter.hasAlerts ? a.alerts.length > 0 : a.alerts.length === 0
      );
    }

    // 分页
    if (filter.offset !== undefined || filter.limit !== undefined) {
      const offset = filter.offset || 0;
      const limit = filter.limit || accounts.length;
      accounts = accounts.slice(offset, offset + limit);
    }

    return accounts;
  }

  /**
   * 获取活跃账户
   */
  async findActive(): Promise<Account[]> {
    return this.findByStatus('active' as AccountStatus);
  }

  /**
   * 批量更新状态
   */
  async batchUpdateStatus(ids: string[], status: AccountStatus): Promise<(Account | null)[]> {
    const results: (Account | null)[] = [];
    for (const id of ids) {
      const result = await this.update(id, { status });
      results.push(result);
    }
    return results;
  }

  /**
   * 批量删除
   */
  async batchDelete(ids: string[]): Promise<boolean[]> {
    const results: boolean[] = [];
    for (const id of ids) {
      const result = await this.delete(id);
      results.push(result);
    }
    return results;
  }

  /**
   * 批量刷新余额
   */
  async batchUpdateBalance(updates: Array<{ id: string; balance: number }>): Promise<(Account | null)[]> {
    const results: (Account | null)[] = [];
    for (const { id, balance } of updates) {
      const result = await this.updateBalance(id, balance);
      results.push(result);
    }
    return results;
  }

  // ==================== API Key 管理 ====================

  /**
   * 添加 API Key
   */
  async addApiKey(accountId: string, apiKey: string, expiresAt?: string): Promise<Account> {
    return await invoke<Account>('add_api_key', {
      params: { account_id: accountId, api_key: apiKey, expires_at: expiresAt }
    });
  }

  /**
   * 删除 API Key
   */
  async deleteApiKey(accountId: string, keyId: string): Promise<Account> {
    return await invoke<Account>('delete_api_key', { accountId, keyId });
  }

  /**
   * 设置 API Key 活跃状态
   */
  async setApiKeyActive(accountId: string, keyId: string, isActive: boolean): Promise<Account> {
    return await invoke<Account>('set_api_key_active', { accountId, keyId, isActive });
  }

  /**
   * 轮换 API Key
   */
  async rotateApiKey(accountId: string, keyId: string, newKey: string): Promise<Account> {
    return await invoke<Account>('rotate_api_key', {
      params: { account_id: accountId, key_id: keyId, new_key: newKey }
    });
  }

  // ==================== 数据导出 ====================

  /**
   * 导出账户数据
   */
  async exportAccounts(ids?: string[], format: 'json' | 'csv' = 'json'): Promise<string> {
    return await invoke<string>('export_accounts', { ids, format });
  }
}

// 导出单例
export const accountRepository = new AccountRepository();
