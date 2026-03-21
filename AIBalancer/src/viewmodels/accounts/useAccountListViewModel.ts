import { ref, computed, onMounted, onUnmounted } from 'vue';
import { accountService } from '../../models/services/AccountService';
import type {
  Account,
  AccountFilter,
  AccountsSummary
} from '../../models/entities/Account';

/**
 * 账户列表 ViewModel
 * 使用 Composition API 封装账户列表的状态和操作逻辑
 */
export function useAccountListViewModel() {
  // ==================== 状态 ====================

  const accounts = ref<Account[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 过滤状态
  const filter = ref<AccountFilter>({
    types: [],
    statuses: [],
    tags: [],
    search: '',
    limit: 50,
    offset: 0
  });

  // 选择状态
  const selectedAccounts = ref<Set<string>>(new Set());

  // 分页状态
  const page = ref(1);
  const pageSize = ref(50);
  const totalCount = ref(0);

  // 排序状态
  const sortBy = ref('updatedAt');
  const sortOrder = ref<'asc' | 'desc'>('desc');

  // 统计汇总
  const summary = ref<AccountsSummary | null>(null);

  // 自动刷新定时器
  let refreshInterval: number | null = null;

  // ==================== 计算属性 ====================

  const selectedCount = computed(() => selectedAccounts.value.size);
  const hasSelected = computed(() => selectedAccounts.value.size > 0);
  const allSelected = computed(() =>
    accounts.value.length > 0 && selectedAccounts.value.size === accounts.value.length
  );
  const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
  const hasPrevPage = computed(() => page.value > 1);
  const hasNextPage = computed(() => page.value < totalPages.value);

  // ==================== 方法 ====================

  /**
   * 加载账户列表
   */
  async function loadAccounts(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      accounts.value = await accountService.getAccountsWithFilter(filter.value);
      totalCount.value = accounts.value.length;

      // 更新统计汇总
      await loadSummary();
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载账户列表失败';
      console.error('Failed to load accounts:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载统计汇总
   */
  async function loadSummary(): Promise<void> {
    try {
      summary.value = await accountService.getAccountsSummary();
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  }

  /**
   * 刷新账户列表
   */
  async function refresh(): Promise<void> {
    await loadAccounts();
  }

  /**
   * 应用过滤条件
   */
  async function applyFilter(newFilter: Partial<AccountFilter>): Promise<void> {
    filter.value = {
      ...filter.value,
      ...newFilter,
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value
    };

    await loadAccounts();
  }

  /**
   * 更改页码
   */
  async function changePage(newPage: number): Promise<void> {
    page.value = newPage;
    filter.value.offset = (newPage - 1) * pageSize.value;

    await loadAccounts();
  }

  /**
   * 更改每页数量
   */
  async function changePageSize(newSize: number): Promise<void> {
    pageSize.value = newSize;
    page.value = 1;
    filter.value.limit = newSize;
    filter.value.offset = 0;

    await loadAccounts();
  }

  /**
   * 更改排序
   */
  function changeSort(newSortBy: string, newSortOrder: 'asc' | 'desc'): void {
    sortBy.value = newSortBy;
    sortOrder.value = newSortOrder;

    // 本地排序
    accounts.value.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (newSortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'balance':
          valueA = a.currentBalance;
          valueB = b.currentBalance;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'lastUsed':
          valueA = new Date(a.usage.lastUsed).getTime();
          valueB = new Date(b.usage.lastUsed).getTime();
          break;
        case 'updatedAt':
        default:
          valueA = new Date(a.updatedAt).getTime();
          valueB = new Date(b.updatedAt).getTime();
      }

      if (valueA < valueB) return newSortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return newSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * 切换账户选择
   */
  function toggleAccountSelection(accountId: string): void {
    if (selectedAccounts.value.has(accountId)) {
      selectedAccounts.value.delete(accountId);
    } else {
      selectedAccounts.value.add(accountId);
    }
  }

  /**
   * 全选
   */
  function selectAllAccounts(): void {
    selectedAccounts.value = new Set(accounts.value.map(a => a.id));
  }

  /**
   * 清除选择
   */
  function clearSelection(): void {
    selectedAccounts.value.clear();
  }

  /**
   * 删除选中的账户
   */
  async function deleteSelectedAccounts(): Promise<number> {
    const ids = Array.from(selectedAccounts.value);
    if (ids.length === 0) return 0;

    try {
      isLoading.value = true;
      const count = await accountService.batchDeleteAccounts(ids);

      await loadAccounts();
      selectedAccounts.value.clear();

      return count;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除账户失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 刷新选中账户的余额
   */
  async function refreshSelectedBalances(): Promise<Account[]> {
    const ids = Array.from(selectedAccounts.value);
    if (ids.length === 0) return [];

    try {
      isLoading.value = true;
      const updated = await accountService.batchRefreshBalances(ids);

      await loadAccounts();

      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新余额失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 激活选中的账户
   */
  async function activateSelectedAccounts(): Promise<number> {
    const ids = Array.from(selectedAccounts.value);
    if (ids.length === 0) return 0;

    try {
      isLoading.value = true;
      const count = await accountService.batchActivateAccounts(ids);

      await loadAccounts();

      return count;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '激活账户失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 停用选中的账户
   */
  async function deactivateSelectedAccounts(): Promise<number> {
    const ids = Array.from(selectedAccounts.value);
    if (ids.length === 0) return 0;

    try {
      isLoading.value = true;
      const count = await accountService.batchDeactivateAccounts(ids);

      await loadAccounts();

      return count;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '停用账户失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 设置自动刷新
   */
  function setupAutoRefresh(intervalMs: number = 5 * 60 * 1000): void {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
      loadAccounts();
    }, intervalMs) as unknown as number;
  }

  /**
   * 清除自动刷新
   */
  function clearAutoRefresh(): void {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  /**
   * 获取本地统计
   */
  function getLocalStats() {
    return {
      total: accounts.value.length,
      active: accounts.value.filter(a => a.status === 'active').length,
      inactive: accounts.value.filter(a => a.status === 'inactive').length,
      error: accounts.value.filter(a => a.status === 'error').length,
      totalBalance: accounts.value.reduce((sum, a) => sum + a.currentBalance, 0),
      totalUsage: accounts.value.reduce((sum, a) => sum + a.usage.totalTokens, 0)
    };
  }

  // ==================== 生命周期 ====================

  onMounted(() => {
    loadAccounts();
    setupAutoRefresh();
  });

  onUnmounted(() => {
    clearAutoRefresh();
  });

  // ==================== 导出 ====================

  return {
    // 状态
    accounts,
    isLoading,
    error,
    filter,
    selectedAccounts,
    totalCount,
    page,
    pageSize,
    sortBy,
    sortOrder,
    summary,

    // 计算属性
    selectedCount,
    hasSelected,
    allSelected,
    totalPages,
    hasPrevPage,
    hasNextPage,

    // 方法
    loadAccounts,
    loadSummary,
    refresh,
    applyFilter,
    changePage,
    changePageSize,
    changeSort,
    toggleAccountSelection,
    selectAllAccounts,
    clearSelection,
    deleteSelectedAccounts,
    refreshSelectedBalances,
    activateSelectedAccounts,
    deactivateSelectedAccounts,
    setupAutoRefresh,
    clearAutoRefresh,
    getLocalStats
  };
}
