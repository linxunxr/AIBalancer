<template>
  <div class="dimension-tree">
    <div v-for="dimension in dimensions" :key="dimension.id" class="tree-node">
      <!-- 节点内容 -->
      <div class="node-content" :class="nodeClass(dimension)">
        <span class="node-icon">{{ getNodeIcon(dimension) }}</span>
        <div class="node-info">
          <span class="node-name">{{ dimension.dimensionName }}</span>
          <span class="node-balance">{{ formatBalance(dimension.currentBalance) }} {{ dimension.unit }}</span>
        </div>
        <div class="node-status">
          <span v-if="getStatus(dimension) === 'depleted'" class="status-dot depleted"></span>
          <span v-else-if="getStatus(dimension) === 'critical'" class="status-dot critical"></span>
          <span v-else-if="getStatus(dimension) === 'warning'" class="status-dot warning"></span>
          <span v-else class="status-dot healthy"></span>
        </div>
      </div>

      <!-- 子节点 -->
      <div v-if="getChildren(dimension.id).length > 0" class="tree-children">
        <DimensionTree
          :dimensions="getChildren(dimension.id)"
          :all-dimensions="allDimensions"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QuotaDimension, QuotaDimensionEntity, DimensionType } from '../../../models/entities';

// Props
const props = defineProps<{
  dimensions: QuotaDimension[];
  allDimensions: QuotaDimension[];
}>();

// Methods
function getChildren(parentId: string): QuotaDimension[] {
  return props.allDimensions.filter((d) => d.parentDimensionId === parentId);
}

function getNodeIcon(dimension: QuotaDimension): string {
  switch (dimension.dimensionType) {
    case DimensionType.TIME_BASED:
      return '⏱️';
    case DimensionType.PERMANENT:
      return '♾️';
    case DimensionType.USAGE_BASED:
      return '📊';
    default:
      return '📦';
  }
}

function nodeClass(dimension: QuotaDimension): Record<string, boolean> {
  const entity = QuotaDimensionEntity.fromJSON(dimension);
  return {
    'node-depleted': entity.isDepleted(),
    'node-critical': entity.isCritical(),
    'node-warning': entity.isWarning(),
  };
}

function getStatus(dimension: QuotaDimension): 'depleted' | 'critical' | 'warning' | 'healthy' {
  const entity = QuotaDimensionEntity.fromJSON(dimension);
  if (entity.isDepleted()) return 'depleted';
  if (entity.isCritical()) return 'critical';
  if (entity.isWarning()) return 'warning';
  return 'healthy';
}

function formatBalance(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
}
</script>

<style scoped>
.dimension-tree {
  padding-left: 0;
}

.tree-node {
  margin-bottom: 8px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.node-content:hover {
  background: rgba(255, 255, 255, 0.08);
}

.node-content.node-warning {
  border-color: rgba(250, 173, 20, 0.3);
}

.node-content.node-critical {
  border-color: rgba(255, 77, 79, 0.3);
}

.node-content.node-depleted {
  border-color: rgba(255, 77, 79, 0.5);
  background: rgba(255, 77, 79, 0.05);
}

.node-icon {
  font-size: 20px;
}

.node-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.node-balance {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.node-status {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.healthy {
  background: #52c41a;
  box-shadow: 0 0 8px rgba(82, 196, 26, 0.5);
}

.status-dot.warning {
  background: #faad14;
  box-shadow: 0 0 8px rgba(250, 173, 20, 0.5);
}

.status-dot.critical {
  background: #ff4d4f;
  box-shadow: 0 0 8px rgba(255, 77, 79, 0.5);
}

.status-dot.depleted {
  background: #f5222d;
  box-shadow: 0 0 8px rgba(245, 34, 45, 0.5);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 子节点样式 */
.tree-children {
  margin-left: 24px;
  padding-left: 16px;
  border-left: 2px solid rgba(102, 126, 234, 0.3);
  margin-top: 8px;
}

.tree-children .node-content {
  background: rgba(255, 255, 255, 0.03);
}
</style>
