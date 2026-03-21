<template>
  <div class="account-table">
    <!-- 顶部工具栏 -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <n-button type="primary" size="small" @click="emit('add')">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加账户
        </n-button>
        <n-button
          size="small"
          :disabled="selectedKeys.size === 0"
          @click="emit('batchRefresh')"
        >
          批量刷新
        </n-button>
        <n-button
          size="small"
          type="error"
          :disabled="selectedKeys.size === 0"
          @click="emit('batchDelete')"
        >
          批量删除
        </n-button>
        <n-tag v-if="selectedKeys.size > 0" type="info" size="small">
          已选 {{ selectedKeys.size }} 项
        </n-tag>
      </div>
      <div class="toolbar-right">
        <n-button size="small" quaternary @click="emit('refresh')">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <n-data-table
      :columns="columns"
      :data="data"
      :loading="loading"
      :row-key="(row: Account) => row.id"
      :checked-row-keys="Array.from(selectedKeys)"
      :pagination="paginationConfig"
      :scroll-x="1100"
      striped
      size="small"
      @update:checked-row-keys="handleCheck"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { h, computed } from 'vue';
import {
  NDataTable,
  NTag,
  NButton,
  NSpace,
  NSwitch,
  NIcon,
  type DataTableColumns,
  type PaginationProps
} from 'naive-ui';
import { AddOutline, RefreshOutline } from '@vicons/ionicons5';
import type { Account } from '../../../models/entities/Account';
import {
  AccountStatus,
  getStatusLabel,
  getTypeLabel,
  getStatusTagType
} from '../../../models/entities/Account';

// Props
interface Props {
  data: Account[];
  loading: boolean;
  selectedKeys: Set<string>;
  page?: number;
  pageSize?: number;
  total?: number;
}

const props = withDefaults(defineProps<Props>(), {
  page: 1,
  pageSize: 20,
  total: 0
});

// Emits
const emit = defineEmits<{
  'update:selectedKeys': [keys: Set<string>];
  'update:page': [page: number];
  'update:pageSize': [size: number];
  'add': [];
  'refresh': [];
  'batchRefresh': [];
  'batchDelete': [];
  'detail': [account: Account];
  'edit': [account: Account];
  'refreshBalance': [id: string];
  'test': [id: string];
  'toggle': [id: string];
  'delete': [account: Account];
}>();

// 格式化函数
function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

function formatBalance(balance: number, currency: string): string {
  return `${currency} ${balance.toFixed(2)}`;
}

// 表格列
const columns: DataTableColumns<Account> = [
  {
    type: 'selection'
  },
  {
    title: '账户名称',
    key: 'name',
    width: 180,
    ellipsis: {
      tooltip: true
    },
    render(row) {
      return h('div', { class: 'account-name-cell' }, [
        h('span', { class: 'name' }, row.name),
        row.metadata.tags.length > 0
          ? h(NTag, { size: 'small', type: 'info', bordered: false, style: 'margin-left: 8px' }, {
              default: () => row.metadata.tags[0]
            })
          : null
      ]);
    }
  },
  {
    title: '平台类型',
    key: 'type',
    width: 100,
    render(row) {
      return h(NTag, { size: 'small', bordered: false }, {
        default: () => getTypeLabel(row.type)
      });
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    sorter: true,
    render(row) {
      return h(NTag, {
        type: getStatusTagType(row.status),
        size: 'small'
      }, {
        default: () => getStatusLabel(row.status)
      });
    }
  },
  {
    title: '当前余额',
    key: 'currentBalance',
    width: 120,
    sorter: true,
    render(row) {
      return h('span', { class: 'balance-value' }, formatBalance(row.currentBalance, row.currency));
    }
  },
  {
    title: '使用量',
    key: 'usage',
    width: 100,
    sorter: (a, b) => a.usage.totalTokens - b.usage.totalTokens,
    render(row) {
      return formatTokens(row.usage.totalTokens);
    }
  },
  {
    title: '最后使用',
    key: 'lastUsed',
    width: 100,
    sorter: (a, b) => new Date(a.usage.lastUsed).getTime() - new Date(b.usage.lastUsed).getTime(),
    render(row) {
      return formatDate(row.usage.lastUsed);
    }
  },
  {
    title: '启用',
    key: 'enabled',
    width: 70,
    render(row) {
      return h(NSwitch, {
        value: row.status === AccountStatus.ACTIVE,
        size: 'small',
        onUpdateValue: () => emit('toggle', row.id)
      });
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right',
    render(row) {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, {
            size: 'tiny',
            onClick: () => emit('detail', row)
          }, { default: () => '详情' }),
          h(NButton, {
            size: 'tiny',
            onClick: () => emit('edit', row)
          }, { default: () => '编辑' }),
          h(NButton, {
            size: 'tiny',
            onClick: () => emit('refreshBalance', row.id)
          }, { default: () => '刷新' }),
          h(NButton, {
            size: 'tiny',
            type: 'error',
            onClick: () => emit('delete', row)
          }, { default: () => '删除' })
        ]
      });
    }
  }
];

// 分页配置
const paginationConfig = computed<PaginationProps>(() => ({
  page: props.page,
  pageSize: props.pageSize,
  itemCount: props.total || props.data.length,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  showQuickJumper: true,
  prefix: ({ itemCount }) => `共 ${itemCount} 个账户`
}));

// 事件处理
function handleCheck(keys: Array<string | number>) {
  emit('update:selectedKeys', new Set(keys as string[]));
}

function handlePageChange(page: number) {
  emit('update:page', page);
}

function handlePageSizeChange(size: number) {
  emit('update:pageSize', size);
}
</script>

<style scoped>
/* 玻璃拟态表格容器 */
.account-table {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg, 16px);
  border: 1px solid var(--glass-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-md);
}

/* 表格工具栏 */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-name-cell {
  display: flex;
  align-items: center;
}

.account-name-cell .name {
  font-weight: 600;
  background: linear-gradient(135deg, var(--text-primary), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.balance-value {
  background: linear-gradient(135deg, #ffc107, #ff9800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  font-family: 'SF Mono', 'Monaco', monospace;
}

/* 覆盖Naive UI表格样式 */
:deep(.n-data-table) {
  --n-th-color: rgba(255, 255, 255, 0.03) !important;
  --n-td-color: rgba(255, 255, 255, 0.01) !important;
  --n-th-text-color: var(--text-secondary) !important;
  --n-td-text-color: var(--text-primary) !important;
  --n-border-color: rgba(255, 255, 255, 0.05) !important;
  --n-th-color-hover: rgba(255, 255, 255, 0.05) !important;
  --n-td-color-hover: rgba(255, 255, 255, 0.03) !important;
}

:deep(.n-data-table-th) {
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px !important;
}

:deep(.n-data-table-td) {
  padding: 14px 16px !important;
  font-size: 14px;
}

:deep(.n-data-table-tr--striped .n-data-table-td) {
  background: rgba(255, 255, 255, 0.01) !important;
}

:deep(.n-data-table-tr:hover .n-data-table-td) {
  background: rgba(94, 114, 235, 0.05) !important;
}

:deep(.n-checkbox) {
  --n-border: 1px solid var(--glass-border);
  --n-border-checked: var(--primary-color);
}

:deep(.n-checkbox--checked) {
  background: var(--gradient-primary);
  border-color: transparent;
}

:deep(.n-button) {
  transition: all var(--transition-normal);
}

:deep(.n-button:hover) {
  transform: translateY(-1px);
}

:deep(.n-button[type="primary"]) {
  background: var(--gradient-primary) !important;
  border-color: transparent !important;
  box-shadow: var(--glow-primary);
}

:deep(.n-button[type="primary"]:hover) {
  box-shadow: 0 4px 15px rgba(94, 114, 235, 0.4);
}

:deep(.n-button--error-type) {
  background: rgba(239, 68, 68, 0.1) !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
}

:deep(.n-button--error-type:hover) {
  background: rgba(239, 68, 68, 0.2) !important;
}

:deep(.n-switch) {
  --n-rail-color: rgba(255, 255, 255, 0.1);
  --n-rail-color-active: var(--gradient-primary);
}

:deep(.n-tag) {
  background: rgba(94, 114, 235, 0.1);
  border: 1px solid rgba(94, 114, 235, 0.3);
  border-radius: var(--radius-sm, 6px);
}

:deep(.n-pagination) {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

:deep(.n-pagination-item) {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm, 8px);
}

:deep(.n-pagination-item--active) {
  background: var(--gradient-primary) !important;
  border-color: transparent !important;
  box-shadow: var(--glow-primary);
}

:deep(.n-select) {
  --n-color: rgba(255, 255, 255, 0.05) !important;
  --n-border: 1px solid var(--glass-border) !important;
}
</style>
