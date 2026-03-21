<template>
  <n-card
    :class="['account-card-item', { selected, disabled: account.status !== 'active' }]"
    hoverable
    size="small"
    @click="emit('select', account.id)"
  >
    <!-- 卡片头部 -->
    <template #header>
      <div class="card-header">
        <n-checkbox
          :checked="selected"
          @update:checked="emit('select', account.id)"
          @click.stop
        />
        <n-avatar
          :style="{ backgroundColor: getAvatarColor(account.type) }"
          size="small"
          round
        >
          {{ account.name.charAt(0).toUpperCase() }}
        </n-avatar>
        <div class="account-info">
          <span class="name">{{ account.name }}</span>
          <n-tag size="tiny" :bordered="false">
            {{ getTypeLabel(account.type) }}
          </n-tag>
        </div>
        <n-tag
          :type="getStatusTagType(account.status)"
          size="small"
        >
          {{ getStatusLabel(account.status) }}
        </n-tag>
      </div>
    </template>

    <!-- 卡片内容 -->
    <div class="card-body">
      <div class="info-row">
        <span class="label">余额:</span>
        <span class="value balance">
          {{ account.currency }} {{ account.currentBalance.toFixed(2) }}
        </span>
      </div>
      <div class="info-row">
        <span class="label">使用量:</span>
        <span class="value">{{ formatTokens(account.usage.totalTokens) }}</span>
      </div>
      <div class="info-row" v-if="mode === 'card'">
        <span class="label">最后使用:</span>
        <span class="value">{{ formatDate(account.usage.lastUsed) }}</span>
      </div>
    </div>

    <!-- 卡片操作 -->
    <template #action>
      <div class="card-footer">
        <div class="toggle-wrapper">
          <n-switch
            :value="account.status === 'active'"
            size="small"
            @update:value="emit('toggle', account.id)"
            @click.stop
          />
          <span class="toggle-label">
            {{ account.status === 'active' ? '已启用' : '已停用' }}
          </span>
        </div>
        <n-space size="small">
          <n-button size="tiny" @click.stop="emit('detail', account)">
            详情
          </n-button>
          <n-button size="tiny" @click.stop="emit('edit', account)">
            编辑
          </n-button>
          <n-button
            size="tiny"
            type="error"
            @click.stop="emit('delete', account)"
          >
            删除
          </n-button>
        </n-space>
      </div>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import type { Account } from '../../../models/entities/Account';
import {
  AccountType,
  getStatusLabel,
  getTypeLabel,
  getStatusTagType
} from '../../../models/entities/Account';

// Props
interface Props {
  account: Account;
  selected: boolean;
  mode: 'grid' | 'card';
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  select: [id: string];
  detail: [account: Account];
  edit: [account: Account];
  toggle: [id: string];
  delete: [account: Account];
}>();

// 格式化函数
function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

function getAvatarColor(type: AccountType): string {
  const colors: Record<AccountType, string> = {
    [AccountType.DEEPSEEK]: '#6366f1',
    [AccountType.OPENAI]: '#10a37f',
    [AccountType.ANTHROPIC]: '#d4a27f',
    [AccountType.GOOGLE]: '#4285f4',
    [AccountType.AZURE]: '#0078d4',
    [AccountType.CUSTOM]: '#6b7280'
  };
  return colors[type] || '#6b7280';
}
</script>

<style scoped>
.account-card-item {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.account-card-item:hover {
  border-color: var(--primary-color, #e94560);
}

.account-card-item.selected {
  border-color: var(--primary-color, #e94560);
  background: var(--bg-elevated);
}

.account-card-item.disabled {
  opacity: 0.6;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-info .name {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.info-row .label {
  color: var(--text-secondary);
}

.info-row .value {
  font-family: monospace;
}

.info-row .value.balance {
  color: var(--warning-color, #ffc107);
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-label {
  font-size: 12px;
  color: var(--text-secondary);
}

:deep(.n-card) {
  background: var(--bg-card);
}

:deep(.n-card-header) {
  padding: 12px 16px;
}

:deep(.n-card__content) {
  padding: 12px 16px;
}

:deep(.n-card__action) {
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
}
</style>
