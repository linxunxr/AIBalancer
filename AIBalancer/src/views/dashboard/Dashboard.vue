<template>
  <div class="dashboard-view">
    <!-- 顶部概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card total-balance">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <div class="card-label">总余额</div>
          <div class="card-value">¥{{ formatNumber(totalBalance) }}</div>
          <div class="card-trend" :class="trendClass">
            <span>{{ formatPercentage(totalTrend) }}</span>
          </div>
        </div>
      </div>

      <div class="overview-card today-usage">
        <div class="card-icon">⚡</div>
        <div class="card-content">
          <div class="card-label">今日使用</div>
          <div class="card-value">{{ formatTokens(todayUsage) }}</div>
          <div class="card-subtitle">Tokens</div>
        </div>
      </div>

      <div class="overview-card active-platforms">
        <div class="card-icon">🖥</div>
        <div class="card-content">
          <div class="card-label">活跃平台</div>
          <div class="card-value">{{ activePlatforms }}</div>
          <div class="card-subtitle">/{{ totalPlatforms }} 个</div>
        </div>
      </div>

      <div class="overview-card system-status">
        <div class="card-icon">{{ systemOk ? '✓' : '⚠' }}</div>
        <div class="card-content">
          <div class="card-label">系统状态</div>
          <div class="card-value" :class="systemOk ? 'status-ok' : 'status-warning'">
            {{ systemOk ? '正常' : '异常' }}
          </div>
          <div class="card-subtitle">
            {{ systemOk ? '所有服务运行中' : '需要检查' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 余额卡片网格 -->
    <div class="balance-cards-section">
      <div class="section-header">
        <h3 class="section-title">平台余额</h3>
        <div class="section-actions">
          <button class="btn btn-secondary" @click="refreshAllBalances">
            🔄 刷新全部
          </button>
          <button class="btn btn-primary" @click="addAccount">
            + 添加账户
          </button>
        </div>
      </div>

      <div class="balance-cards-grid">
        <div
          v-for="balance in balances"
          :key="balance.id"
          class="balance-card"
          :class="{ 'low-balance': balance.currentBalance < 50 }"
        >
          <div class="balance-header">
            <span class="platform-icon">{{ balance.platformIcon }}</span>
            <span class="platform-name">{{ balance.platform }}</span>
          </div>
          <div class="balance-amount">¥{{ balance.currentBalance.toFixed(2) }}</div>
          <div class="balance-trend" :class="balance.trend.dailyChange >= 0 ? 'positive' : 'negative'">
            <span>{{ balance.trend.dailyChange >= 0 ? '↑' : '↓' }}</span>
            <span>{{ Math.abs(balance.trend.dailyChange).toFixed(1) }}%</span>
          </div>
          <div class="balance-actions">
            <button class="icon-btn" @click="refreshBalance(balance.id)" title="刷新">🔄</button>
            <button class="icon-btn" title="详情">📋</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activity-section">
      <div class="section-header">
        <h3 class="section-title">最近活动</h3>
        <button class="link-btn" @click="viewAllActivities">查看全部</button>
      </div>

      <div class="activity-list">
        <div
          v-for="activity in activities.slice(0, 10)"
          :key="activity.id"
          class="activity-item"
          :class="`type-${activity.type}`"
        >
          <div class="activity-icon">
            <span>{{ getActivityEmoji(activity.type) }}</span>
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-description">{{ activity.description }}</div>
            <div class="activity-meta">
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
              <span v-if="activity.status" class="activity-status" :class="activity.status">
                {{ activity.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="stats-footer">
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-label">平均每日使用</div>
          <div class="stat-value">{{ formatTokens(avgDailyUsage) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">预计剩余天数</div>
          <div class="stat-value">{{ estimatedDays }} 天</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">API成功率</div>
          <div class="stat-value">{{ apiSuccessRate }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">数据更新时间</div>
          <div class="stat-value">{{ lastUpdate }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDashboardViewModel } from '../../viewmodels/dashboard/useDashboardViewModel';

const {
  state,
  isLoading,
  error,
  totalBalance,
  todayUsage,
  activePlatforms,
  totalPlatforms,
  totalTrend,
  systemOk,
  avgDailyUsage,
  estimatedDays,
  apiSuccessRate,
  refresh,
  addActivity,
} = useDashboardViewModel();

const balances = computed(() => state.value.balances);
const activities = computed(() => state.value.activities);

const trendClass = computed(() => {
  if (totalTrend.value > 5) return 'trend-up';
  if (totalTrend.value < -5) return 'trend-down';
  return 'trend-flat';
});

const lastUpdate = computed(() => {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
});

// 方法
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};

const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${Math.floor(diff / 86400000)}天前`;
};

const getActivityEmoji = (type: string): string => {
  const emojis: Record<string, string> = {
    balance: '💰',
    api: '⚡',
    warning: '⚠',
    system: '⚙',
    success: '✓',
  };
  return emojis[type] || '📌';
};

const refreshAllBalances = async () => {
  await refresh();
  addActivity({
    type: 'system',
    title: '余额刷新',
    description: '所有平台余额已刷新',
    timestamp: new Date(),
    status: '成功',
  });
};

const addAccount = () => {
  // TODO: 打开添加账户对话框
  addActivity({
    type: 'system',
    title: '添加账户',
    description: '打开添加账户对话框',
    timestamp: new Date(),
  });
};

const refreshBalance = (id: string) => {
  // TODO: 刷新单个余额
  addActivity({
    type: 'balance',
    title: '余额刷新',
    description: '余额已刷新',
    timestamp: new Date(),
    status: '成功',
  });
};

const viewAllActivities = () => {
  // TODO: 导航到活动历史
};
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-lg);
}

.overview-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.overview-card:hover {
  border-color: var(--border-medium);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.overview-card.total-balance {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
  color: white;
  border: none;
}

.overview-card.total-balance .card-icon {
  background: rgba(255, 255, 255, 0.2);
}

.overview-card.total-balance .card-label,
.overview-card.total-balance .card-value,
.overview-card.total-balance .card-trend {
  color: white;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.card-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.card-subtitle {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.card-trend {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.card-trend.trend-up {
  color: var(--success-500);
}

.card-trend.trend-down {
  color: var(--error-500);
}

.card-trend.trend-flat {
  color: var(--text-tertiary);
}

.status-ok {
  color: var(--success-500);
}

.status-warning {
  color: var(--warning-500);
}

/* 余额卡片区域 */
.balance-cards-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-xl);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.section-actions {
  display: flex;
  gap: var(--space-sm);
}

.btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--primary-500);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-600);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-medium);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-heavy);
}

.link-btn {
  background: transparent;
  border: none;
  color: var(--primary-500);
  cursor: pointer;
  font-size: var(--text-sm);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.link-btn:hover {
  background: rgba(24, 144, 255, 0.1);
  color: var(--primary-600);
}

.balance-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.balance-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-lg);
  transition: all var(--transition-normal);
}

.balance-card:hover {
  border-color: var(--primary-500);
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}

.balance-card.low-balance {
  border-color: rgba(250, 173, 20, 0.5);
  background: rgba(250, 173, 20, 0.05);
}

.balance-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.platform-icon {
  font-size: 24px;
}

.platform-name {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.balance-amount {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.balance-trend {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  margin-bottom: var(--space-md);
}

.balance-trend.positive {
  color: var(--success-500);
}

.balance-trend.negative {
  color: var(--error-500);
}

.balance-actions {
  display: flex;
  gap: var(--space-sm);
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  font-size: 16px;
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background: var(--bg-tertiary);
}

/* 最近活动 */
.recent-activity-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-xl);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.activity-item {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}

.activity-item:hover {
  background: var(--bg-secondary);
  border-color: var(--border-light);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon.type-balance {
  background: rgba(24, 144, 255, 0.1);
  color: var(--primary-500);
}

.activity-icon.type-api {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success-500);
}

.activity-icon.type-warning {
  background: rgba(250, 173, 20, 0.1);
  color: var(--warning-500);
}

.activity-icon.type-system {
  background: rgba(128, 90, 213, 0.1);
  color: #805ad5;
}

.activity-content {
  flex: 1;
  overflow: hidden;
}

.activity-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: 2px;
}

.activity-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-xs);
}

.activity-time {
  color: var(--text-tertiary);
}

.activity-status {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
}

.activity-status.成功 {
  background: rgba(82, 196, 26, 0.15);
  color: var(--success-500);
}

.activity-status.完成 {
  background: rgba(24, 144, 255, 0.15);
  color: var(--primary-500);
}

.activity-status.警告 {
  background: rgba(250, 173, 20, 0.15);
  color: var(--warning-500);
}

/* 底部统计 */
.stats-footer {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-lg) var(--space-xl);
}

.stats-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-xl);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-xs);
}

.stat-value {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .balance-cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }

  .balance-cards-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .section-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .stats-row {
    flex-direction: column;
    gap: var(--space-md);
  }
}
</style>
