<template>
  <div class="quota-overview-view">
    <!-- 顶部概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card total-available">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <div class="card-label">总可用配额</div>
          <div class="card-value">{{ formatNumber(totalAvailable) }}</div>
          <div class="card-unit">Tokens</div>
        </div>
      </div>

      <div class="overview-card total-reserved">
        <div class="card-icon">🔒</div>
        <div class="card-content">
          <div class="card-label">预留配额</div>
          <div class="card-value">{{ formatNumber(totalReserved) }}</div>
          <div class="card-unit">Tokens</div>
        </div>
      </div>

      <div class="overview-card dimension-count">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <div class="card-label">活跃维度</div>
          <div class="card-value">{{ activeDimensions.length }}</div>
          <div class="card-subtitle">个维度</div>
        </div>
      </div>

      <div class="overview-card health-status" :class="healthStatus">
        <div class="card-icon">{{ healthIcon }}</div>
        <div class="card-content">
          <div class="card-label">健康状态</div>
          <div class="card-value">{{ healthLabel }}</div>
          <div class="card-subtitle">{{ healthDescription }}</div>
        </div>
      </div>
    </div>

    <!-- 维度卡片网格 -->
    <div class="dimensions-section">
      <div class="section-header">
        <h3 class="section-title">配额维度</h3>
        <div class="section-actions">
          <button class="btn btn-secondary" @click="refreshData">
            🔄 刷新
          </button>
          <button class="btn btn-primary" @click="showCreateDimensionModal = true">
            + 添加维度
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="activeDimensions.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无配额维度</p>
        <button class="btn btn-primary" @click="showCreateDimensionModal = true">
          创建第一个维度
        </button>
      </div>

      <!-- 维度卡片网格 -->
      <div v-else class="dimensions-grid">
        <DimensionCard
          v-for="dimension in sortedDimensions"
          :key="dimension.id"
          :dimension="dimension"
          @refresh="refreshDimension"
          @edit="editDimension"
          @delete="deleteDimension"
        />
      </div>
    </div>

    <!-- 维度树视图 -->
    <div v-if="rootDimensions.length > 0" class="dimension-tree-section">
      <div class="section-header">
        <h3 class="section-title">维度关系</h3>
      </div>
      <DimensionTree :dimensions="rootDimensions" :all-dimensions="activeDimensions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuotaStore } from '../../models/stores/quotaStore';
import DimensionCard from './components/DimensionCard.vue';
import DimensionTree from './components/DimensionTree.vue';
import { QuotaDimension } from '../../models/entities';

// Stores
const quotaStore = useQuotaStore();

// State
const showCreateDimensionModal = ref(false);
const selectedDimension = ref<QuotaDimension | null>(null);
const currentAccountId = ref<string>('');

// Computed
const loading = computed(() => quotaStore.loading);
const totalAvailable = computed(() => quotaStore.totalAvailable);
const totalReserved = computed(() => quotaStore.totalReserved);
const activeDimensions = computed(() => quotaStore.activeDimensions);
const sortedDimensions = computed(() => quotaStore.sortedDimensions);
const rootDimensions = computed(() => quotaStore.rootDimensions);
const healthStatus = computed(() => quotaStore.healthStatus);

const healthIcon = computed(() => {
  const icons: Record<string, string> = {
    healthy: '✓',
    warning: '⚠',
    critical: '❗',
    depleted: '✕'
  };
  return icons[healthStatus.value];
});

const healthLabel = computed(() => {
  const labels: Record<string, string> = {
    healthy: '健康',
    warning: '警告',
    critical: '严重',
    depleted: '耗尽'
  };
  return labels[healthStatus.value];
});

const healthDescription = computed(() => {
  const descriptions: Record<string, string> = {
    healthy: '所有维度余额充足',
    warning: '部分维度余额较低',
    critical: '部分维度余额严重不足',
    depleted: '部分维度余额已耗尽'
  };
  return descriptions[healthStatus.value];
});

// Methods
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

async function refreshData() {
  if (currentAccountId.value) {
    await quotaStore.loadQuotaData(currentAccountId.value);
  }
}

async function refreshDimension(dimensionId: string) {
  // TODO: 实现单个维度刷新
  console.log('Refresh dimension:', dimensionId);
}

function editDimension(dimension: QuotaDimension) {
  selectedDimension.value = dimension;
  // TODO: 打开编辑模态框
}

async function deleteDimension(dimension: QuotaDimension) {
  if (confirm(`确定要删除维度 "${dimension.dimensionName}" 吗？`)) {
    await quotaStore.deleteDimension(dimension.id);
  }
}

// Lifecycle
onMounted(async () => {
  // TODO: 从账户列表获取第一个账户ID
  // 暂时使用默认账户
  currentAccountId.value = 'default-account';
  await quotaStore.loadQuotaData(currentAccountId.value);
});
</script>

<style scoped>
.quota-overview-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.overview-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.card-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.card-value {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
}

.card-unit,
.card-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

/* 健康状态卡片 */
.overview-card.health-status.healthy {
  border-color: rgba(82, 196, 26, 0.5);
}

.overview-card.health-status.warning {
  border-color: rgba(250, 173, 20, 0.5);
}

.overview-card.health-status.critical {
  border-color: rgba(255, 77, 79, 0.5);
}

.overview-card.health-status.depleted {
  border-color: rgba(255, 77, 79, 0.8);
}

/* 区块样式 */
.dimensions-section,
.dimension-tree-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.section-actions {
  display: flex;
  gap: 10px;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* 维度网格 */
.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: rgba(255, 255, 255, 0.6);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin-bottom: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .quota-overview-view {
    padding: 15px;
  }

  .overview-cards {
    grid-template-columns: 1fr 1fr;
  }

  .dimensions-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
