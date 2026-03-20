/**
 * Balance Repository
 * 余额数据仓库
 */

import { BaseRepository, IRepository, RepositoryError, QueryResult } from './BaseRepository';
import { Balance, BalanceEntity, BalanceHistory, PlatformType, Currency, BalanceChangeReason } from '../entities/Balance';
import { invoke } from '@tauri-apps/api/core';

export class BalanceRepository extends BaseRepository<Balance, string> {
  protected tableName = 'balances';

  protected toEntity(row: any): Balance {
    return BalanceEntity.create({
      id: row.id,
      platform: row.platform as PlatformType,
      currentBalance: row.current_balance,
      currency: row.currency as Currency,
      lastUpdated: new Date(row.last_updated),
      history: JSON.parse(row.history || '[]'),
      metadata: JSON.parse(row.metadata || '{}')
    });
  }

  protected fromEntity(entity: Balance): Record<string, any> {
    return {
      id: entity.id,
      platform: entity.platform,
      current_balance: entity.currentBalance,
      currency: entity.currency,
      last_updated: entity.lastUpdated.toISOString(),
      history: JSON.stringify(entity.history),
      metadata: JSON.stringify(entity.metadata)
    };
  }

  protected async executeQuery(sql: string, params?: any[]): Promise<any[]> {
    try {
      return await invoke<any[]>('execute_sql', { sql, params });
    } catch (error) {
      throw new RepositoryError(`SQL execution failed: ${sql}`, 'QUERY_ERROR', error);
    }
  }

  protected async executeCommand(sql: string, params?: any[]): Promise<number> {
    try {
      await invoke('execute_sql', { sql, params });
      // 返回影响的行数（简化处理）
      return 1;
    } catch (error) {
      throw new RepositoryError(`SQL command failed: ${sql}`, 'COMMAND_ERROR', error);
    }
  }

  /**
   * 根据平台查找余额
   */
  async findByPlatform(platform: PlatformType): Promise<Balance | null> {
    return this.findOne({ platform } as Partial<Balance>);
  }

  /**
   * 获取所有平台余额
   */
  async findAllPlatforms(): Promise<Balance[]> {
    return this.findAll();
  }

  /**
   * 更新余额
   */
  async updateBalance(id: string, newBalance: number, reason: BalanceChangeReason): Promise<Balance> {
    const balance = await this.findById(id);
    if (!balance) {
      throw new RepositoryError(`Balance not found: ${id}`, 'NOT_FOUND');
    }

    const change = newBalance - balance.currentBalance;

    const historyEntry: Omit<BalanceHistory, 'id' | 'balanceId'> = {
      timestamp: new Date(),
      balance: newBalance,
      change,
      reason,
      metadata: {}
    };

    const updatedBalance = BalanceEntity.create({
      ...balance,
      currentBalance: newBalance,
      lastUpdated: new Date(),
      history: [historyEntry, ...balance.history]
    });

    return await this.update(id, updatedBalance);
  }

  /**
   * 获取余额历史
   */
  async getBalanceHistory(id: string, days: number = 7): Promise<BalanceHistory[]> {
    try {
      const balance = await this.findById(id);
      if (!balance) {
        throw new RepositoryError(`Balance not found: ${id}`, 'NOT_FOUND');
      }

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return balance.history.filter(h => new Date(h.timestamp) >= cutoffDate);
    } catch (error) {
      throw new RepositoryError(`Failed to get balance history for ${id}`, 'GET_HISTORY_ERROR', error);
    }
  }

  /**
   * 计算总余额
   */
  async getTotalBalance(currency?: Currency): Promise<number> {
    try {
      const balances = await this.findAll();
      return balances
        .filter(b => !currency || b.balancer === currency)
        .reduce((sum, b) => sum + b.currentBalance, 0);
    } catch (error) {
      throw new RepositoryError('Failed to calculate total balance', 'CALCULATE_ERROR', error);
    }
  }

  /**
   * 获取低余额记录
   */
  async findLowBalances(threshold: number): Promise<Balance[]> {
    try {
      const balances = await this.findAll();
      return balances.filter(b => b.currentBalance < threshold);
    } catch (error) {
      throw new RepositoryError('Failed to find low balances', 'QUERY_ERROR', error);
    }
  }
}
