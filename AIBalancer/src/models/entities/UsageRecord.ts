/**
 * Usage Record Entity
 * 记录API使用量信息
 */

export interface UsageRecord {
  id: string;
  platform: PlatformType;
  date: Date;
  tokensUsed: number;
  requestsCount: number;
  cost: number;
  metadata: Record<string, any>;
}

import { PlatformType } from './PlatformType';

/**
 * Usage Record Entity Class
 */
export class UsageRecordEntity implements UsageRecord {
  constructor(
    public id: string,
    public platform: PlatformType,
    public date: Date,
    public tokensUsed: number,
    public requestsCount: number,
    public cost: number,
    public metadata: Record<string, any> = {}
  ) {}

  static create(params: Partial<UsageRecord>): UsageRecordEntity {
    return new UsageRecordEntity(
      params.id || crypto.randomUUID(),
      params.platform || PlatformType.DEEPSEEK,
      params.date || new Date(),
      params.tokensUsed || 0,
      params.requestsCount || 0,
      params.cost || 0,
      params.metadata || {}
    );
  }

  /**
   * 获取每千token的成本
   */
  getCostPerThousandTokens(): number {
    if (this.tokensUsed === 0) return 0;
    return (this.cost / this.tokensUsed) * 1000;
  }

  /**
   * 获取平均每次请求的token数
   */
  getAverageTokensPerRequest(): number {
    if (this.requestsCount === 0) return 0;
    return this.tokensUsed / this.requestsCount;
  }

  /**
   * 判断是否为高使用量
   */
  isHighUsage(threshold: number = 10000): boolean {
    return this.tokensUsed > threshold;
  }
}
