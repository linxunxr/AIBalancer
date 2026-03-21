<template>
  <div class="dimension-card" :class="cardClass">
    <!-- 维度头部 -->
    <div class="dimension-header">
      <div class="dimension-info">
        <span class="dimension-icon">{{ dimensionIcon }}</span>
        <div class="dimension-title">
          <h4 class="dimension-name">{{ dimension.dimensionName }}</h4>
          <span class="dimension-type">{{ dimensionTypeLabel }}</span>
        </div>
      </div>
      <div class="dimension-actions">
        <button class="icon-btn" @click="$emit('refresh', dimension.id)" title="刷新">
          🔄
        </button>
        <button class="icon-btn" @click="$emit('edit', dimension)" title="编辑">
          ✏️
        </button>
        <button class="icon-btn delete" @click="$emit('delete', dimension)" title="删除">
          🗑️
        </button>
      </div>
    </div>

    <!-- 余额显示 -->
    <div class="balance-section">
      <div class="balance-main">
        <span class="balance-value">{{ formatBalance(dimension.currentBalance) }}</span>
        <span class="balance-unit">{{ dimension.unit }}</span>
      </div>
      <div class="balance-detail">
        <span class="total-quota">总配额: {{ formatBalance(dimension.totalQuota) }}</span>
        <span v-if="dimension.reservedBalance > 0" class="reserved">
          预留: {{ formatBalance(dimension.reservedBalance) }}
        </span>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-section">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: usagePercentage + '%' }"
          :class="progressClass"
        ></div>
      </div>
      <div class="progress-labels">
        <span class="used">已用 {{ usagePercentage.toFixed(1) }}%</span>
        <span class="remaining">剩余 {{ (100 - usagePercentage).toFixed(1) }}%</span>
      </div>
    </div>

    <!-- 状态标签 -->
    <div class="status-section">
      <span v-if="dimEntity.isDepleted()" class="status-tag depleted">已耗尽</span>
      <span v-else-if="dimEntity.isCritical()" class="status-tag critical">严重不足</span>
      <span v-else-if="dimEntity.isWarning()" class="status-tag warning">余额较低</span>
      <span v-else class="status-tag healthy">正常</span>

      <span v-if="dimension.timePeriod" class="time-period">
        {{ timePeriodLabel }}
      </span>
    </div>

    <!-- 时间周期信息 -->
    <div v-if="dimension.nextResetAt" class="reset-info">
      <span class="reset-label">下次重置:</span>
      <span class="reset-time">{{ formatResetTime(dimension.nextResetAt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { QuotaDimension, QuotaDimensionEntity, DimensionType, TimePeriod } from '../../../models/entities';

// Props
const props = defineProps<{
  dimension: QuotaDimension;
}>();

// Emits
defineEmits<{
  (e: 'refresh', dimensionId: string): void;
  (e: 'edit', dimension: QuotaDimension): void;
  (e: 'delete', dimension: QuotaDimension): void;
}>();

// Helper to get entity methods
const dimEntity = computed(() => QuotaDimensionEntity.fromJSON(props.dimension));

// Computed
const usagePercentage = computed(() => {
  if (props.dimension.totalQuota <= 0) return 0;
  return ((props.dimension.totalQuota - props.dimension.currentBalance) / props.dimension.totalQuota) * 100;
});

const cardClass = computed(() => ({
  'card-depleted': dimEntity.value.isDepleted(),
  'card-critical': dimEntity.value.isCritical(),
  'card-warning': dimEntity.value.isWarning(),
  'card-nested': props.dimension.nestingLevel > 0
}));

const progressClass = computed(() => {
  const percentage = usagePercentage.value;
  if (percentage >= 100) return 'fill-depleted';
  if (percentage >= 90) return 'fill-critical';
  if (percentage >= 70) return 'fill-warning';
  return 'fill-healthy';
});

const dimensionIcon = computed(() => {
  switch (props.dimension.dimensionType) {
    case DimensionType.TIME_BASED:
      return '⏱️';
    case DimensionType.PERMANENT:
      return '♾️';
    case DimensionType.USAGE_BASED:
      return '📊';
    default:
      return '📦';
  }
});

const dimensionTypeLabel = computed(() => {
  switch (props.dimension.dimensionType) {
    case DimensionType.TIME_BASED:
      return '时间维度';
    case DimensionType.PERMANENT:
      return '永久配额';
    case DimensionType.USAGE_BASED:
      return '使用量维度';
    default:
      return '未知类型';
  }
});

const timePeriodLabel = computed(() => {
  switch (props.dimension.timePeriod) {
    case TimePeriod.FIVE_HOURS:
      return '5小时周期';
    case TimePeriod.WEEKLY:
      return '周周期';
    case TimePeriod.MONTHLY:
      return '月周期';
    case TimePeriod.PERMANENT:
      return '永久';
    default:
      return props.dimension.timePeriod || '';
  }
});

// Methods
function formatBalance(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
}

function formatResetTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();

  if (diff <= 0) return '即将重置';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}天后`;
  }

  if (hours > 0) {
    return `${hours}小时${minutes}分钟后`;
  }

  return `${minutes}分钟后`;
}
</script>

<style scoped>
.dimension-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.dimension-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

/* 卡片状态 */
.dimension-card.card-warning {
  border-color: rgba(250, 173, 20, 0.5);
}

.dimension-card.card-critical {
  border-color: rgba(255, 77, 79, 0.5);
}

.dimension-card.card-depleted {
  border-color: rgba(255, 77, 79, 0.8);
  background: rgba(255, 77, 79, 0.1);
}

.dimension-card.card-nested {
  margin-left: 20px;
  border-left: 3px solid #667eea;
}

/* 维度头部 */
.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.dimension-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dimension-icon {
  font-size: 24px;
}

.dimension-title {
  display: flex;
  flex-direction: column;
}

.dimension-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.dimension-type {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.dimension-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.icon-btn.delete:hover {
  background: rgba(255, 77, 79, 0.3);
}

/* 余额区域 */
.balance-section {
  margin-bottom: 16px;
}

.balance-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.balance-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.balance-unit {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.balance-detail {
  display: flex;
  gap: 16px;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.reserved {
  color: rgba(250, 173, 20, 0.8);
}

/* 进度条 */
.progress-section {
  margin-bottom: 16px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.fill-healthy {
  background: linear-gradient(90deg, #52c41a, #73d13d);
}

.fill-warning {
  background: linear-gradient(90deg, #faad14, #ffc53d);
}

.fill-critical {
  background: linear-gradient(90deg, #ff4d4f, #ff7875);
}

.fill-depleted {
  background: linear-gradient(90deg, #ff4d4f, #f5222d);
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* 状态标签 */
.status-section {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.healthy {
  background: rgba(82, 196, 26, 0.2);
  color: #73d13d;
}

.status-tag.warning {
  background: rgba(250, 173, 20, 0.2);
  color: #ffc53d;
}

.status-tag.critical {
  background: rgba(255, 77, 79, 0.2);
  color: #ff7875;
}

.status-tag.depleted {
  background: rgba(255, 77, 79, 0.3);
  color: #ff4d4f;
}

.time-period {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(102, 126, 234, 0.2);
  color: #85a5ff;
}

/* 重置信息 */
.reset-info {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.reset-label {
  color: rgba(255, 255, 255, 0.4);
}

.reset-time {
  color: #85a5ff;
}
</style>
