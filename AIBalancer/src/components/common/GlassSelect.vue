<template>
  <div
    ref="containerRef"
    :class="[
      'glass-select',
      {
        'glass-select--focused': isOpen,
        'glass-select--disabled': disabled,
        'glass-select--error': error,
        'glass-select--multiple': multiple,
        'glass-select--expanded': isOpen
      }
    ]"
  >
    <!-- 触发器 -->
    <div
      class="glass-select__trigger"
      @click="toggleDropdown"
    >
      <!-- 发光背景 -->
      <div class="glass-select__glow-bg"></div>

      <!-- 选中值显示 -->
      <div class="glass-select__value">
        <template v-if="multiple && Array.isArray(modelValue) && modelValue.length > 0">
          <span
            v-for="(item, index) in displayValues"
            :key="index"
            class="glass-select__tag"
          >
            {{ getLabel(item) }}
            <button
              type="button"
              class="glass-select__tag-remove"
              @click.stop="removeItem(item)"
            >
              <Icon icon="ion:close" width="12" height="12" />
            </button>
          </span>
        </template>
        <template v-else-if="!multiple && selectedOption">
          <span class="glass-select__placeholder" v-if="!selectedOption">
            {{ placeholder }}
          </span>
          <span v-else>{{ getLabel(selectedOption) }}</span>
        </template>
        <span v-else class="glass-select__placeholder">
          {{ placeholder }}
        </span>
      </div>

      <!-- 箭头图标 -->
      <div class="glass-select__arrow">
        <Icon
          :icon="isOpen ? 'ion:chevron-up' : 'ion:chevron-down'"
          width="18"
          height="18"
        />
      </div>
    </div>

    <!-- 下拉面板 -->
    <transition name="glass-select__dropdown">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="glass-select__dropdown"
        :style="dropdownStyle"
      >
        <!-- 搜索框（可选项） -->
        <div v-if="filterable" class="glass-select__search">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="glass-select__search-input"
            @click.stop
          />
        </div>

        <!-- 选项列表 -->
        <div class="glass-select__options" :style="optionsStyle">
          <div
            v-for="(option, index) in filteredOptions"
            :key="getValue(option)"
            :class="[
              'glass-select__option',
              {
                'glass-select__option--selected': isSelected(option),
                'glass-select__option--highlighted': highlightedIndex === index
              }
            ]"
            @click.stop="selectOption(option)"
            @mouseenter="highlightedIndex = index"
          >
            <!-- 多选复选框 -->
            <div v-if="multiple" class="glass-select__checkbox">
              <Icon
                v-if="isSelected(option)"
                icon="ion:checkbox"
                width="18"
                height="18"
                color="var(--primary-start)"
              />
              <Icon
                v-else
                icon="ion:square-outline"
                width="18"
                height="18"
              />
            </div>

            <!-- 选项内容 -->
            <div class="glass-select__option-content">
              <span class="glass-select__option-label">{{ getLabel(option) }}</span>
              <span v-if="getDescription" class="glass-select__option-desc">
                {{ getDescription(option) }}
              </span>
            </div>

            <!-- 选中图标 -->
            <Icon
              v-if="!multiple && isSelected(option)"
              icon="ion:checkmark"
              width="18"
              height="18"
              color="var(--primary-start)"
              class="glass-select__check-icon"
            />
          </div>

          <!-- 空状态 -->
          <div v-if="filteredOptions.length === 0" class="glass-select__empty">
            <Icon icon="ion:search-outline" width="32" height="32" />
            <span>{{ emptyText }}</span>
          </div>
        </div>

        <!-- 底部插槽 -->
        <div v-if="$slots.footer" class="glass-select__footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </transition>

    <!-- 错误提示 -->
    <transition name="glass-select__error">
      <div v-if="error" class="glass-select__error-message">
        <Icon icon="ion:alert-circle-outline" width="14" height="14" />
        <span>{{ error }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';

interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
  [key: string]: any;
}

interface Props {
  modelValue?: string | number | (string | number)[] | null;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  error?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  maxHeight?: number;
  valueKey?: string;
  labelKey?: string;
  descriptionKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  options: () => [],
  placeholder: '请选择',
  disabled: false,
  multiple: false,
  filterable: false,
  searchable: false,
  clearable: false,
  emptyText: '无匹配选项',
  searchPlaceholder: '搜索...',
  maxHeight: 300,
  valueKey: 'value',
  labelKey: 'label',
  descriptionKey: 'description'
});

const emit = defineEmits<{
  'update:modelValue': [value: any];
  'change': [value: any, option?: SelectOption];
  'focus': [];
  'blur': [];
  'search': [query: string];
  'clear': [];
}>();

// 状态
const containerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const searchQuery = ref('');
const highlightedIndex = ref(-1);
const dropdownPosition = ref({ top: 0, left: 0, width: 0 });

// 计算属性
const selectedOption = computed(() => {
  if (!props.modelValue || props.multiple) return null;
  return props.options.find(opt => getValue(opt) === props.modelValue) || null;
});

const displayValues = computed(() => {
  if (!props.multiple || !Array.isArray(props.modelValue)) return [];
  return props.modelValue.map(val =>
    props.options.find(opt => getValue(opt) === val)
  ).filter(Boolean);
});

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;
  const query = searchQuery.value.toLowerCase();
  return props.options.filter(opt => {
    const label = getLabel(opt).toLowerCase();
    const desc = getDescription(opt)?.toLowerCase() || '';
    return label.includes(query) || desc.includes(query);
  });
});

const optionsStyle = computed(() => ({
  maxHeight: `${props.maxHeight}px`
}));

const dropdownStyle = computed(() => ({
  top: `${dropdownPosition.value.top}px`,
  left: `${dropdownPosition.value.left}px`,
  width: `${dropdownPosition.value.width}px`
}));

// 方法
const getValue = (option: SelectOption): string | number => {
  return option[props.valueKey] ?? option.value;
};

const getLabel = (option: SelectOption | null | undefined): string => {
  if (!option) return '';
  return option[props.labelKey] ?? option.label ?? '';
};

const getDescription = (option: SelectOption): string => {
  return option[props.descriptionKey] ?? option.description ?? '';
};

const isSelected = (option: SelectOption): boolean => {
  const value = getValue(option);
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(value);
  }
  return props.modelValue === value;
};

const selectOption = (option: SelectOption) => {
  if (option.disabled) return;

  const value = getValue(option);

  if (props.multiple) {
    const currentValue = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValue.indexOf(value);

    if (index > -1) {
      currentValue.splice(index, 1);
    } else {
      currentValue.push(value);
    }

    emit('update:modelValue', currentValue);
    emit('change', currentValue, option);
  } else {
    emit('update:modelValue', value);
    emit('change', value, option);
    closeDropdown();
  }
};

const removeItem = (option: SelectOption) => {
  const value = getValue(option);
  if (Array.isArray(props.modelValue)) {
    const newValue = props.modelValue.filter(v => v !== value);
    emit('update:modelValue', newValue);
    emit('change', newValue, option);
  }
};

const toggleDropdown = () => {
  if (props.disabled) return;

  if (isOpen.value) {
    closeDropdown();
  } else {
    openDropdown();
  }
};

const openDropdown = () => {
  isOpen.value = true;
  highlightedIndex.value = -1;
  searchQuery.value = '';
  updateDropdownPosition();

  nextTick(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('scroll', updateDropdownPosition, true);
  });

  emit('focus');
};

const closeDropdown = () => {
  isOpen.value = false;
  searchQuery.value = '';

  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('scroll', updateDropdownPosition, true);

  emit('blur');
};

const updateDropdownPosition = () => {
  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  // 默认显示在下方
  dropdownPosition.value = {
    top: rect.height + 4,
    left: 0,
    width: rect.width
  };

  // 如果下方空间不够，尝试显示在上方
  if (spaceBelow < props.maxHeight + 100 && spaceAbove > spaceBelow) {
    dropdownPosition.value.top = -props.maxHeight - 8;
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node)
  ) {
    closeDropdown();
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      openDropdown();
    }
    return;
  }

  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      closeDropdown();
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (highlightedIndex.value < filteredOptions.value.length - 1) {
        highlightedIndex.value++;
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (highlightedIndex.value > 0) {
        highlightedIndex.value--;
      }
      break;
    case 'Enter':
      event.preventDefault();
      if (highlightedIndex.value >= 0 && filteredOptions.value[highlightedIndex.value]) {
        selectOption(filteredOptions.value[highlightedIndex.value]);
      }
      break;
  }
};

// 监听搜索
watch(searchQuery, (query) => {
  emit('search', query);
});

// 监听modelValue变化
watch(() => props.modelValue, () => {
  highlightedIndex.value = -1;
});

// 键盘事件
onMounted(() => {
  containerRef.value?.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('scroll', updateDropdownPosition, true);
  containerRef.value?.removeEventListener('keydown', handleKeydown);
});

// 暴露方法
defineExpose({
  open: openDropdown,
  close: closeDropdown,
  focus: openDropdown
});
</script>

<style scoped>
/* 玻璃选择器基础样式 */
.glass-select {
  --select-height: 44px;
  --select-padding-x: 16px;
  --select-border-radius: var(--radius-lg, 12px);
  --select-font-size: var(--text-sm, 14px);
  --select-transition: var(--transition-normal, 250ms cubic-bezier(0.4, 0, 0.2, 1));

  position: relative;
  display: block;
  width: 100%;
  font-family: var(--font-family, inherit);
}

/* 触发器 */
.glass-select__trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: var(--select-height);
  padding: 0 var(--select-padding-x);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--select-border-radius);
  cursor: pointer;
  transition: all var(--select-transition);
  overflow: hidden;
}

.glass-select--focused .glass-select__trigger {
  border-color: var(--primary-start, #5E72EB);
  box-shadow:
    0 0 0 3px rgba(94, 114, 235, 0.15),
    0 0 20px rgba(94, 114, 235, 0.2);
}

.glass-select--error .glass-select__trigger {
  border-color: var(--error-color, #ff4d4f);
  box-shadow:
    0 0 0 3px rgba(255, 77, 79, 0.15),
    0 0 20px rgba(255, 77, 79, 0.2);
}

.glass-select--disabled .glass-select__trigger {
  cursor: not-allowed;
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 发光背景 */
.glass-select__glow-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity var(--select-transition);
}

.glass-select--focused .glass-select__glow-bg {
  opacity: 1;
}

/* 选中值 */
.glass-select__value {
  flex: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.glass-select__placeholder {
  color: var(--text-tertiary, rgba(255, 255, 255, 0.5));
}

/* 标签 */
.glass-select__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(94, 114, 235, 0.2);
  border: 1px solid rgba(94, 114, 235, 0.3);
  border-radius: var(--radius-sm, 6px);
  font-size: 12px;
  color: var(--primary-start, #5E72EB);
  white-space: nowrap;
}

.glass-select__tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: inherit;
  cursor: pointer;
  transition: all var(--select-transition);
}

.glass-select__tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 箭头 */
.glass-select__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  transition: transform var(--select-transition);
}

.glass-select--expanded .glass-select__arrow {
  color: var(--primary-start, #5E72EB);
}

/* 下拉面板 */
.glass-select__dropdown {
  position: absolute;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--select-border-radius);
  box-shadow: var(--shadow-glass-hover, 0 12px 40px rgba(0, 0, 0, 0.35));
  overflow: hidden;
  pointer-events: auto;
}

/* 下拉动画 */
.glass-select__dropdown-enter-active,
.glass-select__dropdown-leave-active {
  transition: all var(--select-transition);
}

.glass-select__dropdown-enter-from,
.glass-select__dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 搜索框 */
.glass-select__search {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-select__search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: var(--select-font-size);
  font-family: var(--font-family, inherit);
  color: var(--text-primary, rgba(255, 255, 255, 0.95));
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md, 8px);
  outline: none;
  transition: all var(--select-transition);
}

.glass-select__search-input::placeholder {
  color: var(--text-tertiary, rgba(255, 255, 255, 0.5));
}

.glass-select__search-input:focus {
  border-color: var(--primary-start, #5E72EB);
  box-shadow: 0 0 0 2px rgba(94, 114, 235, 0.15);
}

/* 选项列表 */
.glass-select__options {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.glass-select__options::-webkit-scrollbar {
  width: 6px;
}

.glass-select__options::-webkit-scrollbar-track {
  background: transparent;
}

.glass-select__options::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

/* 选项 */
.glass-select__option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all var(--select-transition);
}

.glass-select__option:hover,
.glass-select__option--highlighted {
  background: rgba(255, 255, 255, 0.1);
}

.glass-select__option--selected {
  background: rgba(94, 114, 235, 0.15);
}

.glass-select__option--selected:hover {
  background: rgba(94, 114, 235, 0.2);
}

.glass-select__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 复选框 */
.glass-select__checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
}

/* 选项内容 */
.glass-select__option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.glass-select__option-label {
  font-size: var(--select-font-size);
  color: var(--text-primary, rgba(255, 255, 255, 0.95));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.glass-select__option-desc {
  font-size: 12px;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.5));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 选中图标 */
.glass-select__check-icon {
  flex-shrink: 0;
  margin-left: auto;
}

/* 空状态 */
.glass-select__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.5));
  font-size: 14px;
}

/* 底部插槽 */
.glass-select__footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 错误提示 */
.glass-select__error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 0 4px;
  font-size: 12px;
  color: var(--error-color, #ff4d4f);
}

.glass-select__error-enter-active,
.glass-select__error-leave-active {
  transition: all var(--select-transition);
}

.glass-select__error-enter-from,
.glass-select__error-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 悬停效果 */
.glass-select:not(.glass-select--disabled):not(.glass-select--focused):hover .glass-select__trigger {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 浅色主题适配 */
.light-theme .glass-select__trigger {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.12);
}

.light-theme .glass-select:not(.glass-select--disabled):not(.glass-select--focused):hover .glass-select__trigger {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.18);
}

.light-theme .glass-select__dropdown {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0, 0, 0, 0.12);
}

.light-theme .glass-select__option:hover,
.light-theme .glass-select__option--highlighted {
  background: rgba(0, 0, 0, 0.04);
}

.light-theme .glass-select__option--selected {
  background: rgba(94, 114, 235, 0.1);
}

.light-theme .glass-select__option-label {
  color: rgba(0, 0, 0, 0.95);
}

.light-theme .glass-select__option-desc {
  color: rgba(0, 0, 0, 0.45);
}

.light-theme .glass-select__search-input {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.95);
}

.light-theme .glass-select__search-input::placeholder {
  color: rgba(0, 0, 0, 0.45);
}
</style>
