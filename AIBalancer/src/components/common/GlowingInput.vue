<template>
  <div
    :class="[
      'glowing-input',
      {
        'glowing-input--focused': isFocused,
        'glowing-input--disabled': disabled,
        'glowing-input--error': error,
        'glowing-input--success': success,
        'glowing-input--with-prefix': $slots.prefix,
        'glowing-input--with-suffix': $slots.suffix || showPasswordToggle
      }
    ]"
    @click="handleContainerClick"
  >
    <!-- 前缀插槽 -->
    <div v-if="$slots.prefix" class="glowing-input__prefix">
      <slot name="prefix"></slot>
    </div>

    <!-- 输入框主体 -->
    <div class="glowing-input__wrapper">
      <!-- 发光背景层 -->
      <div class="glowing-input__glow-bg"></div>

      <!-- 输入元素 -->
      <input
        ref="inputRef"
        v-model="internalValue"
        :type="computedType"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :autocomplete="autocomplete"
        class="glowing-input__field"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @change="handleChange"
        @keydown="handleKeydown"
      />

      <!-- 浮动标签 -->
      <label
        v-if="label"
        :class="[
          'glowing-input__label',
          {
            'glowing-input__label--float': isFloating || internalValue
          }
        ]"
      >
        {{ label }}
      </label>

      <!-- 聚焦指示线 -->
      <div class="glowing-input__indicator"></div>
    </div>

    <!-- 后缀插槽 -->
    <div v-if="$slots.suffix || showPasswordToggle" class="glowing-input__suffix">
      <!-- 密码显示切换 -->
      <button
        v-if="showPasswordToggle"
        type="button"
        class="glowing-input__toggle"
        @click="togglePasswordVisibility"
        tabindex="-1"
      >
        <Icon :icon="passwordVisible ? 'ion:eye-off-outline' : 'ion:eye-outline'" width="18" height="18" />
      </button>
      <slot name="suffix"></slot>
    </div>

    <!-- 错误提示 -->
    <transition name="glowing-input__error">
      <div v-if="error" class="glowing-input__error-message">
        <Icon icon="ion:alert-circle-outline" width="14" height="14" />
        <span>{{ error }}</span>
      </div>
    </transition>

    <!-- 成功提示 -->
    <transition name="glowing-input__success">
      <div v-if="success && !error" class="glowing-input__success-message">
        <Icon icon="ion:checkmark-circle-outline" width="14" height="14" />
        <span>{{ success }}</span>
      </div>
    </transition>

    <!-- 字符计数 -->
    <div v-if="showCharCount && maxlength" class="glowing-input__char-count">
      {{ internalValue.length }} / {{ maxlength }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';

// Props定义
interface Props {
  modelValue?: string | number;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  readonly?: boolean;
  error?: string;
  success?: string;
  maxlength?: number;
  showCharCount?: boolean;
  showPasswordToggle?: boolean;
  autocomplete?: string;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  label: '',
  disabled: false,
  readonly: false,
  maxlength: undefined,
  showCharCount: false,
  showPasswordToggle: false,
  autocomplete: 'off',
  size: 'medium'
});

// Emits定义
const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  'focus': [event: FocusEvent];
  'blur': [event: FocusEvent];
  'input': [event: Event];
  'change': [event: Event];
  'keydown': [event: KeyboardEvent];
}>();

// 响应式状态
const inputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);
const passwordVisible = ref(false);
const isFloating = ref(false);

// 计算属性
const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value ?? '')
});

const computedType = computed(() => {
  if (props.type === 'password' && passwordVisible.value) {
    return 'text';
  }
  return props.type;
});

// 方法
const handleFocus = (event: FocusEvent) => {
  isFocused.value = true;
  isFloating.value = true;
  emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false;
  if (!props.label || !props.modelValue) {
    isFloating.value = false;
  }
  emit('blur', event);
};

const handleInput = (event: Event) => {
  emit('input', event);
};

const handleChange = (event: Event) => {
  emit('change', event);
};

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event);
};

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value;
};

const handleContainerClick = () => {
  inputRef.value?.focus();
};

const focus = () => {
  inputRef.value?.focus();
};

const blur = () => {
  inputRef.value?.blur();
};

const select = () => {
  inputRef.value?.select();
};

// 暴露方法给父组件
defineExpose({
  focus,
  blur,
  select,
  inputRef
});

// 监听modelValue变化，保持浮动状态
watch(() => props.modelValue, (val) => {
  if (val || isFocused.value) {
    isFloating.value = true;
  }
});
</script>

<style scoped>
/* 发光输入框基础样式 */
.glowing-input {
  --input-height: 44px;
  --input-padding-x: 16px;
  --input-padding-y: 12px;
  --input-border-radius: var(--radius-lg, 12px);
  --input-font-size: var(--text-sm, 14px);
  --input-transition: var(--transition-normal, 250ms cubic-bezier(0.4, 0, 0.2, 1));

  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  width: 100%;
  min-height: var(--input-height);
  font-family: var(--font-family, inherit);
  cursor: text;
}

/* 尺寸变体 */
.glowing-input--with-prefix .glowing-input__wrapper {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.glowing-input--with-suffix .glowing-input__wrapper {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.glowing-input--small {
  --input-height: 36px;
  --input-padding-x: 12px;
  --input-padding-y: 8px;
  --input-font-size: var(--text-xs, 12px);
}

.glowing-input--medium {
  --input-height: 44px;
  --input-padding-x: 16px;
  --input-padding-y: 12px;
  --input-font-size: var(--text-sm, 14px);
}

.glowing-input--large {
  --input-height: 52px;
  --input-padding-x: 20px;
  --input-padding-y: 16px;
  --input-font-size: var(--text-base, 16px);
}

/* 输入框包装器 */
.glowing-input__wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  min-height: var(--input-height);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--input-border-radius);
  transition: all var(--input-transition);
  overflow: hidden;
}

/* 聚焦状态边框 */
.glowing-input--focused .glowing-input__wrapper {
  border-color: var(--primary-start, #5E72EB);
  box-shadow:
    0 0 0 3px rgba(94, 114, 235, 0.15),
    0 0 20px rgba(94, 114, 235, 0.2);
}

/* 错误状态 */
.glowing-input--error .glowing-input__wrapper {
  border-color: var(--error-color, #ff4d4f);
  box-shadow:
    0 0 0 3px rgba(255, 77, 79, 0.15),
    0 0 20px rgba(255, 77, 79, 0.2);
}

/* 成功状态 */
.glowing-input--success .glowing-input__wrapper {
  border-color: var(--success-color, #52c41a);
  box-shadow:
    0 0 0 3px rgba(82, 196, 26, 0.15),
    0 0 20px rgba(82, 196, 26, 0.2);
}

/* 禁用状态 */
.glowing-input--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.glowing-input--disabled .glowing-input__wrapper {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 发光背景层 */
.glowing-input__glow-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity var(--input-transition);
  pointer-events: none;
}

.glowing-input--focused .glowing-input__glow-bg {
  opacity: 1;
}

.glowing-input--error .glowing-input__glow-bg {
  background: var(--gradient-danger);
  opacity: 1;
}

.glowing-input--success .glowing-input__glow-bg {
  background: var(--gradient-success);
  opacity: 1;
}

/* 输入字段 */
.glowing-input__field {
  flex: 1;
  width: 100%;
  height: var(--input-height);
  padding: var(--input-padding-y) var(--input-padding-x);
  padding-top: 20px;
  font-size: var(--input-font-size);
  font-family: var(--font-family, inherit);
  color: var(--text-primary, rgba(255, 255, 255, 0.95));
  background: transparent;
  border: none;
  outline: none;
  transition: all var(--input-transition);
}

.glowing-input__field::placeholder {
  color: var(--text-tertiary, rgba(255, 255, 255, 0.5));
  transition: color var(--input-transition);
}

.glowing-input__field:disabled {
  cursor: not-allowed;
}

/* 浮动标签 */
.glowing-input__label {
  position: absolute;
  top: 50%;
  left: var(--input-padding-x);
  transform: translateY(-50%);
  font-size: var(--input-font-size);
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  pointer-events: none;
  transition: all var(--input-transition);
}

.glowing-input__label--float {
  top: 10px;
  transform: translateY(0);
  font-size: 11px;
  font-weight: var(--font-medium, 500);
  color: var(--primary-start, #5E72EB);
  letter-spacing: 0.5px;
}

.glowing-input--focused .glowing-input__label {
  color: var(--primary-start, #5E72EB);
}

.glowing-input--error .glowing-input__label {
  color: var(--error-color, #ff4d4f);
}

/* 聚焦指示线 */
.glowing-input__indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--gradient-primary);
  border-radius: 1px;
  transform: translateX(-50%);
  transition: width var(--input-transition);
  pointer-events: none;
}

.glowing-input--focused .glowing-input__indicator {
  width: 100%;
}

/* 前缀 */
.glowing-input__prefix {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--input-height);
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-right: none;
  border-radius: var(--input-border-radius) 0 0 var(--input-border-radius);
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  transition: all var(--input-transition);
}

.glowing-input--focused .glowing-input__prefix {
  border-color: var(--primary-start, #5E72EB);
}

/* 后缀 */
.glowing-input__suffix {
  display: flex;
  align-items: center;
  height: var(--input-height);
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-left: none;
  border-radius: 0 var(--input-border-radius) var(--input-border-radius) 0;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  transition: all var(--input-transition);
}

.glowing-input--focused .glowing-input__suffix {
  border-color: var(--primary-start, #5E72EB);
}

/* 密码切换按钮 */
.glowing-input__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm, 6px);
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  cursor: pointer;
  transition: all var(--input-transition);
}

.glowing-input__toggle:hover {
  color: var(--text-primary, rgba(255, 255, 255, 0.95));
  background: rgba(255, 255, 255, 0.1);
}

.glowing-input__toggle:active {
  background: rgba(255, 255, 255, 0.15);
}

/* 错误提示 */
.glowing-input__error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-top: 6px;
  padding: 0 4px;
  font-size: 12px;
  color: var(--error-color, #ff4d4f);
}

.glowing-input__error-enter-active,
.glowing-input__error-leave-active {
  transition: all var(--input-transition);
}

.glowing-input__error-enter-from,
.glowing-input__error-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 成功提示 */
.glowing-input__success-message {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-top: 6px;
  padding: 0 4px;
  font-size: 12px;
  color: var(--success-color, #52c41a);
}

.glowing-input__success-enter-active,
.glowing-input__success-leave-active {
  transition: all var(--input-transition);
}

.glowing-input__success-enter-from,
.glowing-input__success-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 字符计数 */
.glowing-input__char-count {
  position: absolute;
  right: 4px;
  bottom: 4px;
  font-size: 11px;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.5));
}

/* 悬停效果（未聚焦时） */
.glowing-input:not(.glowing-input--disabled):not(.glowing-input--focused):hover .glowing-input__wrapper {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 浅色主题适配 */
.light-theme .glowing-input__wrapper {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.12);
}

.light-theme .glowing-input:not(.glowing-input--disabled):not(.glowing-input--focused):hover .glowing-input__wrapper {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.18);
}

.light-theme .glowing-input__field {
  color: rgba(0, 0, 0, 0.95);
}

.light-theme .glowing-input__field::placeholder {
  color: rgba(0, 0, 0, 0.45);
}

.light-theme .glowing-input__prefix,
.light-theme .glowing-input__suffix {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.12);
}

.light-theme .glowing-input__label {
  color: rgba(0, 0, 0, 0.65);
}
</style>
