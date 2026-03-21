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
.account-stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-md);
}

.stat-card {
  text-align: center;
  border-left: 3px solid var(--border-color, #0f3460);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.total {
  border-left-color: var(--primary-color, #e94560);
}

.stat-card.active {
  border-left-color: var(--success-color, #28a745);
}

.stat-card.inactive {
  border-left-color: var(--text-secondary, #6c757d);
}

.stat-card.error {
  border-left-color: var(--error-color, #dc3545);
}

.stat-card.balance {
  border-left-color: var(--warning-color, #ffc107);
}

.stat-card.usage {
  border-left-color: var(--info-color, #17a2b8);
}

.stat-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-icon {
  font-size: 14px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-value.warning {
  color: var(--warning-color, #ffc107);
}

:deep(.n-card__content) {
  padding: 16px;
}

:deep(.n-statistic) {
  --n-value-font-size: 24px;
}

@media (max-width: 768px) {
  .account-stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
