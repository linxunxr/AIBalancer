/**
 * Global Error Handler
 * 全局错误处理器 - 捕获所有未处理的错误并上报到后端
 * 完全隐藏，用户无感知
 */

import { invoke } from '@tauri-apps/api/core';

export interface ErrorReport {
  type: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
  url: string;
  userAgent: string;
}

export interface GlobalErrorHandlerOptions {
  /** 是否启用错误上报 */
  enableReporting?: boolean;
  /** 是否在开发环境打印错误 */
  debugMode?: boolean;
  /** 自定义错误过滤，返回 false 则不上报 */
  filter?: (error: Error) => boolean;
  /** 错误上报前的回调 */
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private initialized = false;
  private options: Required<GlobalErrorHandlerOptions>;
  private errorCount = 0;
  private lastErrorTime = 0;

  private defaultOptions: Required<GlobalErrorHandlerOptions> = {
    enableReporting: true,
    debugMode: import.meta.env.DEV,
    filter: () => true,
    beforeSend: (report) => report,
  };

  private constructor(options?: GlobalErrorHandlerOptions) {
    this.options = { ...this.defaultOptions, ...options };
  }

  static getInstance(options?: GlobalErrorHandlerOptions): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler(options);
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * 初始化全局错误处理
   */
  init(): void {
    if (this.initialized) {
      console.warn('GlobalErrorHandler already initialized');
      return;
    }

    // 捕获 JavaScript 错误
    window.addEventListener('error', this.handleError.bind(this));

    // 捕获未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));

    // 捕获 Vue 错误（如果在 Vue 应用中）
    this.setupVueErrorHandler();

    // 捕获资源加载错误
    window.addEventListener('error', this.handleResourceError.bind(this), true);

    this.initialized = true;

    if (this.options.debugMode) {
      console.info('[GlobalErrorHandler] Initialized');
    }
  }

  /**
   * 处理 JavaScript 错误
   */
  private handleError(event: ErrorEvent): void {
    const error = event.error || new Error(event.message);

    // 忽略资源加载错误（由 handleResourceError 处理）
    if (event.target !== window) {
      return;
    }

    this.captureError(error, 'javascript', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    // 阻止默认错误显示（生产环境）
    if (!this.options.debugMode) {
      event.preventDefault();
    }
  }

  /**
   * 处理 Promise 拒绝
   */
  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    this.captureError(error, 'promise');

    // 阻止默认错误显示（生产环境）
    if (!this.options.debugMode) {
      event.preventDefault();
    }
  }

  /**
   * 处理资源加载错误
   */
  private handleResourceError(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // 只处理资源加载错误
    if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
      const src = target.getAttribute('src') || target.getAttribute('href');
      this.captureError(
        new Error(`Resource failed to load: ${src}`),
        'resource',
        { tagName: target.tagName, src }
      );
    }
  }

  /**
   * 设置 Vue 错误处理器
   */
  private setupVueErrorHandler(): void {
    // 在 Vue 应用挂载后设置
    const checkVue = () => {
      const vueApp = (window as any).__VUE_APP__;
      if (vueApp && vueApp.config) {
        vueApp.config.errorHandler = (error: Error, instance: any, info: string) => {
          this.captureError(error, 'vue', {
            component: instance?.$options?.name || 'Unknown',
            lifecycleHook: info,
          });
        };
      }
    };

    // 延迟检查 Vue 应用
    setTimeout(checkVue, 100);
  }

  /**
   * 捕获并上报错误
   */
  async captureError(
    error: Error,
    type: string = 'unknown',
    context?: Record<string, any>
  ): Promise<string | null> {
    // 防止错误洪泛（同一错误短时间内多次上报）
    const now = Date.now();
    if (now - this.lastErrorTime < 1000 && this.errorCount > 10) {
      return null;
    }
    this.lastErrorTime = now;
    this.errorCount++;

    // 应用过滤器
    if (!this.options.filter(error)) {
      return null;
    }

    // 构建错误报告
    let report: ErrorReport = {
      type,
      message: error.message || 'Unknown error',
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // 应用发送前处理
    if (this.options.beforeSend) {
      const processed = this.options.beforeSend(report);
      if (!processed) {
        return null;
      }
      report = processed;
    }

    // 在开发环境打印错误
    if (this.options.debugMode) {
      console.error('[GlobalErrorHandler]', type, error, context);
    }

    // 上报到后端
    if (this.options.enableReporting) {
      try {
        const reportId = await invoke<string>('log_error', {
          errorType: type,
          message: report.message,
          stackTrace: report.stack,
          context: report.context ? JSON.stringify(report.context) : null,
        });
        return reportId;
      } catch (e) {
        // 静默失败，不要因为上报失败而影响用户体验
        if (this.options.debugMode) {
          console.error('[GlobalErrorHandler] Failed to report error:', e);
        }
      }
    }

    return null;
  }

  /**
   * 手动捕获错误
   */
  async captureException(error: Error, context?: Record<string, any>): Promise<string | null> {
    return this.captureError(error, 'manual', context);
  }

  /**
   * 记录信息事件
   */
  async logInfo(source: string, message: string): Promise<void> {
    try {
      await invoke('log_info', { source, message });
    } catch {
      // 静默失败
    }
  }

  /**
   * 记录警告事件
   */
  async logWarning(source: string, message: string): Promise<void> {
    try {
      await invoke('log_warning', { source, message });
    } catch {
      // 静默失败
    }
  }

  /**
   * 跟踪事件
   */
  async trackEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    try {
      await invoke('track_event', {
        eventName,
        properties: properties ? JSON.stringify(properties) : null,
      });
    } catch {
      // 静默失败
    }
  }

  /**
   * 添加面包屑（用于调试上下文）
   */
  addBreadcrumb(message: string, data?: Record<string, any>): void {
    if (this.options.debugMode) {
      console.log('[Breadcrumb]', message, data);
    }
    // 可以扩展为保存到内存中，在错误发生时一起上报
  }
}

// 导出单例
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// 导出便捷函数
export const captureException = globalErrorHandler.captureException.bind(globalErrorHandler);
export const logInfo = globalErrorHandler.logInfo.bind(globalErrorHandler);
export const logWarning = globalErrorHandler.logWarning.bind(globalErrorHandler);
export const trackEvent = globalErrorHandler.trackEvent.bind(globalErrorHandler);
export const addBreadcrumb = globalErrorHandler.addBreadcrumb.bind(globalErrorHandler);

// 自动初始化（在 DOM 加载后）
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      globalErrorHandler.init();
    });
  } else {
    // DOM 已加载
    setTimeout(() => globalErrorHandler.init(), 0);
  }
}
