import type { BalanceData, ActivityLog } from '../entities/Balance';

export class MockDataService {
  static generateBalanceData(): BalanceData[] {
    return [
      {
        id: '1',
        platform: 'DeepSeek',
        platformIcon: '🤖',
        currentBalance: 245.60,
        currency: 'CNY',
        lastUpdate: new Date(Date.now() - 1000 * 60 * 30),
        trend: {
          dailyChange: 12.5,
          dailyAverageChange: 8.3,
          weeklyChange: 58.2,
        },
        usage: {
          todayTokens: 45000,
          todayCost: 4.2,
          monthlyTokens: 1250000,
        },
      },
      {
        id: '2',
        platform: 'OpenAI',
        platformIcon: '🌐',
        currentBalance: 180.30,
        currency: 'USD',
        lastUpdate: new Date(Date.now() - 1000 * 60 * 45),
        trend: {
          dailyChange: -5.2,
          dailyAverageChange: -3.1,
          weeklyChange: -21.8,
        },
        usage: {
          todayTokens: 28000,
          todayCost: 3.5,
          monthlyTokens: 840000,
        },
      },
      {
        id: '3',
        platform: 'Anthropic',
        platformIcon: '🔵',
        currentBalance: 320.80,
        currency: 'USD',
        lastUpdate: new Date(Date.now() - 1000 * 60 * 15),
        trend: {
          dailyChange: 8.7,
          dailyAverageChange: 5.2,
          weeklyChange: 36.5,
        },
        usage: {
          todayTokens: 22000,
          todayCost: 2.8,
          monthlyTokens: 660000,
        },
      },
      {
        id: '4',
        platform: 'Zhipu AI',
        platformIcon: '⭐',
        currentBalance: 156.40,
        currency: 'CNY',
        lastUpdate: new Date(Date.now() - 1000 * 60 * 60),
        trend: {
          dailyChange: 6.3,
          dailyAverageChange: 4.1,
          weeklyChange: 28.7,
        },
        usage: {
          todayTokens: 18000,
          todayCost: 1.8,
          monthlyTokens: 540000,
        },
      },
    ];
  }

  static generateActivityLogs(): ActivityLog[] {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'balance',
        title: '余额更新',
        description: 'DeepSeek余额已更新为 ¥245.60',
        timestamp: new Date(now.getTime() - 1000 * 60 * 30),
        status: '成功',
      },
      {
        id: '2',
        type: 'api',
        title: 'API调用',
        description: 'OpenAI GPT-4 API调用完成',
        timestamp: new Date(now.getTime() - 1000 * 60 * 2),
        status: '完成',
      },
      {
        id: '3',
        type: 'warning',
        title: '余额提醒',
        description: 'Anthropic余额低于阈值 $50.00',
        timestamp: new Date(now.getTime() - 1000 * 60 * 5),
        status: '警告',
      },
      {
        id: '4',
        type: 'system',
        title: '系统更新',
        description: '自动检查更新完成',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24),
        status: '成功',
      },
    ];
  }

  static generateChartData(period: '7d' | '30d' | '3m' = '7d') {
    const points = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data = [];

    for (let i = points; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
        }),
        value: Math.floor(10000 + Math.random() * 8000),
      });
    }

    return data;
  }
}
