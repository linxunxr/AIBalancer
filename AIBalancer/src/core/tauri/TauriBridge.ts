/**
 * Tauri Bridge
 * 前端与Rust后端的桥接层
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

/**
 * Tauri Command Names
 */
export const COMMANDS = {
  // Database commands
  DB_EXECUTE_SQL: 'execute_sql',
  DB_QUERY: 'db_query',

  // Storage commands
  STORAGE_ENSURE_TABLE: 'storage_ensure_table',
  STORAGE_GET: 'storage_get',
  STORAGE_SET: 'storage_set',
  STORAGE_REMOVE: 'storage_remove',
  STORAGE_CLEAR: 'storage_clear',
  STORAGE_KEYS: 'storage_keys',
  STORAGE_SIZE: 'storage_size',

  // Logging commands
  LOG_GET_ENTRIES: 'log_get_entries',
  LOG_EXPORT: 'log_export',
  LOG_CLEAR: 'log_clear',
  LOG_GET_CONFIG: 'log_get_config',
  LOG_SET_CONFIG: 'log_set_config',

  // App commands
  APP_GET_VERSION: 'app_get_version',
  APP_CHECK_UPDATES: 'app_check_updates',
  APP_MINIMIZE: 'app_minimize',
  APP_HIDE: 'app_hide',
  APP_SHOW: 'app_show',
  APP_QUIT: 'app_quit',
} as const;

/**
 * Tauri Event Names
 */
export const EVENTS = {
  LOG_ENTRY_ADDED: 'log-entry-added',
  BALANCE_CHANGED: 'balance-changed',
  ALERT_TRIGGERED: 'alert-triggered',
  UPDATE_AVAILABLE: 'update-available',
  APP_READY: 'app-ready',
} as const;

/**
 * Command Result Type
 */
export type CommandResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Tauri Bridge Class
 */
export class TauriBridge {
  private static instance: TauriBridge;
  private eventListeners: Map<string, Array<UnsubscribeFn>> = new Map();

  private constructor() {
    // 私有构造函数
  }

  static getInstance(): TauriBridge {
    if (!TauriBridge.instance) {
      TauriBridge.instance = new TauriBridge();
    }
    return TauriBridge.instance;
  }

  /**
   * 执行Tauri命令
   */
  async command<T = any>(
    command: string,
    args?: Record<string, any>
  ): Promise<T> {
    try {
      return await invoke<T>(command, args);
    } catch (error) {
      console.error(`[TauriBridge] Command failed: ${command}`, error);
      throw error;
    }
  }

  /**
   * 安全执行命令（带错误处理）
   */
  async safeCommand<T = any>(
    command: string,
    args?: Record<string, any>
  ): Promise<CommandResult<T>> {
    try {
      const data = await this.command<T>(command, args);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 监听事件
   */
  on<T = any>(
    eventName: string,
    callback: (payload: T) => void
  ): UnsubscribeFn {
    const unsubscribe = listen<T>(eventName, (event) => {
      callback(event.payload);
    });

    // 添加到监听器列表
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }

    // 创建包装的取消函数
    const wrappedUnsubscribe = async () => {
      const result = await unsubscribe;
      result();
    };

    this.eventListeners.get(eventName)!.push(wrappedUnsubscribe);

    return () => {
      // 取消监听
      wrappedUnsubscribe();
    };
  }

  /**
   * 取消所有事件监听
   */
  removeAllListeners(): void {
    this.eventListeners.forEach((listeners) => {
      listeners.forEach(unsubscribe => {
        unsubscribe();
      });
    });
    this.eventListeners.clear();
  }

  /**
   * 数据库操作
   */
  async executeSql(sql: string, params?: any[]): Promise<any[]> {
    return this.command(COMMANDS.DB_EXECUTE_SQL, { sql, params });
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return this.command(COMMANDS.DB_QUERY, { sql, params });
  }

  /**
   * 检查是否在Tauri环境中运行
   */
  static isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
  }
}

/**
 * Unsubscribe function type
 */
export type UnsubscribeFn = () => Promise<void> | void;

/**
 * 导出单例
 */
export const tauriBridge = TauriBridge.getInstance();

/**
 * 便捷函数
 */
export function invokeCommand<T = any>(
  command: string,
  args?: Record<string, any>
): Promise<T> {
  return tauriBridge.command<T>(command, args);
}

export function onEvent<T = any>(
  event: string,
  callback: (payload: T) => void
): UnsubscribeFn {
  return tauriBridge.on(event, callback);
}
