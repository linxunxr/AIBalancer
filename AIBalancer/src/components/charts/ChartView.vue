<template>
  <div class="chart-view">
    <!-- 图表类型切换 -->
    <div class="chart-header">
      <div class="chart-title">{{ title }}</div>
      <div class="chart-controls">
        <n-select
          v-model:value="chartType"
          :options="chartTypeOptions"
          size="small"
          style="width: 120px"
        />
        <n-select
          v-model:value="timeRange"
          :options="timeRangeOptions"
          size="small"
          style="width: 100px"
        />
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container" ref="chartContainer">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <!-- 图例 -->
    <div v-if="showLegend" class="chart-legend">
      <div
        v-for="(item, index) in legendItems"
        :key="index"
        class="legend-item"
        @click="toggleDataset(index)"
      >
        <div
          class="legend-color"
          :class="{ hidden: hiddenDatasets.has(index) }"
          :style="{ backgroundColor: item.color }"
        ></div>
        <span class="legend-label">{{ item.label }}</span>
        <span class="legend-value">{{ item.value }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="chart-loading">
      <n-spin size="large" />
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && isEmpty" class="chart-empty">
      <div class="empty-icon">📊</div>
      <div class="empty-text">暂无数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { NSelect, NSpin } from 'naive-ui';

// Props
interface Props {
  title?: string;
  data?: ChartData[];
  type?: ChartType;
  showLegend?: boolean;
  height?: number;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '使用趋势',
  data: () => [],
  type: 'line',
  showLegend: true,
  height: 300,
  loading: false,
});

// Emits
const emit = defineEmits<{
  pointClick: [data: ChartDataPoint];
  timeRangeChange: [range: TimeRange];
}>();

// Types
type ChartType = 'line' | 'bar' | 'pie' | 'area';
type TimeRange = 'hour' | 'day' | 'week' | 'month';
type TimeUnit = 'hour' | 'day' | 'week' | 'month';

interface ChartData {
  label: string;
  value: number;
  color?: string;
  timestamp?: Date;
}

interface ChartDataPoint {
  label: string;
  value: number;
  index: number;
}

// State
const chartType = ref<ChartType>(props.type);
const timeRange = ref<TimeRange>('day');
const hiddenDatasets = ref<Set<number>>(new Set());
const chartContainer = ref<HTMLDivElement | null>(null);
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: any = null;

// Options
const chartTypeOptions = [
  { label: '折线图', value: 'line' },
  { label: '柱状图', value: 'bar' },
  { label: '饼图', value: 'pie' },
  { label: '面积图', value: 'area' },
];

const timeRangeOptions = [
  { label: '1小时', value: 'hour' },
  { label: '1天', value: 'day' },
  { label: '1周', value: 'week' },
  { label: '1月', value: 'month' },
];

// Computed
const isEmpty = computed(() => !props.data || props.data.length === 0);

const legendItems = computed(() => {
  return props.data.map((item, index) => ({
    label: item.label,
    color: item.color || getColor(index),
    value: formatValue(item.value),
  }));
});

// Methods
const getColor = (index: number): string => {
  const colors = [
    '#1890ff', // blue
    '#52c41a', // green
    '#faad14', // yellow
    '#ff4d4f', // red
    '#722ed1', // purple
    '#13c2c2', // cyan
    '#eb2f96', // pink
    '#fa8c16', // orange
  ];
  return colors[index % colors.length];
};

const formatValue = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const toggleDataset = (index: number) => {
  if (hiddenDatasets.value.has(index)) {
    hiddenDatasets.value.delete(index);
  } else {
    hiddenDatasets.value.add(index);
  }
  renderChart();
};

// 渲染图表（简化版，实际项目中可使用 Chart.js 或 ECharts）
const renderChart = () => {
  if (!chartCanvas.value || !props.data || props.data.length === 0) return;

  const canvas = chartCanvas.value;
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  // 设置画布大小
  const rect = chartContainer.value?.getBoundingClientRect();
  if (rect) {
    canvas.width = rect.width;
    canvas.height = props.height;
  }

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制网格
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  // 横向网格
  const horizontalLines = 5;
  const stepY = canvas.height / horizontalLines;
  for (let i = 0; i <= horizontalLines; i++) {
    const y = i * stepY;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 绘制数据
  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  const maxValue = Math.max(...props.data.map(d => d.value)) || 1;
  const stepX = chartWidth / (props.data.length - 1 || 1);

  if (chartType.value === 'line' || chartType.value === 'area') {
    // 绘制折线图
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = getColor(0);

    props.data.forEach((item, index) => {
      const x = padding + index * stepX;
      const y = canvas.height - padding - (item.value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 面积图填充
    if (chartType.value === 'area') {
      ctx.lineTo(padding + (props.data.length - 1) * stepX, canvas.height - padding);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.closePath();
      ctx.fillStyle = getColor(0) + '33'; // 20% opacity
      ctx.fill();
    }

    // 绘制数据点
    props.data.forEach((item, index) => {
      const x = padding + index * stepX;
      const y = canvas.height - padding - (item.value / maxValue) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = getColor(0);
      ctx.fill();
    });
  } else if (chartType.value === 'bar') {
    // 绘制柱状图
    const barWidth = (chartWidth / props.data.length) * 0.6;
    const barGap = (chartWidth / props.data.length) * 0.4;

    props.data.forEach((item, index) => {
      const x = padding + index * (barWidth + barGap) + barGap / 2;
      const barHeight = (item.value / maxValue) * chartHeight;
      const y = canvas.height - padding - barHeight;

      ctx.fillStyle = getColor(index);
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  } else if (chartType.value === 'pie') {
    // 绘制饼图
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - padding;
    const total = props.data.reduce((sum, item) => sum + item.value, 0);

    let startAngle = -Math.PI / 2;
    props.data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = getColor(index);
      ctx.fill();

      // 绘制标签
      const labelAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const percent = ((item.value / total) * 100).toFixed(1);
      ctx.fillText(`${percent}%`, labelX, labelY);

      startAngle = endAngle;
    });
  }
};

// Watchers
watch(() => props.data, () => {
  nextTick(() => renderChart());
}, { deep: true });

watch(chartType, () => {
  renderChart();
});

watch(timeRange, (newRange) => {
  emit('timeRangeChange', newRange);
});

watch(() => props.height, () => {
  nextTick(() => renderChart());
});

// Lifecycle
onMounted(() => {
  nextTick(() => renderChart());
});

onUnmounted(() => {
  chartInstance = null;
});
</script>

<style scoped>
.chart-view {
  width: 100%;
  position: relative;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.chart-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.chart-controls {
  display: flex;
  gap: var(--space-sm);
}

.chart-container {
  position: relative;
  width: 100%;
  background: var(--bg-secondary);
);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.chart-container canvas {
  display: block;
  width: 100%;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  user-select: none;
}

.legend-item:hover {
  background: var(--bg-tertiary);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  transition: opacity var(--transition-fast);
}

.legend-color.hidden {
  opacity: 0.3;
}

.legend-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.legend-value {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.loading-text {
  margin-top: var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.chart-empty {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.empty-text {
  font-size: var(--text-base);
  color: var(--text-tertiary);
}

/* 深色主题优化 */
:deep(.n-select) {
  --n-border-color: var(--border-medium);
  --n-color: var(--bg-tertiary);
  --n-text-color: var(--text-primary);
}
</style>
