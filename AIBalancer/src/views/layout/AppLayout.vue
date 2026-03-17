<template>
  <div class="app-layout">
    <Sidebar @select="handlePageSelect" />
    <div class="main-content">
      <Header :current-page="currentPage" />
      <div class="content-area">
        <component :is="currentComponent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Sidebar from './Sidebar.vue';
import Header from './Header.vue';
import LogViewer from '../logs/LogViewer.vue';
import LogSettings from '../logs/LogSettings.vue';

const currentPage = ref<string>('logs');

const currentComponent = computed(() => {
  switch (currentPage.value) {
    case 'logs':
      return LogViewer;
    case 'log-settings':
      return LogSettings;
    default:
      return LogViewer;
  }
});

function handlePageSelect(key: string) {
  currentPage.value = key;
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg-2);
}

.content-area {
  flex: 1;
  overflow: auto;
  padding: 24px;
}
</style>
