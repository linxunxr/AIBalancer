import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import type { Ref, Reactive } from 'vue';

/**
 * ViewModel状态接口
 */
export interface ViewModelState {
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

/**
 * ViewModel基础抽象类
 * 提供统一的状态管理、错误处理和生命周期管理
 *
 * @example
 * ```typescript
 * class MyViewModel extends BaseViewModel<MyState> {
 *   constructor() {
 *     super({ count: 0, items: [] });
 *   }
 *
 *   protected async onInitialize(): Promise<void> {
 *     await this.loadData();
 *   }
 *
 *   public async loadData(): Promise<void> {
 *     await this.withLoading(async () => {
 *       const data = await fetchData();
 *       this.state.items = data;
 *     });
 *   }
 * }
 * ```
 */
export abstract class BaseViewModel<TState extends object = ViewModelState> {
  /**
   * 响应式状态
   */
  protected state: Reactive<TState>;

  /**
   * 加载状态
   */
  protected loading: Ref<boolean> = ref(false);

  /**
   * 错误信息
   */
  protected error: Ref<string | null> = ref(null);

  /**
   * 初始化状态
   */
  protected initialized: Ref<boolean> = ref(false);

  /**
   * 构造函数
   * @param initialState 初始状态
   */
  constructor(initialState: TState) {
    this.state = reactive(initialState) as Reactive<TState>;
  }

  // ==================== 生命周期钩子 ====================

  /**
   * 初始化钩子 - 子类重写此方法实现初始化逻辑
   */
  protected async onInitialize(): Promise<void> {
    // 默认空实现，子类可重写
  }

  /**
   * 销毁钩子 - 子类重写此方法实现清理逻辑
   */
  protected async onDispose(): Promise<void> {
    // 默认空实现，子类可重写
  }

  // ==================== 公共方法 ====================

  /**
   * 初始化ViewModel
   */
  public async initialize(): Promise<void> {
    if (this.initialized.value) {
      return;
    }

    try {
      this.loading.value = true;
      this.error.value = null;
      await this.onInitialize();
      this.initialized.value = true;
    } catch (err) {
      this.error.value = err instanceof Error ? err.message : '初始化失败';
      throw err;
    } finally {
      this.loading.value = false;
    }
  }

  /**
   * 销毁ViewModel
   */
  public async dispose(): Promise<void> {
    try {
      await this.onDispose();
      this.initialized.value = false;
    } catch (err) {
      console.error('ViewModel销毁失败:', err);
    }
  }

  /**
   * 重置ViewModel状态
   */
  public reset(): void {
    this.loading.value = false;
    this.error.value = null;
    this.initialized.value = false;
  }

  // ==================== 状态访问器 ====================

  /**
   * 获取加载状态
   */
  public get isLoading(): boolean {
    return this.loading.value;
  }

  /**
   * 获取是否有错误
   */
  public get hasError(): boolean {
    return this.error.value !== null;
  }

  /**
   * 获取错误信息
   */
  public get errorMessage(): string | null {
    return this.error.value;
  }

  /**
   * 获取初始化状态
   */
  public get isInitialized(): boolean {
    return this.initialized.value;
  }

  /**
   * 获取响应式状态
   */
  public get reactiveState(): Reactive<TState> {
    return this.state;
  }

  // ==================== 工具方法 ====================

  /**
   * 带加载状态执行操作
   * @param operation 要执行的操作
   * @returns 操作的返回值
   */
  protected async withLoading<T>(operation: () => Promise<T>): Promise<T> {
    this.loading.value = true;
    try {
      return await operation();
    } finally {
      this.loading.value = false;
    }
  }

  /**
   * 带错误处理执行操作
   * @param operation 要执行的操作
   * @param errorMessage 错误消息
   * @returns 操作的返回值，失败时返回null
   */
  protected async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> {
    try {
      this.clearError();
      return await operation();
    } catch (err) {
      const message = errorMessage || (err instanceof Error ? err.message : '操作失败');
      this.setError(message);
      console.error('ViewModel操作失败:', err);
      return null;
    }
  }

  /**
   * 带加载状态和错误处理执行操作
   * @param operation 要执行的操作
   * @param errorMessage 错误消息
   * @returns 操作的返回值，失败时返回null
   */
  protected async withLoadingAndErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> {
    return this.withLoading(async () => {
      return this.withErrorHandling(operation, errorMessage);
    });
  }

  /**
   * 设置错误信息
   * @param message 错误消息
   */
  protected setError(message: string): void {
    this.error.value = message;
  }

  /**
   * 清除错误信息
   */
  protected clearError(): void {
    this.error.value = null;
  }

  /**
   * 批量更新状态
   * @param updates 要更新的状态片段
   */
  protected updateState(updates: Partial<TState>): void {
    Object.assign(this.state, updates);
  }
}

// ==================== Composition函数 ====================

/**
 * ViewModel Composition函数包装器
 * 用于在组件中使用ViewModel
 *
 * @param ViewModelClass ViewModel类
 * @param args 构造函数参数
 * @returns ViewModel实例和响应式属性
 *
 * @example
 * ```typescript
 * const {
 *   state,
 *   isLoading,
 *   hasError,
 *   errorMessage,
 *   initialize,
 *   dispose
 * } = useViewModel(MyViewModel, constructorArg1, constructorArg2);
 * ```
 */
export function useViewModel<TViewModel extends BaseViewModel<any>>(
  ViewModelClass: new (...args: any[]) => TViewModel,
  ...args: any[]
) {
  // 创建ViewModel实例
  const viewModel = new ViewModelClass(...args);

  // 生命周期管理
  onMounted(() => {
    viewModel.initialize();
  });

  onUnmounted(() => {
    viewModel.dispose();
  });

  // 返回响应式属性和方法
  return {
    // 状态
    state: viewModel.reactiveState,
    isLoading: computed(() => viewModel.isLoading),
    hasError: computed(() => viewModel.hasError),
    errorMessage: computed(() => viewModel.errorMessage),
    isInitialized: computed(() => viewModel.isInitialized),

    // ViewModel实例（用于调用方法）
    viewModel,

    // 生命周期方法
    initialize: viewModel.initialize.bind(viewModel),
    dispose: viewModel.dispose.bind(viewModel),
    reset: viewModel.reset.bind(viewModel)
  };
}

// ==================== 类型工具 ====================

/**
 * 提取ViewModel的状态类型
 */
export type ViewModelStateOf<T> = T extends BaseViewModel<infer S> ? S : never;

/**
 * ViewModel工厂函数类型
 */
export type ViewModelFactory<T extends BaseViewModel> = new (...args: any[]) => T;
