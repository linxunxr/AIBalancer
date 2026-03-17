<template>
  <div class="sidebar">
    <div class="logo">
      <h2>智衡</h2>
      <p class="subtitle">Balancer</p>
    </div>
    <nav class="nav-menu">
      <a
        v-for="item in menuItems"
        :key="item.key"
        :href="item.path"
        class="nav-item"
        :class="{ active: activeKey === item.key }"
        @click.prevent="select(item.key)"
      >
        <span class="nav-text">{{ item.label }}</span>
      </a>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface MenuItem {
  key: string;
  label: string;
  path: string;
}

const emit = defineEmits<{
  select: [key: string];
}>();

const activeKey = ref<string>('logs');

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: '仪表盘', path: '/dashboard' },
  { key: 'logs', label: '日志查看', path: '/logs' },
  { key: 'log-settings', label: '日志设置', path: '/log-settings' },
  { key: 'settings', label: '系统设置', path: '/settings' },
];

function select(key: string) {
  activeKey.value = key;
  emit('select', key);
}
</script>

<style scoped>
.sidebar {
  width: 200px;
  height: 100%;
  background: var(--color-bg-1);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 24px 16px;
  border-bottom: 1px solid var(--color-border);
}

.logo h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-1);
}

.subtitle {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: var(--color-text-3);
}

.nav-menu {
  flex: 1;
  padding: 8px 0;
}

.nav-item {
  display: block;
  padding: 12px 24px;
  color: var(--color-text-2);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--color-bg-2);
  color: var(--color-text-1);
}

.nav-item.active {
  background: var(--color-primary-3);
  color: var(--color-primary);
}

.nav-text {
  font-size: 14px;
}
</style>
