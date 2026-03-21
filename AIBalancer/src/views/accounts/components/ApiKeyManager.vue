<template>
  <div class="api-key-manager">
    <!-- API Keys 列表 -->
    <div class="keys-header">
      <span class="title">API 密钥</span>
      <n-button size="small" type="primary" @click="showAddModal = true">
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
        添加密钥
      </n-button>
    </div>

    <div v-if="apiKeys.length === 0" class="empty-state">
      <n-empty description="暂无 API 密钥" size="small" />
    </div>

    <div v-else class="keys-list">
      <div
        v-for="key in apiKeys"
        :key="key.id"
        class="key-item"
        :class="{ inactive: !key.isActive }"
      >
        <div class="key-info">
          <div class="key-value">
            <span class="key-masked">{{ key.key }}</span>
            <n-tag
              :type="key.isActive ? 'success' : 'default'"
              size="small"
              :bordered="false"
            >
              {{ key.isActive ? '活跃' : '停用' }}
            </n-tag>
          </div>
          <div class="key-meta">
            <span>创建: {{ formatDate(key.createdAt) }}</span>
            <span>使用次数: {{ key.usageCount }}</span>
            <span v-if="key.expiresAt">
              过期: {{ formatDate(key.expiresAt) }}
              <n-tag v-if="isExpiringSoon(key.expiresAt)" type="warning" size="small">
                即将过期
              </n-tag>
            </span>
          </div>
        </div>
        <div class="key-actions">
          <n-button-group size="small">
            <n-button
              v-if="key.isActive"
              quaternary
              @click="handleRotate(key)"
              title="轮换密钥"
            >
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
            </n-button>
            <n-button
              v-if="key.isActive && activeKeysCount > 1"
              quaternary
              type="warning"
              @click="handleDeactivate(key)"
              title="停用"
            >
              <template #icon>
                <n-icon><StopCircleOutline /></n-icon>
              </template>
            </n-button>
            <n-button
              v-else-if="!key.isActive"
              quaternary
              type="success"
              @click="handleActivate(key)"
              title="激活"
            >
              <template #icon>
                <n-icon><PlayCircleOutline /></n-icon>
              </template>
            </n-button>
            <n-button
              quaternary
              type="error"
              @click="handleDelete(key)"
              title="删除"
            >
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
            </n-button>
          </n-button-group>
        </div>
      </div>
    </div>

    <!-- 添加密钥模态框 -->
    <n-modal
      v-model:show="showAddModal"
      preset="dialog"
      title="添加 API 密钥"
      positive-text="添加"
      negative-text="取消"
      :loading="isAdding"
      @positive-click="handleAddKey"
    >
      <n-form ref="addFormRef" :model="addForm" :rules="addRules">
        <n-form-item label="API 密钥" path="apiKey">
          <n-input
            v-model:value="addForm.apiKey"
            type="password"
            show-password-on="click"
            placeholder="请输入 API 密钥"
          />
        </n-form-item>
        <n-form-item label="过期日期（可选）" path="expiresAt">
          <n-date-picker
            v-model:value="addForm.expiresAt"
            type="date"
            clearable
            :is-date-disabled="disablePastDate"
          />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 轮换密钥模态框 -->
    <n-modal
      v-model:show="showRotateModal"
      preset="dialog"
      title="轮换 API 密钥"
      positive-text="确认轮换"
      negative-text="取消"
      :loading="isRotating"
      @positive-click="handleConfirmRotate"
    >
      <n-alert type="info" title="说明" style="margin-bottom: 16px;">
        轮换密钥将使用新密钥替换当前密钥，原密钥将被停用。
      </n-alert>
      <n-form ref="rotateFormRef" :model="rotateForm" :rules="rotateRules">
        <n-form-item label="当前密钥">
          <n-input :value="rotatingKey?.key" disabled />
        </n-form-item>
        <n-form-item label="新 API 密钥" path="newKey">
          <n-input
            v-model:value="rotateForm.newKey"
            type="password"
            show-password-on="click"
            placeholder="请输入新的 API 密钥"
          />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 删除确认 -->
    <n-modal
      v-model:show="showDeleteConfirm"
      preset="dialog"
      type="warning"
      title="确认删除"
      content="确定要删除此 API 密钥吗？此操作不可恢复。"
      positive-text="删除"
      negative-text="取消"
      @positive-click="handleConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NButton,
  NButtonGroup,
  NIcon,
  NTag,
  NEmpty,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NDatePicker,
  NAlert
} from 'naive-ui';
import {
  AddOutline,
  RefreshOutline,
  StopCircleOutline,
  PlayCircleOutline,
  TrashOutline
} from '@vicons/ionicons5';
import type { ApiKeyInfo } from '../../../models/entities/Account';

// Props
interface Props {
  apiKeys: ApiKeyInfo[];
  accountId: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'add': [apiKey: string, expiresAt?: string];
  'rotate': [keyId: string, newKey: string];
  'activate': [keyId: string];
  'deactivate': [keyId: string];
  'delete': [keyId: string];
}>();

// 状态
const showAddModal = ref(false);
const showRotateModal = ref(false);
const showDeleteConfirm = ref(false);
const isAdding = ref(false);
const isRotating = ref(false);
const rotatingKey = ref<ApiKeyInfo | null>(null);
const deletingKeyId = ref<string | null>(null);

// 表单
const addFormRef = ref();
const addForm = ref({
  apiKey: '',
  expiresAt: null as number | null
});

const addRules = {
  apiKey: [
    { required: true, message: '请输入 API 密钥' }
  ]
};

const rotateFormRef = ref();
const rotateForm = ref({
  newKey: ''
});

const rotateRules = {
  newKey: [
    { required: true, message: '请输入新的 API 密钥' }
  ]
};

// 计算属性
const activeKeysCount = computed(() =>
  props.apiKeys.filter(k => k.isActive).length
);

// 方法
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function isExpiringSoon(expiresAt: string): boolean {
  const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days > 0 && days < 30;
}

function disablePastDate(ts: number): boolean {
  return ts < Date.now();
}

async function handleAddKey() {
  try {
    await addFormRef.value?.validate();
    isAdding.value = true;

    const expiresAt = addForm.value.expiresAt
      ? new Date(addForm.value.expiresAt).toISOString()
      : undefined;

    emit('add', addForm.value.apiKey, expiresAt);

    showAddModal.value = false;
    addForm.value = { apiKey: '', expiresAt: null };
  } catch (e) {
    // 验证失败
  } finally {
    isAdding.value = false;
  }
}

function handleRotate(key: ApiKeyInfo) {
  rotatingKey.value = key;
  rotateForm.value.newKey = '';
  showRotateModal.value = true;
}

async function handleConfirmRotate() {
  if (!rotatingKey.value) return;

  try {
    await rotateFormRef.value?.validate();
    isRotating.value = true;
    emit('rotate', rotatingKey.value.id, rotateForm.value.newKey);
    showRotateModal.value = false;
    rotatingKey.value = null;
  } catch (e) {
    // 验证失败
  } finally {
    isRotating.value = false;
  }
}

function handleActivate(key: ApiKeyInfo) {
  emit('activate', key.id);
}

function handleDeactivate(key: ApiKeyInfo) {
  emit('deactivate', key.id);
}

function handleDelete(key: ApiKeyInfo) {
  deletingKeyId.value = key.id;
  showDeleteConfirm.value = true;
}

function handleConfirmDelete() {
  if (deletingKeyId.value) {
    emit('delete', deletingKeyId.value);
    deletingKeyId.value = null;
  }
}
</script>

<style scoped>
.api-key-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keys-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.empty-state {
  padding: 24px;
  text-align: center;
}

.keys-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-light);
  transition: all 0.2s;
}

.key-item:hover {
  border-color: var(--primary-500);
}

.key-item.inactive {
  opacity: 0.6;
}

.key-info {
  flex: 1;
  min-width: 0;
}

.key-value {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.key-masked {
  font-family: monospace;
  font-size: 13px;
  color: var(--text-primary);
}

.key-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.key-actions {
  flex-shrink: 0;
}
</style>
