import { computed } from 'vue';
import { BaseViewModel, useViewModel } from '../BaseViewModel';
import { accountService } from '../../models/services/AccountService';
import type {
  Account,
  AccountFilter,
  AccountsSummary,
  AccountStatus,
  AccountType,
  CreateAccountParams,
  UpdateAccountParams
} from '../../models/entities/Account';
import { AccountType as AT, AccountStatus as AS, getTypeLabel } from '../../models/entities/Account';

// ==================== 类型定义 ====================

/**
 * 视图模式
 */
export type ViewMode = 'table' | 'grid' | 'card';

/**
 * 排序配置
 */
export interface SortConfig {
  sortBy: 'name' | 'balance' | 'status' | 'lastUsed' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

/**
 * AccountManagementViewModel状态
 */
export interface AccountManagementState {
  accounts: Account[];
  selectedIds: Set<string>;
  viewMode: ViewMode;
  sortConfig: SortConfig;
  filter: AccountFilter;
  summary: AccountsSummary | null;
  searchQuery: string;
  filterTypes: AccountType[];
  filterStatuses: AccountStatus[];
  filterMinBalance: number | null;
  filterMaxBalance: number | null;
  showAdvancedFilter: boolean;
  page: number;
  pageSize: number;
}

// ==================== 默认值 ====================

const DEFAULT_SORT_CONFIG: SortConfig = {
  sortBy: 'updatedAt',
  sortOrder: 'desc'
};

const DEFAULT_FILTER: AccountFilter = {
  types: [],
  statuses: [],
  tags: [],
  search: '',
  limit: 50,
  offset: 0
};

// ==================== ViewModel ====================

/**
 * 账户管理页面ViewModel
 * 整合列表、过滤、搜索、批量操作等逻辑
 */
export class AccountManagementViewModel extends BaseViewModel<AccountManagementState> {
  /**
   * 自动刷新定时器
   */
  private refreshTimer: number | null = null;

  constructor() {
    super({
      accounts: [],
      selectedIds: new Set(),
      viewMode: 'table',
      sortConfig: { ...DEFAULT_SORT_CONFIG },
      filter: { ...DEFAULT_FILTER },
      summary: null,
      searchQuery: '',
      filterTypes: [],
      filterStatuses: [],
      filterMinBalance: null,
      filterMaxBalance: null,
      showAdvancedFilter: false,
      page: 1,
      pageSize: 20
    });
  }

  // ==================== 生命周期 ====================

  protected async onInitialize(): Promise<void> {
    await this.loadAccounts();
    await this.loadSummary();
    this.setupAutoRefresh(5 * 60 * 1000); // 5分钟自动刷新
  }

  protected async onDispose(): Promise<void> {
    this.clearAutoRefresh();
  }

  // ==================== 数据加载 ====================

  /**
   * 加载账户列表
   */
  public async loadAccounts(): Promise<void> {
    await this.withLoadingAndErrorHandling(async () => {
      this.state.accounts = await accountService.getAllAccounts();
      this.applyLocalFilters();
    }, '加载账户列表失败');
  }

  /**
   * 加载统计汇总
   */
  public async loadSummary(): Promise<void> {
    try {
      this.state.summary = await accountService.getAccountsSummary();
    } catch (error) {
      // 捕获错误但不向外抛出，避免影响其他操作
      console.error('加载统计失败:', error);
      // 设置一个默认的 summary 避免后续访问出错
      this.state.summary = {
        total: this.state.accounts.length,
        active: this.state.accounts.filter(a => a.status === 'active').length,
        inactive: this.state.accounts.filter(a => a.status === 'inactive').length,
        withErrors: this.state.accounts.filter(a => a.status === 'error').length,
        totalBalance: this.state.accounts.reduce((sum, a) => sum + a.currentBalance, 0),
        totalUsage: this.state.accounts.reduce((sum, a) => sum + (a.usage?.totalTokens || 0), 0),
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>
      };
    }
  }

  /**
   * 刷新数据
   */
  public async refresh(): Promise<void> {
    // 先加载账户列表（这是主要数据）
    await this.loadAccounts();
    // 然后加载汇总（这是次要数据，失败不影响主流程）
    await this.loadSummary();
  }

  // ==================== 过滤和搜索 ====================

  /**
   * 设置搜索查询
   */
  public setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    this.state.page = 1;
  }

  /**
   * 设置类型过滤
   */
  public setFilterTypes(types: AccountType[]): void {
    this.state.filterTypes = types;
    this.state.page = 1;
  }

  /**
   * 设置状态过滤
   */
  public setFilterStatuses(statuses: AccountStatus[]): void {
    this.state.filterStatuses = statuses;
    this.state.page = 1;
  }

  /**
   * 设置余额范围过滤
   */
  public setBalanceRange(min: number | null, max: number | null): void {
    this.state.filterMinBalance = min;
    this.state.filterMaxBalance = max;
    this.state.page = 1;
  }

  /**
   * 切换高级过滤面板
   */
  public toggleAdvancedFilter(): void {
    this.state.showAdvancedFilter = !this.state.showAdvancedFilter;
  }

  /**
   * 清除所有过滤条件
   */
  public clearFilters(): void {
    this.state.searchQuery = '';
    this.state.filterTypes = [];
    this.state.filterStatuses = [];
    this.state.filterMinBalance = null;
    this.state.filterMaxBalance = null;
    this.state.page = 1;
  }

  /**
   * 应用本地过滤
   */
  private applyLocalFilters(): void {
    // 过滤逻辑在计算属性filteredAccounts中实现
  }

  // ==================== 排序 ====================

  /**
   * 设置排序
   */
  public setSort(sortBy: SortConfig['sortBy'], sortOrder: SortConfig['sortOrder']): void {
    this.state.sortConfig = { sortBy, sortOrder };
  }

  /**
   * 切换排序方向
   */
  public toggleSortOrder(): void {
    this.state.sortConfig.sortOrder =
      this.state.sortConfig.sortOrder === 'asc' ? 'desc' : 'asc';
  }

  // ==================== 选择管理 ====================

  /**
   * 切换账户选择
   */
  public toggleSelection(accountId: string): void {
    if (this.state.selectedIds.has(accountId)) {
      this.state.selectedIds.delete(accountId);
    } else {
      this.state.selectedIds.add(accountId);
    }
  }

  /**
   * 全选
   */
  public selectAll(): void {
    this.state.selectedIds = new Set(this.filteredAccounts.value.map(a => a.id));
  }

  /**
   * 取消全选
   */
  public deselectAll(): void {
    this.state.selectedIds.clear();
  }

  /**
   * 设置选中的账户
   */
  public setSelectedIds(ids: Set<string>): void {
    this.state.selectedIds = ids;
  }

  // ==================== 视图模式 ====================

  /**
   * 设置视图模式
   */
  public setViewMode(mode: ViewMode): void {
    this.state.viewMode = mode;
  }

  // ==================== 分页 ====================

  /**
   * 设置页码
   */
  public setPage(page: number): void {
    this.state.page = page;
  }

  /**
   * 设置每页数量
   */
  public setPageSize(size: number): void {
    this.state.pageSize = size;
    this.state.page = 1;
  }

  // ==================== 账户操作 ====================

  /**
   * 创建账户
   */
  public async createAccount(params: CreateAccountParams): Promise<Account | null> {
    return await this.withLoadingAndErrorHandling(async () => {
      const account = await accountService.createAccount(params);
      await this.refresh();
      return account;
    }, '创建账户失败');
  }

  /**
   * 更新账户
   */
  public async updateAccount(id: string, params: Omit<UpdateAccountParams, 'id'>): Promise<Account | null> {
    return await this.withLoadingAndErrorHandling(async () => {
      const account = await accountService.updateAccount(id, params);
      await this.refresh();
      return account;
    }, '更新账户失败');
  }

  /**
   * 删除账户
   */
  public async deleteAccount(id: string): Promise<boolean> {
    return await this.withLoadingAndErrorHandling(async () => {
      const result = await accountService.deleteAccount(id);
      if (result) {
        this.state.selectedIds.delete(id);
        await this.refresh();
      }
      return result;
    }, '删除账户失败') ?? false;
  }

  /**
   * 批量删除选中的账户
   */
  public async deleteSelected(): Promise<number> {
    const ids = Array.from(this.state.selectedIds);
    if (ids.length === 0) return 0;

    return await this.withLoadingAndErrorHandling(async () => {
      const count = await accountService.batchDeleteAccounts(ids);
      this.state.selectedIds.clear();
      await this.refresh();
      return count;
    }, '批量删除失败') ?? 0;
  }

  /**
   * 切换账户状态
   */
  public async toggleAccount(id: string): Promise<Account | null> {
    return await this.withLoadingAndErrorHandling(async () => {
      const account = await accountService.toggleAccount(id);
      await this.refresh();
      return account;
    }, '切换状态失败');
  }

  /**
   * 刷新账户余额
   */
  public async refreshBalance(id: string): Promise<Account | null> {
    return await this.withLoadingAndErrorHandling(async () => {
      const account = await accountService.refreshAccountBalance(id);
      await this.refresh();
      return account;
    }, '刷新余额失败');
  }

  /**
   * 批量刷新选中账户余额
   */
  public async refreshSelectedBalances(): Promise<Account[]> {
    const ids = Array.from(this.state.selectedIds);
    if (ids.length === 0) return [];

    return await this.withLoadingAndErrorHandling(async () => {
      const accounts = await accountService.batchRefreshBalances(ids);
      await this.refresh();
      return accounts;
    }, '批量刷新余额失败') ?? [];
  }

  /**
   * 批量激活选中账户
   */
  public async activateSelected(): Promise<number> {
    const ids = Array.from(this.state.selectedIds);
    if (ids.length === 0) return 0;

    return await this.withLoadingAndErrorHandling(async () => {
      const count = await accountService.batchActivateAccounts(ids);
      await this.refresh();
      return count;
    }, '批量激活失败') ?? 0;
  }

  /**
   * 批量停用选中账户
   */
  public async deactivateSelected(): Promise<number> {
    const ids = Array.from(this.state.selectedIds);
    if (ids.length === 0) return 0;

    return await this.withLoadingAndErrorHandling(async () => {
      const count = await accountService.batchDeactivateAccounts(ids);
      await this.refresh();
      return count;
    }, '批量停用失败') ?? 0;
  }

  // ==================== 导出功能 ====================

  /**
   * 导出选中账户
   */
  public async exportSelected(format: 'json' | 'csv'): Promise<string | null> {
    const ids = Array.from(this.state.selectedIds);
    if (ids.length === 0) return null;

    return await this.withErrorHandling(async () => {
      return await accountService.exportAccounts(ids, format);
    }, '导出失败');
  }

  /**
   * 导出所有账户
   */
  public async exportAll(format: 'json' | 'csv'): Promise<string | null> {
    return await this.withErrorHandling(async () => {
      return await accountService.exportAccounts(undefined, format);
    }, '导出失败');
  }

  // ==================== 自动刷新 ====================

  /**
   * 设置自动刷新
   */
  private setupAutoRefresh(intervalMs: number): void {
    this.clearAutoRefresh();
    this.refreshTimer = setInterval(() => {
      this.refresh();
    }, intervalMs) as unknown as number;
  }

  /**
   * 清除自动刷新
   */
  private clearAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ==================== 计算属性 ====================

  /**
   * 获取过滤后的账户列表
   */
  public get filteredAccounts() {
    return computed(() => {
      let result = [...this.state.accounts];

      // 搜索过滤
      if (this.state.searchQuery) {
        const query = this.state.searchQuery.toLowerCase();
        result = result.filter(a =>
          a.name.toLowerCase().includes(query) ||
          getTypeLabel(a.type).toLowerCase().includes(query) ||
          (a.metadata?.tags?.some(t => t.toLowerCase().includes(query)) ?? false)
        );
      }

      // 类型过滤
      if (this.state.filterTypes.length > 0) {
        result = result.filter(a => this.state.filterTypes.includes(a.type));
      }

      // 状态过滤
      if (this.state.filterStatuses.length > 0) {
        result = result.filter(a => this.state.filterStatuses.includes(a.status));
      }

      // 余额范围过滤
      if (this.state.filterMinBalance !== null) {
        result = result.filter(a => (a.currentBalance || 0) >= this.state.filterMinBalance!);
      }
      if (this.state.filterMaxBalance !== null) {
        result = result.filter(a => (a.currentBalance || 0) <= this.state.filterMaxBalance!);
      }

      // 排序
      result.sort((a, b) => {
        let valueA: any, valueB: any;

        switch (this.state.sortConfig.sortBy) {
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'balance':
            valueA = a.currentBalance || 0;
            valueB = b.currentBalance || 0;
            break;
          case 'status':
            valueA = a.status;
            valueB = b.status;
            break;
          case 'lastUsed':
            valueA = new Date(a.usage?.lastUsed || 0).getTime();
            valueB = new Date(b.usage?.lastUsed || 0).getTime();
            break;
          case 'updatedAt':
          default:
            valueA = new Date(a.updatedAt).getTime();
            valueB = new Date(b.updatedAt).getTime();
        }

        if (valueA < valueB) return this.state.sortConfig.sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return this.state.sortConfig.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return result;
    });
  }

  /**
   * 获取分页后的账户列表
   */
  public get paginatedAccounts() {
    return computed(() => {
      const filtered = this.filteredAccounts.value;
      const start = (this.state.page - 1) * this.state.pageSize;
      const end = start + this.state.pageSize;
      return filtered.slice(start, end);
    });
  }

  /**
   * 获取统计数据
   */
  public get stats() {
    return computed(() => {
      const data = this.filteredAccounts.value;
      return {
        total: data.length,
        active: data.filter(a => a.status === AS.ACTIVE).length,
        inactive: data.filter(a => a.status === AS.INACTIVE).length,
        error: data.filter(a => a.status === AS.ERROR).length,
        totalBalance: data.reduce((sum, a) => sum + (a.currentBalance || 0), 0),
        totalUsage: data.reduce((sum, a) => sum + (a.usage?.totalTokens || 0), 0)
      };
    });
  }

  /**
   * 获取所有标签
   */
  public get allTags() {
    return computed(() => {
      const tagSet = new Set<string>();
      this.state.accounts.forEach(a => a.metadata.tags.forEach(t => tagSet.add(t)));
      return Array.from(tagSet);
    });
  }

  /**
   * 获取选中数量
   */
  public get selectedCount(): number {
    return this.state.selectedIds.size;
  }

  /**
   * 获取是否有选中
   */
  public get hasSelection(): boolean {
    return this.state.selectedIds.size > 0;
  }

  /**
   * 获取是否全选
   */
  public get isAllSelected(): boolean {
    return this.state.accounts.length > 0 &&
      this.state.selectedIds.size === this.filteredAccounts.value.length;
  }

  /**
   * 获取总页数
   */
  public get totalPages(): number {
    return Math.ceil(this.filteredAccounts.value.length / this.state.pageSize);
  }

  /**
   * 获取是否有上一页
   */
  public get hasPrevPage(): boolean {
    return this.state.page > 1;
  }

  /**
   * 获取是否有下一页
   */
  public get hasNextPage(): boolean {
    return this.state.page < this.totalPages;
  }

  /**
   * 获取类型选项
   */
  public get typeOptions() {
    return [
      { label: 'DeepSeek', value: AT.DEEPSEEK },
      { label: 'OpenAI', value: AT.OPENAI },
      { label: 'Anthropic', value: AT.ANTHROPIC },
      { label: 'Google AI', value: AT.GOOGLE },
      { label: 'Azure OpenAI', value: AT.AZURE },
      { label: '自定义', value: AT.CUSTOM }
    ];
  }

  /**
   * 获取状态选项
   */
  public get statusOptions() {
    return [
      { label: '活跃', value: AS.ACTIVE },
      { label: '停用', value: AS.INACTIVE },
      { label: '异常', value: AS.ERROR },
      { label: '测试中', value: AS.TESTING },
      { label: '已过期', value: AS.EXPIRED }
    ];
  }
}

// ==================== Composition函数 ====================

/**
 * 账户管理页面ViewModel Composition函数
 */
export function useAccountManagementViewModel() {
  const base = useViewModel(AccountManagementViewModel);
  const vm = base.viewModel;

  return {
    // 基础状态
    state: base.state,
    viewModel: vm,
    isLoading: base.isLoading,
    errorMessage: base.errorMessage,

    // 计算属性
    filteredAccounts: vm.filteredAccounts,
    stats: vm.stats,
    allTags: vm.allTags,
    selectedCount: vm.selectedCount,
    hasSelection: vm.hasSelection,
    typeOptions: vm.typeOptions,
    statusOptions: vm.statusOptions,

    // 方法
    refresh: vm.refresh.bind(vm),
    setSearchQuery: vm.setSearchQuery.bind(vm),
    setFilterTypes: vm.setFilterTypes.bind(vm),
    setFilterStatuses: vm.setFilterStatuses.bind(vm),
    setBalanceRange: vm.setBalanceRange.bind(vm),
    toggleAccount: vm.toggleAccount.bind(vm),
    refreshBalance: vm.refreshBalance.bind(vm),
    refreshSelectedBalances: vm.refreshSelectedBalances.bind(vm),
    createAccount: vm.createAccount.bind(vm),
    updateAccount: vm.updateAccount.bind(vm),
    deleteAccount: vm.deleteAccount.bind(vm),
    deleteSelected: vm.deleteSelected.bind(vm),
    setViewMode: vm.setViewMode.bind(vm),
    setPage: vm.setPage.bind(vm),
    setPageSize: vm.setPageSize.bind(vm),
    setSelectedIds: vm.setSelectedIds.bind(vm),

    // 生命周期
    initialize: base.initialize,
    dispose: base.dispose
  };
}
