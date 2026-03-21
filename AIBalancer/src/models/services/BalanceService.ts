/**
 * Balance Service
 * 余额管理业务逻辑
 */

import { BalanceRepository } from '../repositories/BalanceRepository';
import { Balance, BalanceEntity, Currency, BalanceChangeReason } from '../entities/Balance';
import { PlatformType } from '../entities/PlatformType';
import { AppError, ErrorCode } from '../../core/errors';

export interface BalanceTrend {
  platform: PlatformType;
  currentBalance: number;
  dailyAverageChange: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  history: Array<{
    date: string;
    balance: number;
    change: number;
  }>;
}

export class BalanceService {
  private balanceRepository: BalanceRepository;

  constructor(balanceRepository?: BalanceRepository) {
    this.balanceRepository = balanceRepository || new BalanceRepository();
  }

  /**
   * 获取当前余额
   */
  async getCurrentBalance(platform: PlatformType, currency: Currency = Currency.CNY): Promise<Balance> {
    try {
      const balance = await this.balanceRepository.findByPlatform(platform);

      if (balance) {
        return balance;
      }

      // 创建新的余额记录
      const newBalance = BalanceEntity.create({
        platform,
        currentBalance: 0,
        currency,
        lastUpdated: new Date()
      });

      return await this.balanceRepository.create(newBalance as Omit<Balance, 'id'>);
    } catch (error) {
      throw new AppError('获取余额失败', ErrorCode.STORAGE_ERROR, { platform }, error as Error);
    }
  }

  /**
   * 设置余额
   */
  async setBalance(platform: PlatformType, balance: number, currency: Currency = Currency.CNY): Promise<Balance> {
    try {
      const current = await this.getCurrentBalance(platform, currency);

      if (current.currentBalance === balance) {
        return current;
      }

      const reason = balance < current.currentBalance
        ? BalanceChangeReason.USAGE
        : BalanceChangeReason.RECHARGE;

      return await this.balanceRepository.updateBalance(current.id, balance, reason);
    } catch (error) {
      throw new AppError('设置余额失败', ErrorCode.STORAGE_ERROR, { platform, balance }, error as Error);
    }
  }

  /**
   * 调整余额
   */
  async adjustBalance(platform: PlatformType, delta: number, reason: BalanceChangeReason = BalanceChangeReason.ADJUSTMENT): Promise<Balance> {
    try {
      const current = await this.getCurrentBalance(platform);
      const newBalance = current.currentBalance + delta;

      if (newBalance < 0) {
        throw new AppError('余额不能为负数', ErrorCode.VALIDATION_ERROR, { platform, delta });
      }

      return await this.balanceRepository.updateBalance(current.id, newBalance, reason);
    } catch (error) {
      throw new AppError('调整余额失败', ErrorCode.STORAGE_ERROR, { platform, delta }, error as Error);
    }
  }

  /**
   * 获取余额趋势
   */
  async getBalanceTrend(platform: PlatformType, days: number = 7): Promise<BalanceTrend> {
    try {
      const balance = await this.getCurrentBalance(platform);
      const history = await this.balanceRepository.getBalanceHistory(balance.id, days);

      if (history.length < 2) {
        return {
          platform,
          currentBalance: balance.currentBalance,
          dailyAverageChange: 0,
          trend: 'stable',
          history: []
        };
      }

      const totalChange = history.reduce((sum, entry) => sum + entry.change, 0);
      const dailyAverageChange = totalChange / days;

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (dailyAverageChange > 10) {
        trend = 'increasing';
      } else if (dailyAverageChange < -10) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      const formattedHistory = history.map(entry => ({
        date: new Date(entry.timestamp).toISOString().split('T')[0],
        balance: entry.balance,
        change: entry.change
      }));

      return {
        platform,
        currentBalance: balance.currentBalance,
        dailyAverageChange,
        trend,
        history: formattedHistory
      };
    } catch (error) {
      throw new AppError('获取余额趋势失败', ErrorCode.STORAGE_ERROR, { platform, days }, error as Error);
    }
  }

  /**
   * 估算剩余天数
   */
  async estimateRemainingDays(platform: PlatformType, dailyUsage?: number): Promise<number> {
    try {
      const balance = await this.getCurrentBalance(platform);

      if (dailyUsage !== undefined && dailyUsage > 0) {
        return Math.floor(balance.currentBalance / dailyUsage);
      }

      // 基于历史数据估算
      const trend = await this.getBalanceTrend(platform, 30);
      const avgDailyChange = Math.abs(trend.dailyAverageChange);

      if (avgDailyChange === 0) {
        return Infinity;
      }

      return Math.floor(balance.currentBalance / avgDailyChange);
    } catch (error) {
      throw new AppError('估算剩余天数失败', ErrorCode.STORAGE_ERROR, { platform }, error as Error);
    }
  }

  /**
   * 获取总余额
   */
  async getTotalBalance(currency?: Currency): Promise<number> {
    try {
      return await this.balanceRepository.getTotalBalance(currency);
    } catch (error) {
      throw new AppError('获取总余额失败', ErrorCode.STORAGE_ERROR, { currency }, error as Error);
    }
  }

  /**
   * 获取所有平台余额
   */
  async getAllBalances(): Promise<Balance[]> {
    try {
      return await this.balanceRepository.findAllPlatforms();
    } catch (error) {
      throw new AppError('获取所有余额失败', ErrorCode.STORAGE_ERROR, undefined, error as Error);
    }
  }

  /**
   * 检查余额是否低于阈值
   */
  async checkLowBalance(platform: PlatformType, threshold: number): Promise<boolean> {
    try {
      const balance = await this.getCurrentBalance(platform);
      return balance.currentBalance < threshold;
    } catch (error) {
      throw new AppError('检查低余额失败', ErrorCode.STORAGE_ERROR, { platform, threshold }, error as Error);
    }
  }

  /**
   * 获取低余额列表
   */
  async getLowBalances(threshold: number): Promise<Balance[]> {
    try {
      return await this.balanceRepository.findLowBalances(threshold);
    } catch (error) {
      throw new AppError('获取低余额列表失败', ErrorCode.STORAGE_ERROR, { threshold }, error as Error);
    }
  }
}
