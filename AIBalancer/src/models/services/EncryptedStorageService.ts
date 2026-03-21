/**
 * 数据库加密存储服务
 * 提供对敏感数据的额外加密保护
 */

import { invoke } from '@tauri-apps/api/core';
import { encrypt_api_key, decrypt_api_key } from '@tauri-apps/api/core';

/**
 * 加密存储配置
 */
export interface EncryptedStorageConfig {
  /** 是否启用数据库加密 */
  enabled: boolean;
  /** 加密级别 */
  level: 'standard' | 'high' | 'maximum';
  /** 最后更新时间 */
  updatedAt: string;
}

/**
 * 加密存储服务
 */
export class EncryptedStorageService {
  private static instance: EncryptedStorageService;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): EncryptedStorageService {
    if (!EncryptedStorageService.instance) {
      EncryptedStorageService.instance = new EncryptedStorageService();
    }
    return EncryptedStorageService.instance;
  }

  /**
   * 加密敏感数据
   * @param data 要加密的数据
   * @returns 加密后的数据
   */
  async encrypt(data: string): Promise<string> {
    try {
      return await invoke<string>('crypto_encrypt', { data });
    } catch (error) {
      console.error('加密数据失败:', error);
      throw new Error('加密数据失败');
    }
  }

  /**
   * 解密敏感数据
   * @param encryptedData 加密的数据
   * @returns 解密后的数据
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      return await invoke<string>('crypto_decrypt', { data: encryptedData });
    } catch (error) {
      console.error('解密数据失败:', error);
      throw new Error('解密数据失败');
    }
  }

  /**
   * 加密对象中的敏感字段
   * @param obj 对象
   * @param sensitiveFields 敏感字段列表
   * @returns 加密后的对象
   */
  async encryptSensitiveFields<T extends Record<string, any>>(
    obj: T,
    sensitiveFields: string[]
  ): Promise<T> {
    const result = { ...obj };

    for (const field of sensitiveFields) {
      if (result[field] !== undefined && result[field] !== null) {
        const value = typeof result[field] === 'string'
          ? result[field]
          : JSON.stringify(result[field]);
        result[field] = await this.encrypt(value) as any;
      }
    }

    return result;
  }

  /**
   * 解密对象中的敏感字段
   * @param obj 对象
   * @param sensitiveFields 敏感字段列表
   * @returns 解密后的对象
   */
  async decryptSensitiveFields<T extends Record<string, any>>(
    obj: T,
    sensitiveFields: string[]
  ): Promise<T> {
    const result = { ...obj };

    for (const field of sensitiveFields) {
      if (result[field] !== undefined && result[field] !== null) {
        try {
          const decrypted = await this.decrypt(result[field] as string);
          // 尝试解析为JSON，否则返回字符串
          try {
            result[field] = JSON.parse(decrypted) as any;
          } catch {
            result[field] = decrypted as any;
          }
        } catch {
          // 解密失败，保留原值
          console.warn(`字段 ${field} 解密失败`);
        }
      }
    }

    return result;
  }

  /**
   * 加密批量数据
   * @param items 数据项列表
   * @param sensitiveFields 敏感字段列表
   * @returns 加密后的数据
   */
  async encryptBatch<T extends Record<string, any>>(
    items: T[],
    sensitiveFields: string[]
  ): Promise<T[]> {
    return Promise.all(
      items.map(item => this.encryptSensitiveFields(item, sensitiveFields))
    );
  }

  /**
   * 解密批量数据
   * @param items 数据项列表
   * @param sensitiveFields 敏感字段列表
   * @returns 解密后的数据
   */
  async decryptBatch<T extends Record<string, any>>(
    items: T[],
    sensitiveFields: string[]
  ): Promise<T[]> {
    return Promise.all(
      items.map(item => this.decryptSensitiveFields(item, sensitiveFields))
    );
  }

  /**
   * 获取加密配置
   */
  async getConfig(): Promise<EncryptedStorageConfig | null> {
    try {
      return await invoke<EncryptedStorageConfig | null>('get_encryption_config');
    } catch {
      return null;
    }
  }

  /**
   * 保存加密配置
   */
  async saveConfig(config: EncryptedStorageConfig): Promise<void> {
    await invoke('save_encryption_config', { config });
  }

  /**
   * 验证加密状态
   */
  async verifyEncryption(): Promise<{ valid: boolean; message: string }> {
    try {
      return await invoke<{ valid: boolean; message: string }>('verify_encryption');
    } catch (error) {
      return {
        valid: false,
        message: `验证失败: ${error}`
      };
    }
  }
}

// 导出单例
export const encryptedStorage = EncryptedStorageService.getInstance();
