<template>
  <MainLayout @select="(key: string) => currentPage = key">
    <Dashboard v-if="currentPage === 'dashboard'" />
    <AccountManagement v-else-if="currentPage === 'accounts'" />
    <Settings v-else-if="currentPage === 'settings'" />
    <div v-else class="welcome-page">欢迎页面</div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MainLayout from './views/layout/MainLayout.vue';
import Dashboard from './views/dashboard/Dashboard.vue';
import AccountManagement from './views/accounts/AccountManagement.vue';
import Settings from './views/settings/Settings.vue';

const currentPage = ref('dashboard');
</script>

<style scoped>
.welcome-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  font-size: var(--text-xl);
}
</style>
