/**
 * Database Storage Adapter
 * 基于Tauri Command的数据库存储实现
 */

import { invoke } from '@tauri-apps/api/core';
import { IStorageAdapter, StorageItem, StorageOptions } from './StorageAdapter';

export class DatabaseStorage implements IStorageAdapter {
  private tableName: string;

  constructor(tableName: string = 'storage') {
    this.tableName = tableName;
  }

  private async ensureTable(): Promise<void> {
    try {
      await invoke('storage_ensure_table', { table: this.tableName });
    } catch (error) {
      console.error('Failed to ensure storage table:', error);
    }
  }

  private async getRaw(key: string): Promise<StorageItem | null> {
    try {
      await this.ensureTable();

      const result = await invoke<StorageItem | null>('storage_get', {
        table: this.tableName,
        key
      });

      return result;
    } catch (error) {
      console.error('Failed to get from storage:', error);
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const item = await this.getRaw(key);

    if (!item) return null;

    // 检查TTL
    if (item.ttl) {
      const now = Date.now();
      if (now - item.timestamp > item.ttl) {
        await this.remove(key);
        return null;
      }
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      await this.ensureTable();

      const item: StorageItem = {
        value,
        timestamp: Date.now(),
        ttl: options?.ttl
      };

      await invoke('storage_set', {
        table: this.tableName,
        key,
        value: item
      });
    } catch (error) {
      console.error('Failed to set to storage:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await invoke('storage_remove', {
        table: this.tableName,
        key
      });
    } catch (error) {
      console.error('Failed to remove from storage:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await invoke('storage_clear', { table: this.tableName });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    const item = await this.getRaw(key);
    return item !== null;
  }

  async keys(): Promise<string[]> {
    try {
      await this.ensureTable();

      return await invoke<string[]>('storage_keys', {
        table: this.tableName
      });
    } catch (error) {
      console.error('Failed to get storage keys:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    try {
      return await invoke<number>('storage_size', {
        table: this.tableName
      });
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return 0;
    }
  }
}
