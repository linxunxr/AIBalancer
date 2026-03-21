<template>
  <div class="account-grid">
    <AccountCardItem
      v-for="account in data"
      :key="account.id"
      :account="account"
      :selected="selectedKeys.has(account.id)"
      :mode="mode"
      @select="handleSelect"
      @detail="emit('detail', $event)"
      @edit="emit('edit', $event)"
      @toggle="emit('toggle', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Account } from '../../../models/entities/Account';
import AccountCardItem from './AccountCardItem.vue';

// Props
interface Props {
  data: Account[];
  selectedKeys: Set<string>;
  mode?: 'grid' | 'card';
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'grid'
});

// Emits
const emit = defineEmits<{
  'update:selectedKeys': [keys: Set<string>];
  'detail': [account: Account];
  'edit': [account: Account];
  'toggle': [id: string];
  'delete': [account: Account];
}>();

// 处理选择
function handleSelect(id: string) {
  const newKeys = new Set(props.selectedKeys);
  if (newKeys.has(id)) {
    newKeys.delete(id);
  } else {
    newKeys.add(id);
  }
  emit('update:selectedKeys', newKeys);
}
</script>

<style scoped>
/* 玻璃拟态网格容器 */
.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-lg);
  padding: var(--space-md);
}

/* 网格卡片动画 */
.account-grid > * {
  animation: fadeSlideIn 0.3s ease-out forwards;
  opacity: 0;
}

.account-grid > *:nth-child(1) { animation-delay: 0.05s; }
.account-grid > *:nth-child(2) { animation-delay: 0.1s; }
.account-grid > *:nth-child(3) { animation-delay: 0.15s; }
.account-grid > *:nth-child(4) { animation-delay: 0.2s; }
.account-grid > *:nth-child(5) { animation-delay: 0.25s; }
.account-grid > *:nth-child(6) { animation-delay: 0.3s; }

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .account-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
    padding: var(--space-sm);
  }
}
</style>
