<template>
  <n-modal
    :show="show"
    :title="formTitle"
    preset="card"
    :style="{ width: '500px', maxWidth: '90vw' }"
    :mask-closable="false"
    @update:show="handleShowChange"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="80"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="账户名称" path="name">
        <n-input
          :value="formData.name"
          placeholder="例如：DeepSeek Pro"
          maxlength="50"
          @update:value="(v) => updateField('name', v)"
        />
      </n-form-item>

      <n-form-item label="平台类型" path="type">
        <n-select
          :value="formData.type"
          :options="typeOptions"
          :render-label="renderLabel"
          :menu-props="{ class: 'glass-select-menu' }"
          placeholder="选择平台类型"
          @update:value="(v) => updateField('type', v)"
        />
      </n-form-item>

      <n-form-item v-if="!isEditing" label="API Key" path="apiKey">
        <n-input
          :value="formData.apiKey"
          type="password"
          show-password-on="click"
          placeholder="输入 API Key"
          @update:value="(v) => updateField('apiKey', v)"
        />
      </n-form-item>

      <n-form-item label="备注" path="notes">
        <n-input
          :value="formData.notes"
          type="textarea"
          placeholder="可选备注信息"
          :autosize="{ minRows: 2, maxRows: 4 }"
          @update:value="(v) => updateField('notes', v)"
        />
      </n-form-item>

      <n-form-item label="标签" path="tags">
        <n-select
          :value="formData.tags"
          :options="tagOptions"
          multiple
          filterable
          tag
          :menu-props="{ class: 'glass-select-menu' }"
          placeholder="选择或输入标签"
          @update:value="(v) => updateField('tags', v)"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" :loading="isSubmitting" @click="handleSubmit">
          {{ submitButtonText }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NButton,
  NSpace,
  type FormInst,
  type FormRules
} from 'naive-ui';
import type { Account, CreateAccountParams, UpdateAccountParams } from '../../../models/entities/Account';
import {
  AccountFormViewModel,
  DEFAULT_FORM_DATA,
  type AccountFormData
} from '../../../viewmodels/accounts/useAccountFormViewModel';

// Props
interface Props {
  show: boolean;
  editingAccount: Account | null;
  existingTags?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  existingTags: () => []
});

// Emits
const emit = defineEmits<{
  'update:show': [show: boolean];
  'submit': [data: CreateAccountParams | UpdateAccountParams];
}>();

// ==================== ViewModel ====================

// 创建ViewModel实例（不使用useViewModel因为这是子组件）
const viewModel = new AccountFormViewModel();

// 表单引用
const formRef = ref<FormInst | null>(null);

// ==================== 响应式状态 ====================

const formData = ref<AccountFormData>({ ...DEFAULT_FORM_DATA });
const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);
const isEditing = ref(false);

// ==================== 计算属性 ====================

const formTitle = computed(() => isEditing.value ? '编辑账户' : '添加账户');
const submitButtonText = computed(() => isEditing.value ? '更新' : '创建');
const typeOptions = computed(() => viewModel.typeOptions);
const tagOptions = computed(() =>
  props.existingTags.map(tag => ({ label: tag, value: tag }))
);

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入账户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度应为 2-50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择平台类型', trigger: 'change' }
  ],
  apiKey: [
    {
      required: !isEditing.value,
      message: '请输入 API Key',
      trigger: 'blur'
    }
  ]
};

// ==================== 监听 ====================

// 监听编辑账户变化
watch(
  () => props.editingAccount,
  (account) => {
    if (account) {
      isEditing.value = true;
      formData.value = {
        name: account.name,
        type: account.type,
        apiKey: '', // 编辑时不显示API Key
        notes: account.metadata.notes || '',
        tags: [...account.metadata.tags]
      };
    } else {
      resetForm();
    }
    viewModel.setEditingAccount(account);
  },
  { immediate: true }
);

// 设置现有标签
watch(
  () => props.existingTags,
  (tags) => {
    viewModel.setExistingTags(tags);
  },
  { immediate: true }
);

// ==================== 方法 ====================

// 渲染选项标签（确保文本可见）
function renderLabel(option: { label: string; value: string }): string {
  return option.label;
}

// 更新字段
function updateField<K extends keyof AccountFormData>(
  field: K,
  value: AccountFormData[K]
): void {
  formData.value[field] = value;
  viewModel.updateField(field, value);
}

// 重置表单
function resetForm(): void {
  formData.value = { ...DEFAULT_FORM_DATA };
  errors.value = {};
  isSubmitting.value = false;
  isEditing.value = false;
  viewModel.resetForm();
}

// 处理显示状态变化
function handleShowChange(value: boolean): void {
  if (!value) {
    resetForm();
  }
  emit('update:show', value);
}

// 取消
function handleCancel(): void {
  emit('update:show', false);
  resetForm();
}

// 提交
async function handleSubmit(): Promise<void> {
  try {
    // 先进行表单验证
    await formRef.value?.validate();

    isSubmitting.value = true;

    // 更新ViewModel状态
    viewModel.setEditingAccount(props.editingAccount);
    Object.keys(formData.value).forEach((key) => {
      updateField(key as keyof AccountFormData, formData.value[key as keyof AccountFormData]);
    });

    // 提交
    const result = await viewModel.submit();

    if (result) {
      // 构建提交数据
      if (isEditing.value && props.editingAccount) {
        const params: UpdateAccountParams = {
          id: props.editingAccount.id,
          name: formData.value.name,
          metadata: {
            notes: formData.value.notes,
            tags: formData.value.tags
          }
        };
        emit('submit', params);
      } else {
        const params: CreateAccountParams = {
          name: formData.value.name,
          type: formData.value.type,
          apiKey: formData.value.apiKey,
          notes: formData.value.notes,
          tags: formData.value.tags
        };
        emit('submit', params);
      }
      handleCancel();
    }
  } catch (error) {
    // 验证失败或提交失败
    console.error('表单提交失败:', error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
/* 玻璃拟态模态框 */
:deep(.n-card) {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-xl, 20px) !important;
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-xl), var(--glow-primary);
}

:deep(.n-card-header) {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-xl, 20px) var(--radius-xl, 20px) 0 0;
}

:deep(.n-card-header__main) {
  font-weight: 700;
  font-size: 18px;
  background: linear-gradient(135deg, var(--text-primary), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:deep(.n-card__content) {
  padding: 24px;
}

:deep(.n-card__footer) {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0 0 var(--radius-xl, 20px) var(--radius-xl, 20px);
}

/* 表单项 */
:deep(.n-form-item) {
  margin-bottom: 20px;
}

:deep(.n-form-item-label) {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 14px;
}

:deep(.n-form-item-label__text) {
  padding-left: 4px;
}

/* 输入框和选择器 */
:deep(.n-input),
:deep(.n-select),
:deep(.n-input-number) {
  --n-color: rgba(255, 255, 255, 0.03) !important;
  --n-color-disabled: rgba(255, 255, 255, 0.02) !important;
  --n-border: 1px solid var(--glass-border) !important;
  --n-border-hover: 1px solid var(--primary-color) !important;
  --n-border-focus: 1px solid var(--primary-color) !important;
  --n-text-color: var(--text-primary) !important;
  --n-text-color-disabled: var(--text-secondary) !important;
  --n-placeholder-color: var(--text-muted) !important;
  --n-caret-color: var(--primary-color) !important;
  --n-input-color: var(--text-primary) !important;
  --n-selection-color: rgba(94, 114, 235, 0.2) !important;
  background: rgba(255, 255, 255, 0.02) !important;
  border-radius: var(--radius-md, 12px);
  transition: all var(--transition-normal);
}

:deep(.n-input:hover),
:deep(.n-select:hover),
:deep(.n-input-number:hover) {
  border-color: var(--primary-color) !important;
}

:deep(.n-input:focus-within),
:deep(.n-select:focus),
:deep(.n-input-number:focus) {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px rgba(94, 114, 235, 0.15) !important;
}

:deep(.n-base-selection) {
  border-radius: var(--radius-md, 12px);
}

/* 确保选择器选中值文本可见 */
:deep(.n-base-selection-label),
:deep(.n-base-selection-input__content) {
  color: var(--text-primary) !important;
}

:deep(.n-base-selection-placeholder) {
  color: var(--text-tertiary) !important;
}

/* 文本域 */
:deep(.n-input--textarea) {
  border-radius: var(--radius-md, 12px);
}

/* 按钮 */
:deep(.n-button) {
  transition: all var(--transition-normal);
  border-radius: var(--radius-md, 12px);
}

:deep(.n-button:not(.n-button--disabled):hover) {
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

:deep(.n-button--quaternary) {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
}

:deep(.n-button--quaternary:hover) {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--primary-color);
}

/* 模态框遮罩 */
:deep(.n-modal) {
  --n-color: rgba(0, 0, 0, 0.6) !important;
}

:deep(.n-dialog) {
  border-radius: var(--radius-xl, 20px) !important;
}
</style>
