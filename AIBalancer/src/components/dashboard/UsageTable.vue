<template>
  <div class="usage-table">
    <!-- 表格头部 -->
    <div class="table-header">
      <div class="table-title">{{ title }}</div>
      <div class="table-actions">
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索..."
          clearable
          size="small"
          style="width: 200px"
          @input="handleSearch"
        >
          <template #prefix>
            <span>🔍</span>
          </template>
        </n-input>
        <n-dropdown :options="filterOptions" @select="handleFilterSelect">
          <n-button size="small">
            筛选 ▾
          </n-button>
        </n-dropdown>
        <n-button size="small" @click="exportData">
          📥 导出
        </n-button>
      </div>
    </div>

    <!-- 当前筛选标签 -->
    <div v-if="activeFilters.length > 0" class="filter-tags">
      <n-tag
        v-for="(filter, index) in activeFilters"
        :key="index"
        closable
        type="info"
        @close="removeFilter(index)"
      >
        {{ filter.label }}: {{ filter.value }}
      </n-tag>
      <n-button text type="primary" @click="clearAllFilters">
        清除全部
      </n-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <n-data-table
        ref="tableRef"
        :columns="columns"
        :data="filteredData"
        :loading="loading"
        :row-key="(row: UsageRecord) => row.id"
        :pagination="pagination"
        :scroll-x="1200"
        striped
        size="small"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedRows.length > 0" class="batch-actions">
      <span class="selected-count">已选择 {{ selectedRows.length }} 条记录</span>
      <div class="batch-buttons">
        <n-button size="small" type="error" @click="batchDelete">
          🗑️ 删除
        </n-button>
        <n-button size="small" @click="batchExport">
          📥 导出选中
        </n-button>
        <n-button size="small" @click="clearSelection">
          取消选择
        </n-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="table-stats">
      <div class="stat-item">
        <span class="stat-label">总记录数:</span>
        <span class="stat-value">{{ totalRecords }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总Token:</span>
        <span class="stat-value">{{ formatTokens(totalTokens) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总费用:</span>
        <span class="stat-value">¥{{ totalCost.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue';
import {
  NButton,
  NDataTable,
  NInput,
  NTag,
  NDropdown,
  useMessage,
} from 'naive-ui';

// Types
interface UsageRecord {
  id: string;
  platform: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
  duration?: number;
}

interface Column {
  title: string;
  key: string;
  width?: number;
  render?: (row: UsageRecord) => any;
  sorter?: boolean | ((a: UsageRecord, b: UsageRecord) => number);
}

// Props
interface Props {
  title?: string;
  data?: UsageRecord[];
  loading?: boolean;
  selectable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '使用记录',
  data: () => [],
  loading: false,
  selectable: true,
});

// Emits
const emit = defineEmits<{
  refresh: [];
  export: [data: UsageRecord[]];
  delete: [ids: string[]];
  rowClick: [row: UsageRecord];
}>();

const message = useMessage();

// State
const searchKeyword = ref('');
const selectedRows = ref<string[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const sortKey = ref('');
const sortOrder = ref<'ascend' | 'descend' | false>(false);
const tableRef = ref();
const activeFilters = ref<Array<{ label: string; value: string }>>([]);

// Options
const filterOptions = [
  { label: '成功', key: 'status-success' },
  { label: '失败', key: 'status-failed' },
  { label: '进行中', key: 'status-pending' },
  { type: 'divider', key: 'd1' },
  { label: '近1小时', key: 'time-1h' },
  { label: '近24小时', key: 'time-24h' },
  { label: '近7天', key: 'time-7d' },
];

// Table columns
const columns: Column[] = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
    render: (row) => {
      return h(NTag, { size: 'small' }, { default: () => row.id.slice(-8) });
    },
  },
  {
    title: '平台',
    key: 'platform',
    width: 100,
    render: (row) => {
      const icons: Record<string, string> = {
        OpenAI: '🤖',
        Anthropic: '🧠',
        Gemini: '💎',
        DeepSeek: '🔮',
      };
      return h('span', {}, `${icons[row.platform] || '📡'} ${row.platform}`);
    },
  },
  {
    title: '模型',
    key: 'model',
    width: 150,
  },
  {
    title: '输入 Tokens',
    key: 'inputTokens',
    width: 120,
    sorter: true,
    render: (row) => formatTokens(row.inputTokens),
  },
  {
    title: '输出 Tokens',
    key: 'outputTokens',
    width: 120,
    sorter: true,
    render: (row) => formatTokens(row.outputTokens),
  },
  {
    title: '总 Tokens',
    key: 'totalTokens',
    width: 120,
    sorter: true,
    render: (row) => formatTokens(row.totalTokens),
  },
  {
    title: '费用',
    key: 'cost',
    width: 100,
    sorter: true,
    render: (row) => `¥${row.cost.toFixed(4)}`,
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => {
      const typeMap: Record<string, string> = {
        success: 'success',
        failed: 'error',
        pending: 'warning',
      };
      const labelMap: Record<string, string> = {
        success: '成功',
        failed: '失败',
        pending: '进行中',
      };
      return h(NTag, { type: typeMap[row.status], size: 'small' }, {
        default: () => labelMap[row.status],
      });
    },
  },
  {
    title: '耗时',
    key: 'duration',
    width: 80,
    render: (row) => row.duration ? `${row.duration}ms` : '-',
  },
  {
    title: '时间',
    key: 'timestamp',
    width: 180,
    sorter: true,
    render: (row) => formatTimestamp(row.timestamp),
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (row) => {
      return h(NButton, {
        size: 'small',
        text: true,
        type: 'primary',
        onClick: () => handleRowClick(row),
      }, { default: () => '查看' });
    },
  },
];

// Computed
const filteredData = computed(() => {
  let result = [...props.data];

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(row =>
      row.platform.toLowerCase().includes(keyword) ||
      row.model.toLowerCase().includes(keyword) ||
      row.id.toLowerCase().includes(keyword)
    );
  }

  // 筛选过滤
  activeFilters.value.forEach(filter => {
    if (filter.label === '状态') {
      const status = filter.value === '成功' ? 'success' :
                     filter.value === '失败' ? 'failed' : 'pending';
      result = result.filter(row => row.status === status);
    }
  });

  // 排序
  if (sortKey.value && sortOrder.value) {
    result.sort((a: any, b: any) => {
      const aVal = a[sortKey.value];
      const bVal = b[sortKey.value];
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder.value === 'ascend' ? comparison : -comparison;
    });
  }

  return result;
});

const totalRecords = computed(() => filteredData.value.length);
const totalTokens = computed(() =>
  filteredData.value.reduce((sum, row) => sum + row.totalTokens, 0)
);
const totalCost = computed(() =>
  filteredData.value.reduce((sum, row) => sum + row.cost, 0)
);

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  showQuickJumper: true,
  prefix: ({ itemCount }: any) => `共 ${itemCount} 条`,
}));

// Methods
const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};

const formatTimestamp = (date: Date): string => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleFilterSelect = (key: string) => {
  if (key.startsWith('status-')) {
    const status = key.replace('status-', '');
    const labelMap: Record<string, string> = {
      success: '成功',
      failed: '失败',
      pending: '进行中',
    };
    activeFilters.value.push({
      label: '状态',
      value: labelMap[status],
    });
  }
  currentPage.value = 1;
};

const removeFilter = (index: number) => {
  activeFilters.value.splice(index, 1);
  currentPage.value = 1;
};

const clearAllFilters = () => {
  activeFilters.value = [];
  searchKeyword.value = '';
  currentPage.value = 1;
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleRowClick = (row: UsageRecord) => {
  emit('rowClick', row);
};

const batchDelete = () => {
  emit('delete', selectedRows.value);
  clearSelection();
  message.success('删除成功');
};

const batchExport = () => {
  const selectedData = props.data.filter(row =>
    selectedRows.value.includes(row.id)
  );
  emit('export', selectedData);
  message.success('导出成功');
};

const exportData = () => {
  emit('export', filteredData.value);
  message.success('导出成功');
};

const clearSelection = () => {
  selectedRows.value = [];
};
</script>

<style scoped>
.usage-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.table-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.table-actions {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.filter-tags {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.table-container {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.batch-actions {
  position: fixed;
  bottom: var(--space-xl);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-modal);
}

.selected-count {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.batch-buttons {
  display: flex;
  gap: var(--space-sm);
}

.table-stats {
  display: flex;
  gap: var(--space-xl);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.stat-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .table-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .table-actions :deep(.n-input) {
    flex: 1;
  }

  .batch-actions {
    width: calc(100% - var(--space-xl) * 2);
    flex-direction: column;
    gap: var(--space-md);
  }

  .batch-buttons {
    width: 100%;
    justify-content: center;
  }

  .table-stats {
    flex-direction: column;
    gap: var(--space-sm);
  }
}
</style>
