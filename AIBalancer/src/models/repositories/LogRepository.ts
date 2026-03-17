import { invoke } from '@tauri-apps/api/core';
import { LogEntry, LogQueryFilter, LogFileInfo, LogSystemConfig } from '../entities';

export class LogRepository {
  /**
   * 查询日志列表
   */
  async queryLogs(filter: LogQueryFilter): Promise<LogEntry[]> {
    return invoke<LogEntry[]>('get_logs', {
      filter: {
        ...filter,
        startTime: filter.startTime?.toISOString(),
        endTime: filter.endTime?.toISOString(),
      },
    });
  }

  /**
   * 获取日志配置
   */
  async getConfig(): Promise<LogSystemConfig> {
    return invoke<LogSystemConfig>('get_log_config');
  }

  /**
   * 保存日志配置
   */
  async saveConfig(config: LogSystemConfig): Promise<void> {
    await invoke<void>('save_log_config', { config });
  }

  /**
   * 列出所有日志文件
   */
  async listLogFiles(): Promise<LogFileInfo[]> {
    return invoke<LogFileInfo[]>('list_log_files');
  }

  /**
   * 导出日志
   */
  async exportLogs(filter: LogQueryFilter, format: 'json' | 'csv' | 'text'): Promise<{ content: string; filename: string }> {
    return invoke<{ content: string; filename: string }>('export_logs', {
      filter: {
        ...filter,
        startTime: filter.startTime?.toISOString(),
        endTime: filter.endTime?.toISOString(),
      },
      format,
    });
  }

  /**
   * 清理过期日志
   */
  async cleanOldLogs(): Promise<{ deleted: number; freedBytes: number }> {
    return invoke<{ deleted: number; freedBytes: number }>('clean_old_logs');
  }
}
