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
import { ref, computed, watch, onMounted } from 'vue';
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
:deep(.n-card) {
  background: var(--bg-card);
}

:deep(.n-form-item) {
  margin-bottom: 16px;
}
</style>
