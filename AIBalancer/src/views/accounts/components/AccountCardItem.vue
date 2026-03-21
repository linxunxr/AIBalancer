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
/* 玻璃拟态卡片 */
.account-card-item {
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--glass-bg) !important;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg, 16px) !important;
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  position: relative;
}

.account-card-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.account-card-item:hover {
  transform: translateY(-4px);
  border-color: var(--primary-color) !important;
  box-shadow: var(--shadow-lg), var(--glow-primary);
}

.account-card-item:hover::before {
  opacity: 1;
}

.account-card-item.selected {
  border-color: var(--primary-color) !important;
  background: rgba(94, 114, 235, 0.1) !important;
  box-shadow: var(--shadow-lg), var(--glow-primary);
}

.account-card-item.selected::before {
  opacity: 1;
}

.account-card-item.disabled {
  opacity: 0.5;
  filter: grayscale(0.5);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.account-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-info .name {
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: linear-gradient(135deg, var(--text-primary), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-sm, 8px);
  transition: all var(--transition-fast);
}

.info-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.info-row .label {
  color: var(--text-secondary);
  font-size: 12px;
}

.info-row .value {
  font-family: 'SF Mono', 'Monaco', monospace;
  font-weight: 500;
}

.info-row .value.balance {
  background: linear-gradient(135deg, #ffc107, #ff9800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  font-size: 14px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
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

/* 覆盖Naive UI组件样式 - 保持玻璃拟态背景 */
:deep(.n-card) {
  background: var(--glass-bg) !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.n-card-header) {
  padding: 0;
}

:deep(.n-card__content) {
  padding: 0;
}

:deep(.n-card__action) {
  padding: 0;
  border-top: none;
  background: transparent;
}

:deep(.n-checkbox) {
  --n-border: 1px solid var(--glass-border);
  --n-border-checked: var(--primary-color);
}

:deep(.n-checkbox--checked) {
  background: var(--gradient-primary);
  border-color: transparent;
}

:deep(.n-avatar) {
  background: var(--gradient-primary) !important;
  box-shadow: var(--glow-primary);
}

:deep(.n-tag) {
  background: rgba(94, 114, 235, 0.1);
  border: 1px solid rgba(94, 114, 235, 0.3);
  border-radius: var(--radius-sm, 6px);
  font-size: 11px;
}

:deep(.n-switch) {
  --n-rail-color: rgba(255, 255, 255, 0.1);
  --n-rail-color-active: var(--gradient-primary);
}

:deep(.n-button) {
  transition: all var(--transition-normal);
}

:deep(.n-button:hover) {
  transform: scale(1.05);
}

:deep(.n-button--error-type) {
  background: rgba(239, 68, 68, 0.1) !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
}

:deep(.n-button--error-type:hover) {
  background: rgba(239, 68, 68, 0.2) !important;
  border-color: rgba(239, 68, 68, 0.5) !important;
}
</style>
