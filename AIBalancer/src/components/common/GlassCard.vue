<template>
  <div
    :class="[
      'glass-card',
      `glass-card--${blurLevel}`,
      {
        'glass-card--hoverable': hoverable,
        'glass-card--glow': glow,
        'glass-card--bordered': bordered
      }
    ]"
    :style="customStyle"
  >
    <!-- 发光背景层 -->
    <div v-if="glow" class="glass-card__glow-bg"></div>

    <!-- 顶部装饰条 -->
    <div v-if="accentBar" class="glass-card__accent-bar"></div>

    <!-- 头部插槽 -->
    <div v-if="$slots.header || title" class="glass-card__header">
      <slot name="header">
        <div class="glass-card__title-wrapper">
          <span v-if="icon" class="glass-card__icon">
            <slot name="icon"></slot>
          </span>
          <h3 class="glass-card__title">{{ title }}</h3>
        </div>
        <div v-if="$slots['header-extra']" class="glass-card__header-extra">
          <slot name="header-extra"></slot>
        </div>
      </slot>
    </div>

    <!-- 内容区域 -->
    <div class="glass-card__body" :style="bodyStyle">
      <slot></slot>
    </div>

    <!-- 底部插槽 -->
    <div v-if="$slots.footer" class="glass-card__footer">
      <slot name="footer"></slot>
    </div>

    <!-- 悬浮时的内发光 -->
    <div class="glass-card__inner-glow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue';

interface Props {
  title?: string;
  icon?: boolean;
  hoverable?: boolean;
  glow?: boolean;
  bordered?: boolean;
  accentBar?: boolean;
  blurLevel?: 'light' | 'medium' | 'high';
  padding?: string;
  minHeight?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: false,
  hoverable: true,
  glow: false,
  bordered: false,
  accentBar: false,
  blurLevel: 'high',
  padding: '24px',
  minHeight: 'auto',
});

const bodyStyle = computed(() => ({
  padding: props.padding,
  minHeight: props.minHeight,
}));

const customStyle = computed(() => ({
  '--card-accent-color': 'var(--primary-start)',
}));
</script>

<style scoped>
/* 玻璃卡片基础样式 */
.glass-card {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glass);
  overflow: hidden;
  transition: all var(--transition-normal);
}

/* 模糊级别变体 */
.glass-card--light {
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
}

.glass-card--medium {
  backdrop-filter: blur(var(--glass-blur-medium));
  -webkit-backdrop-filter: blur(var(--glass-blur-medium));
}

.glass-card--high {
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

/* 可悬浮变体 */
.glass-card--hoverable:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-glass-hover);
  transform: translateY(-4px);
}

/* 发光边框变体 */
.glass-card--glow {
  position: relative;
}

.glass-card--glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  background: var(--gradient-primary);
  border-radius: inherit;
  z-index: -1;
  opacity: 0;
  transition: opacity var(--transition-normal);
  filter: blur(8px);
}

.glass-card--glow:hover::before {
  opacity: 0.5;
}

.glass-card--glow:hover {
  border-color: var(--primary-start);
  box-shadow: var(--glow-primary), var(--shadow-glass-hover);
}

/* 边框变体 */
.glass-card--bordered {
  border: 1px solid var(--glass-border-hover);
}

/* 发光背景层 */
.glass-card__glow-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(
    180deg,
    rgba(94, 114, 235, 0.1) 0%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 0;
}

/* 顶部装饰条 */
.glass-card__accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
  z-index: 1;
}

/* 头部样式 */
.glass-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--glass-border);
  position: relative;
  z-index: 1;
}

.glass-card__title-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.glass-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-start);
}

.glass-card__title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.glass-card__header-extra {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 内容区域 */
.glass-card__body {
  position: relative;
  z-index: 1;
}

/* 底部样式 */
.glass-card__footer {
  padding: 16px 24px;
  border-top: 1px solid var(--glass-border);
  background: rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

/* 内发光效果 */
.glass-card__inner-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--glass-highlight),
    transparent
  );
  pointer-events: none;
  opacity: 0.5;
  transition: opacity var(--transition-normal);
}

.glass-card:hover .glass-card__inner-glow {
  opacity: 1;
}

/* 渐进式内阴影 */
.glass-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  pointer-events: none;
  opacity: 0.5;
  transition: opacity var(--transition-normal);
}

.glass-card:hover::after {
  opacity: 1;
}
</style>
