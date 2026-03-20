/**
 * Local Storage Adapter
 * 浏览器本地存储实现
 */

import { IStorageAdapter, StorageItem, StorageOptions } from './StorageAdapter';

export class LocalStorage implements IStorageAdapter {
  private prefix: string;

  constructor(prefix: string = 'app_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private async getRaw(key: string): Promise<StorageItem | null> {
    const value = localStorage.getItem(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private setRaw(key: string, value: StorageItem): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async get<T>(key: string): Promise<T | null> {
    const item = await this.getRaw(this.getKey(key));

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
    const item: StorageItem = {
      value,
      timestamp: Date.now(),
      ttl: options?.ttl
    };

    this.setRaw(this.getKey(key), item);
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    await Promise.all(keys.map(key => this.remove(key)));
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  async keys(): Promise<string[]> {
    const result: string[] = [];
    const prefixLength = this.prefix.length;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        result.push(key.slice(prefixLength));
      }
    }

    return result;
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }
}
