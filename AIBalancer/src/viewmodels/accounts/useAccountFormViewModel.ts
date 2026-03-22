import { BaseViewModel, useViewModel } from '../BaseViewModel';
import { accountService } from '../../models/services/AccountService';
import type {
  Account,
  AccountType,
  AccountCategory,
  CreateAccountParams,
  UpdateAccountParams
} from '../../models/entities/Account';
import {
  AccountType as AT,
  AccountCategory as AC,
  CATEGORY_PROVIDER_MAP,
  getCategoryLabel,
  getCategoryDescription
} from '../../models/entities/Account';

// ==================== 类型定义 ====================

/**
 * 表单数据接口
 */
export interface AccountFormData {
  name: string;
  category: AccountCategory;  // 基础类型
  type: AccountType;          // 服务商类型
  apiKey: string;
  notes: string;
  tags: string[];
}

/**
 * 表单验证规则
 */
export interface FormValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message: string;
}

/**
 * 表单字段错误
 */
export type FormErrors = Partial<Record<keyof AccountFormData, string>>;

/**
 * AccountFormViewModel状态
 */
export interface AccountFormState {
  formData: AccountFormData;
  errors: FormErrors;
  isSubmitting: boolean;
  isValid: boolean;
  isEditing: boolean;
  editingAccountId: string | null;
}

// ==================== 默认值 ====================

/**
 * 默认表单数据
 */
export const DEFAULT_FORM_DATA: AccountFormData = {
  name: '',
  category: AC.DIRECT_BALANCE,
  type: AT.DEEPSEEK,
  apiKey: '',
  notes: '',
  tags: []
};

// ==================== ViewModel ====================

/**
 * 账户表单ViewModel
 * 处理账户创建和编辑的表单逻辑
 */
export class AccountFormViewModel extends BaseViewModel<AccountFormState> {
  /**
   * 基础类型选项
   */
  public readonly categoryOptions = [
    {
      value: AC.DIRECT_BALANCE,
      label: getCategoryLabel(AC.DIRECT_BALANCE),
      description: getCategoryDescription(AC.DIRECT_BALANCE)
    },
    {
      value: AC.COMPREHENSIVE_QUOTA,
      label: getCategoryLabel(AC.COMPREHENSIVE_QUOTA),
      description: getCategoryDescription(AC.COMPREHENSIVE_QUOTA)
    },
    {
      value: AC.SUBSCRIPTION_PLAN,
      label: getCategoryLabel(AC.SUBSCRIPTION_PLAN),
      description: getCategoryDescription(AC.SUBSCRIPTION_PLAN)
    },
    {
      value: AC.TOKENS_ACCOUNT,
      label: getCategoryLabel(AC.TOKENS_ACCOUNT),
      description: getCategoryDescription(AC.TOKENS_ACCOUNT)
    }
  ];

  /**
   * 所有服务商类型选项
   */
  public readonly allTypeOptions = [
    { label: 'DeepSeek', value: AT.DEEPSEEK },
    { label: 'OpenAI', value: AT.OPENAI },
    { label: 'Anthropic', value: AT.ANTHROPIC },
    { label: '方舟Coding Plan', value: AT.ARK_CODING_PLAN },
    { label: '阿里云通义千问', value: AT.ALIYUN_QWEN },
    { label: '自定义', value: AT.CUSTOM }
  ];

  /**
   * 验证规则
   */
  private readonly validationRules: Record<keyof AccountFormData, FormValidationRule[]> = {
    name: [
      { required: true, message: '请输入账户名称' },
      { minLength: 2, maxLength: 50, message: '名称长度应为 2-50 个字符' }
    ],
    category: [
      { required: true, message: '请选择基础类型' }
    ],
    type: [
      { required: true, message: '请选择服务商类型' }
    ],
    apiKey: [
      { required: true, message: '请输入 API Key' }
    ],
    notes: [
      { maxLength: 500, message: '备注不能超过500个字符' }
    ],
    tags: []
  };

  /**
   * 现有标签列表（用于自动补全）
   */
  private existingTags: string[] = [];

  constructor() {
    super({
      formData: { ...DEFAULT_FORM_DATA },
      errors: {},
      isSubmitting: false,
      isValid: false,
      isEditing: false,
      editingAccountId: null
    });
  }

  // ==================== 公共方法 ====================

  /**
   * 设置编辑账户
   * @param account 要编辑的账户
   */
  public setEditingAccount(account: Account | null): void {
    if (account) {
      this.state.isEditing = true;
      this.state.editingAccountId = account.id;
      this.state.formData = {
        name: account.name,
        category: account.category,
        type: account.type,
        apiKey: '', // 编辑时不显示API Key
        notes: account.metadata.notes || '',
        tags: [...account.metadata.tags]
      };
    } else {
      this.resetForm();
    }
    this.clearErrors();
  }

  /**
   * 更新基础类型并重置服务商类型
   * @param category 新的基础类型
   */
  public updateCategory(category: AccountCategory): void {
    this.state.formData.category = category;

    // 获取该基础类型对应的服务商列表
    const providers = CATEGORY_PROVIDER_MAP[category] || [];

    // 如果当前服务商不在新列表中，重置为第一个可用服务商
    if (providers.length > 0 && !providers.includes(this.state.formData.type)) {
      this.state.formData.type = providers[0];
    }

    // 清除错误
    if (this.state.errors.category) {
      delete this.state.errors.category;
    }
    if (this.state.errors.type) {
      delete this.state.errors.type;
    }
  }

  /**
   * 获取筛选后的服务商选项
   */
  public getFilteredTypeOptions(): Array<{ label: string; value: AccountType }> {
    const providers = CATEGORY_PROVIDER_MAP[this.state.formData.category] || [];
    return this.allTypeOptions.filter(opt => providers.includes(opt.value));
  }

  /**
   * 设置现有标签列表
   * @param tags 现有标签
   */
  public setExistingTags(tags: string[]): void {
    this.existingTags = tags;
  }

  /**
   * 获取标签选项
   */
  public getTagOptions(): Array<{ label: string; value: string }> {
    return this.existingTags.map(tag => ({ label: tag, value: tag }));
  }

  /**
   * 更新表单字段
   * @param field 字段名
   * @param value 字段值
   */
  public updateField<K extends keyof AccountFormData>(
    field: K,
    value: AccountFormData[K]
  ): void {
    this.state.formData[field] = value;

    // 清除该字段的错误
    if (this.state.errors[field]) {
      delete this.state.errors[field];
    }

    // 实时验证
    this.validateField(field);
  }

  /**
   * 验证单个字段
   * @param field 字段名
   */
  public validateField(field: keyof AccountFormData): boolean {
    const rules = this.validationRules[field];
    const value = this.state.formData[field];

    for (const rule of rules) {
      const error = this.validateRule(value, rule, field);
      if (error) {
        this.state.errors[field] = error;
        return false;
      }
    }

    delete this.state.errors[field];
    return true;
  }

  /**
   * 验证所有字段
   */
  public validateAll(): boolean {
    let isValid = true;

    // 编辑模式下不验证apiKey
    const fieldsToValidate: (keyof AccountFormData)[] = this.state.isEditing
      ? ['name', 'category', 'type', 'notes', 'tags']
      : ['name', 'category', 'type', 'apiKey', 'notes', 'tags'];

    for (const field of fieldsToValidate) {
      if (!this.validateField(field)) {
        isValid = false;
      }
    }

    this.state.isValid = isValid;
    return isValid;
  }

  /**
   * 提交表单
   * @returns 创建或更新后的账户，失败返回null
   */
  public async submit(): Promise<Account | null> {
    // 验证表单
    if (!this.validateAll()) {
      return null;
    }

    this.state.isSubmitting = true;

    try {
      let result: Account | null;

      if (this.state.isEditing && this.state.editingAccountId) {
        // 更新账户
        const params: UpdateAccountParams = {
          id: this.state.editingAccountId,
          name: this.state.formData.name,
          metadata: {
            notes: this.state.formData.notes,
            tags: this.state.formData.tags
          }
        };
        result = await accountService.updateAccount(this.state.editingAccountId, params);
      } else {
        // 创建账户
        const params: CreateAccountParams = {
          name: this.state.formData.name,
          category: this.state.formData.category,
          type: this.state.formData.type,
          apiKey: this.state.formData.apiKey,
          notes: this.state.formData.notes,
          tags: this.state.formData.tags
        };
        result = await accountService.createAccount(params);
      }

      return result;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : '操作失败');
      return null;
    } finally {
      this.state.isSubmitting = false;
    }
  }

  /**
   * 重置表单
   */
  public resetForm(): void {
    this.state.formData = { ...DEFAULT_FORM_DATA };
    this.state.errors = {};
    this.state.isSubmitting = false;
    this.state.isValid = false;
    this.state.isEditing = false;
    this.state.editingAccountId = null;
    this.clearError();
  }

  /**
   * 清除所有错误
   */
  public clearErrors(): void {
    this.state.errors = {};
    this.clearError();
  }

  // ==================== 计算属性 ====================

  /**
   * 获取表单数据
   */
  public get formData(): AccountFormData {
    return this.state.formData;
  }

  /**
   * 获取表单错误
   */
  public get errors(): FormErrors {
    return this.state.errors;
  }

  /**
   * 获取提交状态
   */
  public get isSubmitting(): boolean {
    return this.state.isSubmitting;
  }

  /**
   * 获取是否为编辑模式
   */
  public get isEditing(): boolean {
    return this.state.isEditing;
  }

  /**
   * 获取表单标题
   */
  public get formTitle(): string {
    return this.state.isEditing ? '编辑账户' : '添加账户';
  }

  /**
   * 获取提交按钮文本
   */
  public get submitButtonText(): string {
    return this.state.isEditing ? '更新' : '创建';
  }

  /**
   * 获取是否有表单错误
   */
  public get hasFormErrors(): boolean {
    return Object.keys(this.state.errors).length > 0;
  }

  // ==================== 私有方法 ====================

  /**
   * 验证单个规则
   */
  private validateRule(
    value: any,
    rule: FormValidationRule,
    _field: keyof AccountFormData
  ): string | null {
    // 必填验证
    if (rule.required) {
      if (value === undefined || value === null || value === '') {
        return rule.message;
      }
      if (Array.isArray(value) && value.length === 0) {
        return rule.message;
      }
    }

    // 跳过空值的非必填字段验证
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // 字符串长度验证
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        return rule.message;
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        return rule.message;
      }
    }

    // 正则验证
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return rule.message;
      }
    }

    return null;
  }
}

// ==================== Composition函数 ====================

/**
 * 账户表单ViewModel Composition函数
 */
export function useAccountFormViewModel() {
  return useViewModel(AccountFormViewModel);
}
