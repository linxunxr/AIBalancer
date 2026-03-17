<template>
  <AppLayout />
</template>

<script setup lang="ts">
import AppLayout from './views/layout/AppLayout.vue';
</script>

<style>
* {
  box-sizing: border-box;
}

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

:root {
  --color-bg-1: #ffffff;
  --color-bg-2: #f5f7fa;
  --color-border: #e8e8e8;
  --color-text-1: rgba(0, 0, 0, 0.9);
  --color-text-2: rgba(0, 0, 0, 0.6);
  --color-text-3: rgba(0, 0, 0, 0.4);
  --color-primary: #1890ff;
  --color-primary-3: rgba(24, 144, 255, 0.1);
}
</style>
