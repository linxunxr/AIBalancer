/**
 * Settings Repository
 * 应用设置数据仓库
 */

import { BaseRepository, RepositoryError } from './BaseRepository';
import { AppSettings, AppSettingsEntity } from '../entities/AppSettings';
import { invoke } from '@tauri-apps/api/core';

export class SettingsRepository extends BaseRepository<AppSettings, string> {
  protected tableName = 'settings';

  protected toEntity(row: any): AppSettings {
    return AppSettingsEntity.fromJSON(row);
  }

  protected fromEntity(entity: AppSettings): Record<string, any> {
    // 如果是 AppSettingsEntity 实例，调用其 toJSON 方法
    if ('toJSON' in entity && typeof entity.toJSON === 'function') {
      return entity.toJSON();
    }
    // 否则直接返回
    return entity as Record<string, any>;
  }

  protected async executeQuery(sql: string, params?: any[]): Promise<any[]> {
    try {
      return await invoke<any[]>('execute_sql', { sql, params });
    } catch (error) {
      throw new RepositoryError(`SQL execution failed: ${sql}`, 'QUERY_ERROR', error);
    }
  }

  protected async executeCommand(sql: string, params?: any[]): Promise<number> {
    try {
      await invoke('execute_sql', { sql, params });
      return 1;
    } catch (error) {
      throw new RepositoryError(`SQL command failed: ${sql}`, 'COMMAND_ERROR', error);
    }
  }

  /**
   *.获取应用设置
   */
  async getAppSettings(): Promise<AppSettings> {
    try {
      const settings = await this.findById('app-settings');
      if (settings) {
        return settings;
      }

      // 如果没有设置，创建默认设置
      const defaultSettings = AppSettingsEntity.getDefault();
      await this.create(defaultSettings);
      return defaultSettings;
    } catch (error) {
      throw new RepositoryError('Failed to get app settings', 'GET_SETTINGS_ERROR', error);
    }
  }

  /**
   * 保存应用设置
   */
  async saveAppSettings(settings: AppSettings): Promise<AppSettings> {
    try {
      const existing = await this.findById('app-settings');

      if (existing) {
        return await this.update('app-settings', settings);
      } else {
        return await this.create(settings);
      }
    } catch (error) {
      throw new RepositoryError('Failed to save app settings', 'SAVE_SETTINGS_ERROR', error);
    }
  }

  /**
   * 更新单个设置项
   */
  async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<AppSettings> {
    const settings = await this.getAppSettings();
    (settings as any)[key] = value;
    return await this.saveAppSettings(settings);
  }

  /**
   * 获取单个设置项
   */
  async getSetting<K extends keyof AppSettings>(
    key: K
  ): Promise<AppSettings[K]> {
    const settings = await this.getAppSettings();
    return settings[key];
  }

  /**
   * 重置为默认设置
   */
  async resetToDefaults(): Promise<AppSettings> {
    const defaultSettings = AppSettingsEntity.getDefault();
    return await this.saveAppSettings(defaultSettings);
  }

  /**
   * 验证设置
   */
  async validateSettings(settings: AppSettings): Promise<{ valid: boolean; errors: string[] }> {
    // 如果是 AppSettingsEntity 实例，调用其 validate 方法
    if ('validate' in settings && typeof settings.validate === 'function') {
      return (settings as AppSettingsEntity).validate();
    }
    // 默认验证
    return { valid: true, errors: [] };
  }
}
