/**
 * Storage Adapter Interface
 * 存储适配器接口定义
 */

export interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  ttl?: number;
}

export interface StorageOptions {
  ttl?: number;
  serialize?: boolean;
}

/**
 * Storage Adapter Interface
 */
export interface IStorageAdapter {
  /**
   * 获取值
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * 设置值
   */
  set<T>(key: string, value: T, options?: StorageOptions): Promise<void>;

  /**
   * 删除值
   */
  remove(key: string): Promise<void>;

  /**
   * 清空所有
   */
  clear(): Promise<void>;

  /**
   * 检查键是否存在
   */
  has(key: string): Promise<boolean>;

  /**
   * 获取所有键
   */
  keys(): Promise<string[]>;

  /**
   * 获取大小
   */
  size(): Promise<number>;
}
