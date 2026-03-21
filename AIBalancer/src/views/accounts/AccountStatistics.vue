<template>
  <div class="account-statistics">
    <h2>使用统计</h2>

    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-value">{{ totalTokens }}</div>
        <div class="stat-label">总 Tokens</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">¥{{ totalCost.toFixed(2) }}</div>
        <div class="stat-label">总成本</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ accounts.length }}</div>
        <div class="stat-label">账户数量</div>
      </div>
    </div>

    <div class="chart-section">
      <h3>按平台分布</h3>
      <div class="platform-bars">
        <div v-for="(count, type) in byType" :key="type" class="bar-item">
          <div class="bar-label">{{ getTypeLabel(type as AccountType) }}</div>
          <div class="bar-container">
            <div class="bar-fill" :style="{ width: getBarWidth(count) }"></div>
          </div>
          <div class="bar-value">{{ count }}</div>
        </div>
      </div>
    </div>

    <div class="chart-section">
      <h3>按状态分布</h3>
      <div class="status-grid">
        <div v-for="(count, status) in byStatus" :key="status" class="status-item" :class="status">
          <span class="status-count">{{ count }}</span>
          <span class="status-label">{{ getStatusLabel(status as AccountStatus) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { accountService } from '../../models/services/AccountService';
import { Account, AccountType, AccountStatus, getTypeLabel, getStatusLabel } from '../../models/entities/Account';

const accounts = ref<Account[]>([]);

const totalTokens = computed(() =>
  accounts.value.reduce((sum, a) => sum + a.usage.totalTokens, 0)
);

const totalCost = computed(() =>
  accounts.value.reduce((sum, a) => sum + a.usage.totalCost, 0)
);

const byType = computed(() => {
  const result: Record<string, number> = {};
  accounts.value.forEach(a => {
    result[a.type] = (result[a.type] || 0) + 1;
  });
  return result;
});

const byStatus = computed(() => {
  const result: Record<string, number> = {};
  accounts.value.forEach(a => {
    result[a.status] = (result[a.status] || 0) + 1;
  });
  return result;
});

const maxCount = computed(() => {
  return Math.max(...Object.values(byType.value), 1);
});

function getBarWidth(count: number): string {
  return `${(count / maxCount.value) * 100}%`;
}

onMounted(async () => {
  accounts.value = await accountService.getAllAccounts();
});
</script>

<style scoped>
.account-statistics {
  padding: 24px;
}

h2 {
  margin: 0 0 24px 0;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--bg-card, #16213e);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary, #888);
}

.chart-section {
  background: var(--bg-card, #16213e);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.chart-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.platform-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 100px;
  font-size: 14px;
}

.bar-container {
  flex: 1;
  height: 20px;
  background: var(--bg-tertiary, #0f3460);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--primary, #e94560);
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-value {
  width: 40px;
  text-align: right;
  font-size: 14px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.status-item {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  background: var(--bg-tertiary, #0f3460);
}

.status-item.active {
  border-left: 3px solid #28a745;
}

.status-item.inactive {
  border-left: 3px solid #6c757d;
}

.status-item.error {
  border-left: 3px solid #dc3545;
}

.status-count {
  display: block;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.status-label {
  font-size: 12px;
  color: var(--text-secondary, #888);
}
</style>
