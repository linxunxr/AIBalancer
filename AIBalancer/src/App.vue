<template>
  <MainLayout @select="(key: string) => currentPage = key">
    <Dashboard v-if="currentPage === 'dashboard'" />
    <LogViewer v-else-if="currentPage === 'logs'" />
    <LogSettings v-else-if="currentPage === 'log-settings'" />
    <Settings v-else-if="currentPage === 'settings'" />
    <div v-else>欢迎页面</div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MainLayout from './views/layout/MainLayout.vue';
import Dashboard from './views/dashboard/Dashboard.vue';
import LogViewer from './views/logs/LogViewer.vue';
import LogSettings from './views/logs/LogSettings.vue';
import Settings from './views/settings/Settings.vue';

const currentPage = ref('dashboard');
</script>
