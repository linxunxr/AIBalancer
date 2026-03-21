<template>
  <n-drawer
    :show="show"
    :width="450"
    placement="right"
    @update:show="handleShowChange"
  >
    <n-drawer-content v-if="account" :title="accountName" closable>
      <!-- 基本信息 -->
      <n-h4>基本信息</n-h4>
      <n-descriptions :column="1" label-placement="left" bordered size="small">
        <n-descriptions-item label="类型">
          <n-tag size="small" :bordered="false">
            {{ accountType }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="statusTagType" size="small">
            {{ accountStatus }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="创建时间">
          {{ formatDateTime(createdAt) }}
        </n-descriptions-item>
        <n-descriptions-item label="更新时间">
          {{ formatDateTime(updatedAt) }}
        </n-descriptions-item>
        <n-descriptions-item label="最后同步">
          {{ formatDateTime(lastSyncedAt) }}
        </n-descriptions-item>
      </n-descriptions>

      <!-- API 密钥管理 -->
      <ApiKeyManager
        :api-keys="apiKeys"
        :account-id="accountId || ''"
        @add="handleAddApiKey"
        @rotate="handleRotateApiKey"
        @activate="handleActivateApiKey"
        @deactivate="handleDeactivateApiKey"
        @delete="handleDeleteApiKey"
      />

      <!-- 余额信息 -->
      <n-h4>余额信息</n-h4>
      <n-grid :cols="2" :x-gap="12">
        <n-gi>
          <n-statistic label="当前余额" :value="currentBalance">
            <template #prefix>
              {{ currency }}
            </template>
          </n-statistic>
        </n-gi>
        <n-gi>
          <n-statistic label="低余额阈值" :value="settings.lowBalanceThreshold">
            <template #prefix>
              {{ currency }}
            </template>
          </n-statistic>
        </n-gi>
      </n-grid>

      <!-- 使用统计 -->
      <n-h4>使用统计</n-h4>
      <n-grid :cols="2" :x-gap="12">
        <n-gi>
          <n-statistic label="总 Tokens" :value="formatTokens(usage.totalTokens)" />
        </n-gi>
        <n-gi>
          <n-statistic label="总成本" :value="usage.totalCost.toFixed(2)">
            <template #prefix>¥</template>
          </n-statistic>
        </n-gi>
        <n-gi>
          <n-statistic label="输入 Tokens" :value="formatTokens(usage.promptTokens)" />
        </n-gi>
        <n-gi>
          <n-statistic label="输出 Tokens" :value="formatTokens(usage.completionTokens)" />
        </n-gi>
        <n-gi :span="2">
          <n-statistic label="最后使用" :value="formatDateTime(usage.lastUsed)" />
        </n-gi>
      </n-grid>

      <!-- 备注 -->
      <template v-if="metadata.notes">
        <n-h4>备注</n-h4>
        <n-p class="notes">{{ metadata.notes }}</n-p>
      </template>

      <!-- 标签 -->
      <template v-if="metadata.tags.length > 0">
        <n-h4>标签</n-h4>
        <n-space>
          <n-tag v-for="tag in metadata.tags" :key="tag" type="info" size="small">
            {{ tag }}
          </n-tag>
        </n-space>
      </template>

      <!-- 告警 -->
      <template v-if="alerts.length > 0">
        <n-h4>告警</n-h4>
        <n-list bordered size="small">
          <n-list-item v-for="alert in alerts" :key="alert.id">
            <n-thing :title="getAlertTitle(alert.type)" :description="alert.message">
              <template #header-extra>
                <n-tag :type="alert.severity === 'error' ? 'error' : 'warning'" size="small">
                  {{ alert.severity }}
                </n-tag>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
      </template>

      <!-- 底部操作 -->
      <template #footer>
        <n-space>
          <n-button :loading="isRefreshing" @click="handleRefreshBalance">
            刷新余额
          </n-button>
          <n-button type="primary" @click="handleEdit">
            编辑
          </n-button>
        </n-space>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import {
  NDrawer,
  NDrawerContent,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NH4,
  NGrid,
  NGi,
  NStatistic,
  NP,
  NSpace,
  NButton,
  NList,
  NListItem,
  NThing,
  useMessage
} from 'naive-ui';
import type { Account, AccountAlert } from '../../../models/entities/Account';
import { AccountDetailViewModel } from '../../../viewmodels/accounts/useAccountDetailViewModel';
import ApiKeyManager from './ApiKeyManager.vue';

// Props
interface Props {
  show: boolean;
  account: Account | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:show': [show: boolean];
  'refresh': [id: string];
  'edit': [account: Account];
  'updated': [];
}>();

// 消息提示
const message = useMessage();

// ==================== ViewModel ====================

const viewModel = new AccountDetailViewModel();

// 监听账户变化
watch(
  () => props.account,
  (account) => {
    viewModel.setAccount(account);
  },
  { immediate: true }
);

// ==================== 计算属性（从ViewModel获取） ====================

const account = computed(() => viewModel.account);
const accountId = computed(() => viewModel.accountId);
const accountName = computed(() => viewModel.accountName);
const accountType = computed(() => viewModel.accountType);
const accountStatus = computed(() => viewModel.accountStatus);
const statusTagType = computed(() => viewModel.statusTagType);
const currentBalance = computed(() => viewModel.currentBalance);
const currency = computed(() => viewModel.currency);
const usage = computed(() => viewModel.usage);
const apiKeys = computed(() => viewModel.apiKeys);
const alerts = computed(() => viewModel.alerts);
const metadata = computed(() => viewModel.metadata);
const settings = computed(() => viewModel.settings);
const createdAt = computed(() => viewModel.createdAt);
const updatedAt = computed(() => viewModel.updatedAt);
const lastSyncedAt = computed(() => viewModel.lastSyncedAt);
const isRefreshing = computed(() => viewModel.isRefreshing);

// ==================== 格式化函数 ====================

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

function getAlertTitle(type: AccountAlert['type']): string {
  const titles: Record<AccountAlert['type'], string> = {
    low_balance: '低余额',
    high_usage: '高使用量',
    key_expired: '密钥过期',
    api_error: 'API错误'
  };
  return titles[type] || type;
}

// ==================== 事件处理 ====================

function handleShowChange(value: boolean): void {
  emit('update:show', value);
}

async function handleRefreshBalance(): Promise<void> {
  if (!accountId.value) return;

  const result = await viewModel.refreshBalance();
  if (result) {
    message.success('余额已刷新');
    emit('refresh', accountId.value);
    emit('updated');
  }
}

function handleEdit(): void {
  if (account.value) {
    emit('edit', account.value);
  }
}

// API Key 操作处理
async function handleAddApiKey(apiKey: string, expiresAt?: string): Promise<void> {
  const result = await viewModel.addApiKey(apiKey, expiresAt);
  if (result) {
    message.success('API Key 已添加');
    emit('updated');
  }
}

async function handleRotateApiKey(keyId: string, newKey: string): Promise<void> {
  const result = await viewModel.rotateApiKey(keyId, newKey);
  if (result) {
    message.success('API Key 已轮换');
    emit('updated');
  }
}

async function handleActivateApiKey(keyId: string): Promise<void> {
  const result = await viewModel.activateApiKey(keyId);
  if (result) {
    message.success('API Key 已激活');
    emit('updated');
  }
}

async function handleDeactivateApiKey(keyId: string): Promise<void> {
  const result = await viewModel.deactivateApiKey(keyId);
  if (result) {
    message.success('API Key 已停用');
    emit('updated');
  }
}

async function handleDeleteApiKey(keyId: string): Promise<void> {
  const result = await viewModel.deleteApiKey(keyId);
  if (result) {
    message.success('API Key 已删除');
    emit('updated');
  }
}
</script>

<style scoped>
/* 玻璃拟态抽屉 */
:deep(.n-drawer) {
  --n-color: rgba(15, 15, 30, 0.95) !important;
}

:deep(.n-drawer-content) {
  background: var(--glass-bg) !important;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-left: 1px solid var(--glass-border);
}

:deep(.n-drawer-header) {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

:deep(.n-drawer-header__title) {
  font-weight: 700;
  font-size: 18px;
  background: linear-gradient(135deg, var(--text-primary), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:deep(.n-drawer-body-content-wrapper) {
  padding: 20px 24px;
}

/* 标题样式 */
:deep(.n-h4) {
  margin-top: 20px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
}

:deep(.n-h4)::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 40px;
  height: 2px;
  background: var(--gradient-primary);
}

:deep(.n-h4:first-child) {
  margin-top: 0;
}

/* 描述列表 */
:deep(.n-descriptions) {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md, 12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

:deep(.n-descriptions-item) {
  padding: 12px 16px !important;
}

:deep(.n-descriptions-item__label) {
  background: rgba(255, 255, 255, 0.02) !important;
  color: var(--text-secondary);
  font-size: 13px;
}

:deep(.n-descriptions-item__content) {
  background: inherit !important;
  color: var(--text-primary);
  font-size: 14px;
}

/* 统计卡片 */
:deep(.n-grid) {
  margin-bottom: 16px;
}

:deep(.n-statistic) {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md, 12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

:deep(.n-statistic .n-statistic-value) {
  font-size: 24px;
  font-weight: 700;
  font-family: 'SF Mono', 'Monaco', monospace;
  background: linear-gradient(135deg, var(--text-primary), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:deep(.n-statistic .n-statistic-label) {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 备注 */
.notes {
  color: var(--text-secondary);
  line-height: 1.8;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md, 12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 14px;
}

/* 标签 */
:deep(.n-space) {
  flex-wrap: wrap;
}

:deep(.n-tag) {
  background: rgba(94, 114, 235, 0.1);
  border: 1px solid rgba(94, 114, 235, 0.3);
  border-radius: var(--radius-sm, 6px);
  transition: all var(--transition-normal);
}

:deep(.n-tag:hover) {
  background: rgba(94, 114, 235, 0.2);
  transform: scale(1.05);
}

/* 列表 */
:deep(.n-list) {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md, 12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

:deep(.n-list-item) {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

:deep(.n-list-item:last-child) {
  border-bottom: none;
}

:deep(.n-thing) {
  --n-title-text-color: var(--text-primary);
  --n-description-text-color: var(--text-secondary);
}

/* 抽屉底部 */
:deep(.n-drawer-footer) {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* 按钮 */
:deep(.n-button) {
  transition: all var(--transition-normal);
  border-radius: var(--radius-md, 12px);
}

:deep(.n-button:hover) {
  transform: translateY(-2px);
}

:deep(.n-button[type="primary"]) {
  background: var(--gradient-primary) !important;
  border-color: transparent !important;
  box-shadow: var(--glow-primary);
}

:deep(.n-button[type="primary"]:hover) {
  box-shadow: 0 6px 20px rgba(94, 114, 235, 0.4);
}
</style>
