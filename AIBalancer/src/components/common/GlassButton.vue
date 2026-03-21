<template>
  <button
    :class="[
      'glass-button',
      `glass-button--${type}`,
      `glass-button--${size}`,
      { 'glass-button--disabled': disabled, 'glass-button--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
    @mousedown="handleMouseDown"
  >
    <span v-if="loading" class="glass-button__spinner">
      <span class="glass-button__spinner-ring"></span>
    </span>
    <span v-if="icon && !loading && !$slots.icon" :class="['glass-button__icon', `icon-${iconPosition}`]">
      <slot name="icon"></slot>
    </span>
    <span class="glass-button__content">
      <slot></slot>
    </span>
    <span class="glass-button__shimmer"></span>
  </button>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface Props {
  type?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: boolean;
  iconPosition?: 'left' | 'right';
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  icon: false,
  iconPosition: 'left',
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};

const handleMouseDown = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    const button = event.currentTarget as HTMLElement;
    const ripple = document.createElement('span');
    ripple.className = 'glass-button__ripple';

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
};
</script>

<style scoped>
/* 玻璃按钮基础样式 */
.glass-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-family);
  font-weight: var(--font-medium);
  border: none;
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-normal);
  outline: none;
}

/* 尺寸变体 */
.glass-button--small {
  height: 32px;
  padding: 0 12px;
  font-size: var(--text-xs);
  border-radius: 16px;
}

.glass-button--medium {
  height: 40px;
  padding: 0 20px;
  font-size: var(--text-sm);
  border-radius: 20px;
}

.glass-button--large {
  height: 48px;
  padding: 0 28px;
  font-size: var(--text-base);
  border-radius: 24px;
}

/* 主要按钮 - 渐变玻璃 */
.glass-button--primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: var(--shadow-glass);
}

.glass-button--primary:hover:not(:disabled) {
  box-shadow: var(--shadow-glass-hover), var(--glow-primary);
  transform: translateY(-2px);
}

.glass-button--primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-glass-active);
}

/* 次要按钮 - 玻璃边框 */
.glass-button--secondary {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
}

.glass-button--secondary:hover:not(:disabled) {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-glass-hover);
  transform: translateY(-2px);
}

.glass-button--secondary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-glass-active);
}

/* 幽灵按钮 - 透明背景 */
.glass-button--ghost {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-primary);
}

.glass-button--ghost:hover:not(:disabled) {
  background: var(--glass-bg);
  border-color: var(--glass-border);
}

.glass-button--ghost:active:not(:disabled) {
  background: var(--glass-bg-active);
}

/* 强调按钮 - 青色渐变 */
.glass-button--accent {
  background: var(--gradient-accent);
  color: white;
  box-shadow: var(--shadow-glass);
}

.glass-button--accent:hover:not(:disabled) {
  box-shadow: var(--shadow-glass-hover), var(--glow-accent);
  transform: translateY(-2px);
}

.glass-button--accent:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-glass-active);
}

/* 成功按钮 */
.glass-button--success {
  background: var(--gradient-success);
  color: white;
  box-shadow: var(--shadow-glass);
}

.glass-button--success:hover:not(:disabled) {
  box-shadow: var(--shadow-glass-hover), var(--glow-success);
  transform: translateY(-2px);
}

.glass-button--success:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-glass-active);
}

/* 危险按钮 */
.glass-button--danger {
  background: var(--gradient-danger);
  color: white;
  box-shadow: var(--shadow-glass);
}

.glass-button--danger:hover:not(:disabled) {
  box-shadow: var(--shadow-glass-hover), var(--glow-danger);
  transform: translateY(-2px);
}

.glass-button--danger:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-glass-active);
}

/* 禁用状态 */
.glass-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 加载状态 */
.glass-button--loading {
  cursor: wait;
  pointer-events: none;
}

.glass-button--loading .glass-button__content {
  opacity: 0.7;
}

/* 涟漪效果 */
.glass-button__ripple {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  transform: scale(0);
  animation: ripple-effect 0.6s linear;
  pointer-events: none;
}

@keyframes ripple-effect {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* 光泽扫过效果 */
.glass-button__shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.25),
    transparent
  );
  transition: left 0.5s ease;
  pointer-events: none;
}

.glass-button:hover .glass-button__shimmer {
  left: 100%;
}

/* 加载指示器 */
.glass-button__spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.glass-button__spinner-ring {
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 图标样式 */
.glass-button__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.glass-button__icon.icon-left {
  order: -1;
}

.glass-button__icon.icon-right {
  order: 1;
}

/* 内容 */
.glass-button__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
