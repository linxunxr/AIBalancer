export interface BalanceData {
  id: string;
  platform: string;
  platformIcon: string;
  currentBalance: number;
  currency: string;
  lastUpdate: Date;
  trend: {
    dailyChange: number;
    dailyAverageChange: number;
    weeklyChange: number;
  };
  usage?: {
    todayTokens: number;
    todayCost: number;
    monthlyTokens: number;
  };
}

export interface PlatformAccount {
  id: string;
  platform: string;
  apiKey: string;
  enabled: boolean;
  autoBalanceCheck: boolean;
  minBalanceThreshold: number;
}

export interface ActivityLog {
  id: string;
  type: 'balance' | 'api' | 'warning' | 'system' | 'success';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
}

export class BalanceEntity {
  constructor(
    public id: string,
    public platform: string,
    public currentBalance: number,
    public lastUpdate: Date = new Date(),
  ) {}

  isLowBalance(threshold: number = 50): boolean {
    return this.currentBalance < threshold;
  }

  formatBalance(): string {
    return `¥${this.currentBalance.toFixed(2)}`;
  }

  getDaysUntilEmpty(dailyUsage: number): number {
    if (dailyUsage <= 0) return Infinity;
    return Math.floor(this.currentBalance / dailyUsage);
  }
}
