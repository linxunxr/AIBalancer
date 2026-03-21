<template>
  <div class="header">
    <div class="header-title">{{ currentTitle }}</div>
    <div class="header-actions">
      <n-button quaternary circle @click="refresh">
        <template #icon>
          <RefreshOutline />
        </template>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NButton } from 'naive-ui';
import { RefreshOutline } from '@vicons/ionicons5';

interface Props {
  currentPage: string;
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 'dashboard',
});

const pageTitles: Record<string, string> = {
  dashboard: '仪表盘',
  accounts: '账户管理',
  settings: '系统设置',
};

const currentTitle = computed(() => pageTitles[props.currentPage] || '智衡');

// 触发自定义刷新事件，让父组件处理刷新逻辑
function refresh() {
  // 派发自定义事件，让使用 Header 的组件自己处理刷新
  const event = new CustomEvent('header-refresh');
  window.dispatchEvent(event);
}
</script>

<style scoped>
.header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-1);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.header-actions {
  display: flex;
  gap: 8px;
}
</style>
