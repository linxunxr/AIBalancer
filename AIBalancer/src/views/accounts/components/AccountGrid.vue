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
.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

@media (max-width: 768px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
}
</style>
