<template>
  <div class="account-management">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <n-button type="primary" @click="showFormModal = true">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加账户
        </n-button>
        <n-button
          :disabled="!hasSelection"
          @click="handleRefreshSelectedBalances"
        >
          刷新余额
        </n-button>
        <n-button
          type="error"
          :disabled="!hasSelection"
          @click="confirmBatchDelete"
        >
          批量删除
        </n-button>
        <n-tag v-if="hasSelection" type="info" size="small">
          已选择 {{ selectedCount }} 个账户
        </n-tag>
      </div>
      <div class="toolbar-right">
        <n-input
          :value="searchQuery"
          placeholder="搜索账户..."
          clearable
          style="width: 200px"
          @update:value="handleSearchChange"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
        <n-button @click="handleRefresh" :loading="isLoading" circle>
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <!-- 统计栏 -->
    <AccountStatsBar
      :total="stats.total"
      :active="stats.active"
      :inactive="stats.inactive"
      :error="stats.error"
      :total-balance="stats.totalBalance"
      :total-usage="stats.totalUsage"
    />

    <!-- 高级过滤面板 -->
    <n-collapse-transition :show="showAdvancedFilter">
      <n-card size="small" class="filter-panel">
        <n-grid :cols="4" :x-gap="12" :y-gap="12" responsive="self">
          <n-gi>
            <n-select
              :value="filterTypes"
              multiple
              :options="typeOptions"
              placeholder="平台类型"
              clearable
              @update:value="handleFilterTypesChange"
            />
          </n-gi>
          <n-gi>
            <n-select
              :value="filterStatuses"
              multiple
              :options="statusOptions"
              placeholder="状态"
              clearable
              @update:value="handleFilterStatusesChange"
            />
          </n-gi>
          <n-gi>
            <n-input-number
              :value="filterMinBalance"
              placeholder="最小余额"
              clearable
              style="width: 100%"
              @update:value="handleMinBalanceChange"
            />
          </n-gi>
          <n-gi>
            <n-input-number
              :value="filterMaxBalance"
              placeholder="最大余额"
              clearable
              style="width: 100%"
              @update:value="handleMaxBalanceChange"
            />
          </n-gi>
        </n-grid>
      </n-card>
    </n-collapse-transition>

    <!-- 视图切换 -->
    <div class="view-controls">
      <div class="view-switcher">
        <n-radio-group :value="viewMode" @update:value="handleViewModeChange">
          <n-radio-button value="table">
            <n-icon :size="16"><ListOutline /></n-icon>
            表格
          </n-radio-button>
          <n-radio-button value="grid">
            <n-icon :size="16"><GridOutline /></n-icon>
            网格
          </n-radio-button>
          <n-radio-button value="card">
            <n-icon :size="16"><AppsOutline /></n-icon>
            卡片
          </n-radio-button>
        </n-radio-group>
      </div>
      <n-button
        type="info"
        size="medium"
        @click="handleToggleAdvancedFilter"
      >
        <template #icon>
          <n-icon><FilterOutline /></n-icon>
        </template>
        {{ showAdvancedFilter ? '隐藏过滤' : '高级过滤' }}
      </n-button>
    </div>

    <!-- 错误提示 -->
    <n-alert v-if="errorMessage" type="error" :title="'加载失败'" class="error-alert">
      {{ errorMessage }}
      <template #action>
        <n-button size="small" @click="handleRefresh">重试</n-button>
      </template>
    </n-alert>

    <!-- 账户列表 -->
    <div class="account-list">
      <!-- 空状态 -->
      <n-empty
        v-if="!isLoading && !errorMessage && filteredAccounts.length === 0"
        description="暂无账户"
      >
        <template #extra>
          <n-button type="primary" @click="showFormModal = true">
            添加第一个账户
          </n-button>
        </template>
      </n-empty>

      <!-- 表格视图 -->
      <AccountTable
        v-else-if="viewMode === 'table'"
        :data="filteredAccounts"
        :loading="isLoading"
        :selected-keys="selectedIds"
        :page="page"
        :page-size="pageSize"
        :total="filteredAccounts.length"
        @update:selected-keys="handleSelectionChange"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        @add="showFormModal = true"
        @refresh="handleRefresh"
        @batch-refresh="handleRefreshSelectedBalances"
        @batch-delete="confirmBatchDelete"
        @detail="showDetail"
        @edit="editAccount"
        @refresh-balance="handleRefreshBalance"
        @toggle="handleToggle"
        @delete="confirmDelete"
      />

      <!-- 网格视图 -->
      <AccountGrid
        v-else
        :data="filteredAccounts"
        :selected-keys="selectedIds"
        :mode="viewMode"
        @update:selected-keys="handleSelectionChange"
        @detail="showDetail"
        @edit="editAccount"
        @toggle="handleToggle"
        @delete="confirmDelete"
      />
    </div>

    <!-- 添加/编辑表单模态框 -->
    <AccountFormModal
      v-model:show="showFormModal"
      :editing-account="editingAccount"
      :existing-tags="allTags"
      @submit="handleFormSubmit"
    />

    <!-- 账户详情抽屉 -->
    <AccountDetailDrawer
      v-model:show="showDetailDrawer"
      :account="viewingAccount"
      @refresh="handleRefreshBalance"
      @edit="editAccountFromDrawer"
    />

    <!-- 删除确认对话框 -->
    <n-modal
      v-model:show="showDeleteConfirm"
      type="warning"
      preset="dialog"
      title="确认删除"
      :content="deleteConfirmMessage"
      positive-text="确认删除"
      negative-text="取消"
      @positive-click="executeDelete"
      @negative-click="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NButton,
  NIcon,
  NInput,
  NInputNumber,
  NTag,
  NRadioGroup,
  NRadioButton,
  NSelect,
  NGrid,
  NGi,
  NCard,
  NCollapseTransition,
  NEmpty,
  NModal,
  NAlert,
  useMessage
} from 'naive-ui';
import {
  AddOutline,
  SearchOutline,
  RefreshOutline,
  ListOutline,
  GridOutline,
  AppsOutline,
  FilterOutline
} from '@vicons/ionicons5';

// ViewModel
import { useAccountManagementViewModel } from '../../viewmodels/accounts/useAccountManagementViewModel';
import type { Account, CreateAccountParams, UpdateAccountParams } from '../../models/entities/Account';

// 子组件
import AccountTable from './components/AccountTable.vue';
import AccountGrid from './components/AccountGrid.vue';
import AccountFormModal from './components/AccountFormModal.vue';
import AccountDetailDrawer from './components/AccountDetailDrawer.vue';
import AccountStatsBar from './components/AccountStatsBar.vue';

// 消息提示
const message = useMessage();

// ==================== 使用ViewModel ====================
const {
  // 状态
  state,
  viewModel,

  // 计算属性
  filteredAccounts,
  stats,
  allTags,
  selectedCount,
  hasSelection,
  typeOptions,
  statusOptions,

  // 加载状态
  isLoading,
  errorMessage,

  // 方法
  refresh,
  setSearchQuery,
  setFilterTypes,
  setFilterStatuses,
  setBalanceRange,
  toggleAccount,
  refreshBalance,
  refreshSelectedBalances,
  createAccount,
  updateAccount,
  deleteAccount,
  deleteSelected,
  setViewMode,
  setPage,
  setPageSize,
  setSelectedIds
} = useAccountManagementViewModel();

// ==================== View本地状态 ====================
const showFormModal = ref(false);
const showDetailDrawer = ref(false);
const editingAccount = ref<Account | null>(null);
const viewingAccount = ref<Account | null>(null);
const showDeleteConfirm = ref(false);
const deleteConfirmMessage = ref('');
const deleteTarget = ref<Account | null>(null);

// ==================== 从ViewModel获取的响应式属性 ====================
const searchQuery = computed(() => state.searchQuery);
const filterTypes = computed(() => state.filterTypes);
const filterStatuses = computed(() => state.filterStatuses);
const filterMinBalance = computed(() => state.filterMinBalance);
const filterMaxBalance = computed(() => state.filterMaxBalance);
const showAdvancedFilter = computed(() => state.showAdvancedFilter);
const viewMode = computed(() => state.viewMode);
const page = computed(() => state.page);
const pageSize = computed(() => state.pageSize);
const selectedIds = computed(() => state.selectedIds);

// ==================== 事件处理函数 ====================

// 刷新
function handleRefresh() {
  refresh();
}

// 搜索
function handleSearchChange(value: string) {
  setSearchQuery(value);
}

// 类型过滤
function handleFilterTypesChange(value: any) {
  setFilterTypes(value);
}

// 状态过滤
function handleFilterStatusesChange(value: any) {
  setFilterStatuses(value);
}

// 余额范围过滤
function handleMinBalanceChange(value: number | null) {
  setBalanceRange(value, filterMaxBalance.value);
}

function handleMaxBalanceChange(value: number | null) {
  setBalanceRange(filterMinBalance.value, value);
}

// 高级过滤面板切换
function handleToggleAdvancedFilter() {
  viewModel.toggleAdvancedFilter();
}

// 视图模式切换
function handleViewModeChange(value: any) {
  setViewMode(value);
}

// 分页
function handlePageChange(value: number) {
  setPage(value);
}

function handlePageSizeChange(value: number) {
  setPageSize(value);
}

// 选择
function handleSelectionChange(ids: Set<string>) {
  setSelectedIds(ids);
}

// 显示详情
function showDetail(account: Account) {
  viewingAccount.value = account;
  showDetailDrawer.value = true;
}

// 编辑账户
function editAccount(account: Account) {
  editingAccount.value = account;
  showFormModal.value = true;
}

// 从抽屉编辑
function editAccountFromDrawer(account: Account) {
  showDetailDrawer.value = false;
  editingAccount.value = account;
  showFormModal.value = true;
}

// 切换状态
async function handleToggle(id: string) {
  const result = await toggleAccount(id);
  if (result) {
    message.success('状态已更新');
  }
}

// 刷新余额
async function handleRefreshBalance(id: string) {
  const result = await refreshBalance(id);
  if (result) {
    message.success('余额已刷新');
  }
}

// 刷新选中账户余额
async function handleRefreshSelectedBalances() {
  const results = await refreshSelectedBalances();
  if (results.length > 0) {
    message.success(`已刷新 ${results.length} 个账户余额`);
  }
}

// 表单提交
async function handleFormSubmit(data: CreateAccountParams | UpdateAccountParams) {
  let result;
  if ('id' in data) {
    result = await updateAccount(data.id, data);
    if (result) {
      message.success('账户已更新');
    }
  } else {
    result = await createAccount(data);
    if (result) {
      message.success('账户已创建');
    }
  }
  if (result) {
    showFormModal.value = false;
    editingAccount.value = null;
  }
}

// 确认删除
function confirmDelete(account: Account) {
  deleteTarget.value = account;
  deleteConfirmMessage.value = `确定要删除账户 "${account.name}" 吗？此操作不可恢复。`;
  showDeleteConfirm.value = true;
}

// 确认批量删除
function confirmBatchDelete() {
  deleteTarget.value = null;
  deleteConfirmMessage.value = `确定要删除选中的 ${selectedCount.value} 个账户吗？此操作不可恢复。`;
  showDeleteConfirm.value = true;
}

// 执行删除
async function executeDelete() {
  let success = false;
  if (deleteTarget.value) {
    success = await deleteAccount(deleteTarget.value.id);
    if (success) {
      message.success('账户已删除');
    }
  } else {
    const count = await deleteSelected();
    if (count > 0) {
      message.success(`已删除 ${count} 个账户`);
      success = true;
    }
  }
  showDeleteConfirm.value = false;
  deleteTarget.value = null;
}
</script>

<style scoped>
.account-management {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary, #ffffff);
  gap: var(--space-md, 16px);
  padding: var(--space-lg, 20px);
  overflow: hidden;
}

/* 工具栏 - 玻璃拟态 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md, 16px);
  flex-wrap: wrap;
  padding: 16px 20px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg, 16px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-md);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 8px);
}

/* 视图控制 - 玻璃拟态 */
.view-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--glass-border);
  gap: 16px;
}

.view-switcher {
  flex-shrink: 0;
}

/* 高级过滤按钮样式 */
:deep(.n-button[type="info"]) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border: none !important;
  font-weight: 500;
  padding: 8px 20px;
  height: 40px;
  border-radius: 10px;
}

:deep(.n-button[type="info"]:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* 过滤面板 - 玻璃拟态 */
.filter-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--glass-border);
}

/* 错误提示 */
.error-alert {
  margin-bottom: var(--space-md, 16px);
  background: var(--glass-bg) !important;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-md, 12px);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* 账户列表 - 玻璃拟态容器 */
.account-list {
  flex: 1;
  overflow: auto;
  padding: 4px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg, 16px);
  border: 1px solid var(--glass-border);
}

/* 响应式 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }

  .view-controls {
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }
}

/* 覆盖Naive UI样式 - 玻璃效果 */
:deep(.n-button) {
  transition: all var(--transition-normal);
}

:deep(.n-button[type="primary"]) {
  background: var(--gradient-primary) !important;
  border-color: transparent !important;
  box-shadow: var(--glow-primary);
}

:deep(.n-button[type="primary"]:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(94, 114, 235, 0.4);
}

:deep(.n-input),
:deep(.n-select),
:deep(.n-input-number) {
  --n-color: rgba(255, 255, 255, 0.05) !important;
  --n-border: 1px solid var(--glass-border) !important;
  --n-text-color: var(--text-primary) !important;
  --n-placeholder-color: var(--text-muted) !important;
  background: rgba(255, 255, 255, 0.03) !important;
  border-radius: var(--radius-md, 12px);
  transition: all var(--transition-normal);
}

:deep(.n-input:hover),
:deep(.n-select:hover),
:deep(.n-input-number:hover) {
  border-color: var(--primary-color) !important;
}

:deep(.n-input:focus),
:deep(.n-select:focus),
:deep(.n-input-number:focus) {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px rgba(94, 114, 235, 0.2) !important;
}

:deep(.n-tag) {
  background: rgba(94, 114, 235, 0.1);
  border: 1px solid rgba(94, 114, 235, 0.3);
  border-radius: var(--radius-sm, 6px);
}

:deep(.n-radio-button) {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  transition: all var(--transition-normal);
}

:deep(.n-radio-button:hover) {
  background: rgba(255, 255, 255, 0.08);
}

:deep(.n-radio-button--checked) {
  background: var(--gradient-primary) !important;
  border-color: transparent !important;
}

:deep(.n-card) {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg, 16px);
}

:deep(.n-collapse-transition) {
  background: inherit !important;
}

:deep(.n-empty) {
  padding: 60px 20px;
}

:deep(.n-empty__description) {
  color: var(--text-secondary);
}
</style>
