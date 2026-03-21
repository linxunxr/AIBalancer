<template>
  <div class="account-stats-bar">
    <n-card
      v-for="stat in stats"
      :key="stat.key"
      class="stat-card"
      :class="stat.key"
      size="small"
    >
      <n-statistic :tabular-nums="true">
        <template #label>
          <span class="stat-label">
            <span v-if="stat.icon" class="stat-icon">{{ stat.icon }}</span>
            {{ stat.label }}
          </span>
        </template>
        <template #default>
          <span :class="{ 'stat-value': true, 'warning': stat.key === 'balance' }">
            {{ stat.prefix }}{{ formatValue(stat.value, stat.type) }}{{ stat.suffix }}
          </span>
        </template>
      </n-statistic>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NCard, NStatistic } from 'naive-ui';

// Props
interface Props {
  total: number;
  active: number;
  inactive: number;
  error: number;
  totalBalance: number;
  totalUsage: number;
}

const props = defineProps<Props>();

// 统计配置
interface StatItem {
  key: string;
  label: string;
  value: number;
  type: 'number' | 'currency' | 'tokens';
  icon?: string;
  prefix?: string;
  suffix?: string;
}

const stats = computed<StatItem[]>(() => [
  {
    key: 'total',
    label: '总账户',
    value: props.total,
    type: 'number',
    icon: '👤'
  },
  {
    key: 'active',
    label: '活跃',
    value: props.active,
    type: 'number',
    icon: '✓'
  },
  {
    key: 'inactive',
    label: '停用',
    value: props.inactive,
    type: 'number',
    icon: '○'
  },
  {
    key: 'error',
    label: '异常',
    value: props.error,
    type: 'number',
    icon: '!'
  },
  {
    key: 'balance',
    label: '总余额',
    value: props.totalBalance,
    type: 'currency',
    icon: '¥',
    prefix: '¥'
  },
  {
    key: 'usage',
    label: '总使用量',
    value: props.totalUsage,
    type: 'tokens',
    icon: '📊'
  }
]);

// 格式化值
function formatValue(value: number, type: StatItem['type']): string {
  switch (type) {
    case 'currency':
      return value.toFixed(2);
    case 'tokens':
      return formatTokens(value);
    default:
      return value.toString();
  }
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}
</script>

<style scoped>
/* 玻璃拟态统计栏 */
.account-stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-md);
}

/* 玻璃拟态统计卡片 */
.stat-card {
  text-align: center;
  padding: 20px 16px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg, 16px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.02) 100%);
  pointer-events: none;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  transition: all var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.stat-card:hover::after {
  width: 6px;
  box-shadow: var(--glow-primary);
}

/* 各类型统计卡片颜色 */
.stat-card.total::after {
  background: var(--gradient-primary);
}

.stat-card.active::after {
  background: linear-gradient(180deg, #10b981, #059669);
}

.stat-card.inactive::after {
  background: linear-gradient(180deg, #6b7280, #4b5563);
}

.stat-card.error::after {
  background: linear-gradient(180deg, #ef4444, #dc2626);
}

.stat-card.balance::after {
  background: linear-gradient(180deg, #f59e0b, #d97706);
}

.stat-card.usage::after {
  background: linear-gradient(180deg, #3b82f6, #2563eb);
}

.stat-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-icon {
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  font-family: 'SF Mono', 'Monaco', monospace;
  background: linear-gradient(135deg, var(--text-primary), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-value.warning {
  background: linear-gradient(135deg, #ffc107, #ff9800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 覆盖Naive UI组件样式 - 保持玻璃拟态背景 */
:deep(.n-card) {
  background: var(--glass-bg) !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.n-card__content) {
  padding: 0;
}

:deep(.n-statistic) {
  --n-value-font-size: 28px;
  --n-label-font-size: 13px;
}

:deep(.n-number-animation) {
  font-family: 'SF Mono', 'Monaco', monospace;
}

@media (max-width: 768px) {
  .account-stats-bar {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }

  .stat-card {
    padding: 16px 12px;
  }

  .stat-value {
    font-size: 22px;
  }
}
</style>
