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

    <!-- 添加账户表单模态框 -->
    <AccountFormModal
      v-model:show="showFormModal"
      :editing-account="editingAccount"
      :existing-tags="allTags"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMessage } from 'naive-ui';
import { useDashboardViewModel } from '../../viewmodels/dashboard/useDashboardViewModel';
import { useAccountManagementViewModel } from '../../viewmodels/accounts/useAccountManagementViewModel';
import AccountFormModal from '../accounts/components/AccountFormModal.vue';
import type { CreateAccountParams, UpdateAccountParams } from '../../models/entities/Account';

const message = useMessage();

const {
  state,
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

// 账户管理 ViewModel（用于添加账户功能）
const {
  createAccount,
  allTags
} = useAccountManagementViewModel();

// 表单状态
const showFormModal = ref(false);
const editingAccount = ref(null);

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
  editingAccount.value = null;
  showFormModal.value = true;
  addActivity({
    type: 'system',
    title: '添加账户',
    description: '打开添加账户对话框',
    timestamp: new Date(),
  });
};

const handleFormSubmit = async (data: CreateAccountParams | UpdateAccountParams) => {
  try {
    const result = await createAccount(data as CreateAccountParams);
    if (result) {
      message.success('账户创建成功');
      showFormModal.value = false;
      editingAccount.value = null;
      // 刷新仪表盘数据
      await refresh();
      addActivity({
        type: 'success',
        title: '账户添加成功',
        description: `已添加账户: ${data.name}`,
        timestamp: new Date(),
        status: '成功',
      });
    }
  } catch (error) {
    console.error('添加账户失败:', error);
    message.error('添加账户失败');
  }
};

const refreshBalance = (_id: string) => {
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
/* 玻璃拟态仪表盘视图 */
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* 玻璃概览卡片网格 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-lg);
}

/* 玻璃概览卡片 */
.overview-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-glass);
  position: relative;
  overflow: hidden;
}

/* 卡片内发光效果 */
.overview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.overview-card:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-glass-hover);
  transform: translateY(-4px);
}

/* 总余额卡片 - 渐变背景 */
.overview-card.total-balance {
  background: var(--gradient-primary);
  border: none;
  color: white;
  box-shadow: var(--shadow-glass), var(--glow-primary);
}

.overview-card.total-balance::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
}

.overview-card.total-balance:hover {
  box-shadow: var(--shadow-glass-hover), var(--glow-primary);
}

.overview-card.total-balance .card-icon {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.overview-card.total-balance .card-label {
  color: rgba(255, 255, 255, 0.85);
}

.overview-card.total-balance .card-value {
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.overview-card.total-balance .card-trend {
  color: rgba(255, 255, 255, 0.9);
}

/* 图标容器 */
.card-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
  border: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: var(--shadow-glass);
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
  font-weight: var(--font-medium);
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
  color: #52c41a;
  text-shadow: 0 0 10px rgba(82, 196, 26, 0.3);
}

.card-trend.trend-down {
  color: #ff4d4f;
  text-shadow: 0 0 10px rgba(255, 77, 79, 0.3);
}

.card-trend.trend-flat {
  color: var(--text-tertiary);
}

.status-ok {
  color: #52c41a;
  text-shadow: 0 0 10px rgba(82, 196, 26, 0.3);
}

.status-warning {
  color: #faad14;
  text-shadow: 0 0 10px rgba(250, 173, 20, 0.3);
}

/* 玻璃余额卡片区域 */
.balance-cards-section {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-glass);
  position: relative;
}

.balance-cards-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
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
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-actions {
  display: flex;
  gap: var(--space-sm);
}

/* 玻璃按钮样式 */
.btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: var(--shadow-glass);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover {
  box-shadow: var(--shadow-glass-hover), var(--glow-primary);
  transform: translateY(-2px);
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-glass-active);
}

.btn-secondary {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
}

.btn-secondary:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-glass-hover);
}

.link-btn {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--primary-start);
  cursor: pointer;
  font-size: var(--text-sm);
  padding: 8px 16px;
  border-radius: 20px;
  transition: all var(--transition-fast);
}

.link-btn:hover {
  background: var(--gradient-primary);
  border-color: transparent;
  color: white;
  box-shadow: var(--glow-primary);
}

/* 玻璃余额卡片网格 */
.balance-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.balance-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-glass);
  position: relative;
  overflow: hidden;
}

.balance-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
  opacity: 0.5;
}

.balance-card:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-glass-hover);
  transform: translateY(-4px);
}

.balance-card:hover::before {
  opacity: 1;
}

.balance-card.low-balance {
  border-color: rgba(250, 173, 20, 0.4);
  box-shadow: var(--shadow-glass), 0 0 20px rgba(250, 173, 20, 0.15);
}

.balance-card.low-balance::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(250, 173, 20, 0.05), transparent);
  pointer-events: none;
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
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.balance-amount {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.balance-trend {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  margin-bottom: var(--space-md);
}

.balance-trend.positive {
  color: #52c41a;
}

.balance-trend.negative {
  color: #ff4d4f;
}

.balance-actions {
  display: flex;
  gap: var(--space-sm);
}

.icon-btn {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
  border: 1px solid var(--glass-border);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  font-size: 16px;
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-glass-hover);
}

/* 玻璃最近活动区域 */
.recent-activity-section {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-glass);
  position: relative;
}

.recent-activity-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
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
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  background: transparent;
  transition: all var(--transition-fast);
}

.activity-item:hover {
  background: var(--glass-bg);
  border-color: var(--glass-border);
}

.activity-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
}

.activity-icon.type-balance {
  background: var(--gradient-primary);
  border-color: transparent;
  color: white;
  box-shadow: var(--glow-primary);
}

.activity-icon.type-api {
  background: var(--gradient-success);
  border-color: transparent;
  color: white;
}

.activity-icon.type-warning {
  background: var(--gradient-warning);
  border-color: transparent;
  color: white;
}

.activity-icon.type-system {
  background: linear-gradient(135deg, #805ad5, #9f7aea);
  border-color: transparent;
  color: white;
}

.activity-content {
  flex: 1;
  overflow: hidden;
}

.activity-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
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
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: var(--font-medium);
  font-size: var(--text-xs);
}

.activity-status.成功 {
  background: rgba(82, 196, 26, 0.15);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.3);
}

.activity-status.完成 {
  background: rgba(94, 114, 235, 0.15);
  color: var(--primary-start);
  border: 1px solid rgba(94, 114, 235, 0.3);
}

.activity-status.警告 {
  background: rgba(250, 173, 20, 0.15);
  color: #faad14;
  border: 1px solid rgba(250, 173, 20, 0.3);
}

/* 玻璃底部统计区域 */
.stats-footer {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-glass);
  position: relative;
}

.stats-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.stats-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-xl);
}

.stat-item {
  text-align: center;
  flex: 1;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  transition: all var(--transition-fast);
}

.stat-item:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
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
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
