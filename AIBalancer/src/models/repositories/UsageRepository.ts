/**
 * Usage Repository
 * 使用记录数据仓库
 */

import { BaseRepository, RepositoryError } from './BaseRepository';
import { UsageRecord, UsageRecordEntity, PlatformType } from '../entities/UsageRecord';
import { invoke } from '@tauri-apps/api/core';

export class UsageRepository extends BaseRepository<UsageRecord, string> {
  protected tableName = 'usage_records';

  protected toEntity(row: any): UsageRecord {
    return UsageRecordEntity.create({
      id: row.id,
      platform: row.platform as PlatformType,
      date: new Date(row.date),
      tokensUsed: row.tokens_used,
      requestsCount: row.requests_count,
      cost: row.cost,
      metadata: JSON.parse(row.metadata || '{}')
    });
  }

  protected fromEntity(entity: UsageRecord): Record<string, any> {
    return {
      id: entity.id,
      platform: entity.platform,
      date: entity.date.toISOString(),
      tokens_used: entity.tokensUsed,
      requests_count: entity.requestsCount,
      cost: entity.cost,
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
      return 1;
    } catch (error) {
      throw new RepositoryError(`SQL command failed: ${sql}`, 'COMMAND_ERROR', error);
    }
  }

  /**
   * 根据平台查找使用记录
   */
  async findByPlatform(platform: PlatformType): Promise<UsageRecord[]> {
    return this.findAll({ platform } as Partial<UsageRecord>);
  }

  /**
   * 根据日期范围查找使用记录
   */
  async findByDateRange(startDate: Date, endDate: Date, platform?: PlatformType): Promise<UsageRecord[]> {
    try {
      const allRecords = await this.findAll();
      return allRecords.filter(record => {
        const recordDate = record.date;
        const isInRange = recordDate >= startDate && recordDate <= endDate;
        const isPlatform = !platform || record.platform === platform;
        return isInRange && isPlatform;
      });
    } catch (error) {
      throw new RepositoryError('Failed to find usage records by date range', 'QUERY_ERROR', error);
    }
  }

  /**
   * 获取今日使用量
   */
  async getTodayUsage(platform?: PlatformType): Promise<UsageRecord | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await this.findByDateRange(today, tomorrow, platform);
    return records.length > 0 ? records[0] : null;
  }

  /**
   * 获取本月使用量
   */
  async getMonthUsage(year: number, month: number, platform?: PlatformType): Promise<UsageRecord[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return this.findByDateRange(startDate, endDate, platform);
  }

  /**
   * 获取总使用量
   */
  async getTotalUsage(platform?: PlatformType): Promise<{
    tokensUsed: number;
    requestsCount: number;
    cost: number;
  }> {
    try {
      const records = await this.findAll(platform ? { platform } as Partial<UsageRecord> : undefined);
      return records.reduce(
        (acc, record) => ({
          tokensUsed: acc.tokensUsed + record.tokensUsed,
          requestsCount: acc.requestsCount + record.requestsCount,
          cost: acc.cost + record.cost
        }),
        { tokensUsed: 0, requestsCount: 0, cost: 0 }
      );
    } catch (error) {
      throw new RepositoryError('Failed to calculate total usage', 'CALCULATE_ERROR', error);
    }
  }

  /**
   * 获取使用趋势
   */
  async getUsageTrend(days: number = 30, platform?: PlatformType): Promise<Array<{
    date: string;
    tokensUsed: number;
    cost: number;
  }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const records = await this.findByDateRange(startDate, endDate, platform);

      // 按日期分组
      const dailyUsage = new Map<string, { tokensUsed: number; cost: number }>();

      records.forEach(record => {
        const dateKey = record.date.toISOString().split('T')[0];
        const existing = dailyUsage.get(dateKey) || { tokensUsed: 0, cost: 0 };
        dailyUsage.set(dateKey, {
          tokensUsed: existing.tokensUsed + record.tokensUsed,
          cost: existing.cost + record.cost
        });
      });

      // 转换为数组并排序
      return Array.from(dailyUsage.entries())
        .map(([date, usage]) => ({ date, ...usage }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      throw new RepositoryError('Failed to get usage trend', 'QUERY_ERROR', error);
    }
  }

  /**
   * 检查是否超过预算
   */
  async isOverBudget(budget: number, platform?: PlatformType): Promise<boolean> {
    try {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const monthUsage = await this.getTotalUsage(platform);

      // 简化处理：使用总成本作为预算依据
      return monthUsage.cost > budget;
    } catch (error) {
      throw new RepositoryError('Failed to check budget', 'QUERY_ERROR', error);
    }
  }
}
