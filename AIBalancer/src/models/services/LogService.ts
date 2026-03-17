import { LogRepository } from '../repositories/LogRepository';
import { LogEntry, LogQueryFilter, LogSystemConfig, LogFileInfo } from '../entities';

export class LogService {
  private repository: LogRepository;

  constructor() {
    this.repository = new LogRepository();
  }

  /**
   * Query logs with filter
   */
  async queryLogs(filter: LogQueryFilter): Promise<LogEntry[]> {
    return this.repository.queryLogs(filter);
  }

  /**
   * Get current configuration
   */
  async getConfig(): Promise<LogSystemConfig> {
    return this.repository.getConfig();
  }

  /**
   * Save configuration
   */
  async saveConfig(config: LogSystemConfig): Promise<void> {
    await this.repository.saveConfig(config);
  }

  /**
   * List all log files
   */
  async listLogFiles(): Promise<LogFileInfo[]> {
    return this.repository.listLogFiles();
  }

  /**
   * Export logs to file
   */
  async exportLogs(
    filter: LogQueryFilter,
    format: 'json' | 'csv' | 'text',
  ): Promise<{ content: string; filename: string }> {
    return this.repository.exportLogs(filter, format);
  }

  /**
   * Clean old logs
   */
  async cleanOldLogs(): Promise<{ deleted: number; freedBytes: number }> {
    return this.repository.cleanOldLogs();
  }

  /**
   * Download exported logs to client
   */
  async downloadExport(
    filter: LogQueryFilter,
    format: 'json' | 'csv' | 'text',
  ): Promise<void> {
    const result = await this.exportLogs(filter, format);
    const blob = new Blob([result.content], { type: this.getContentType(format) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'text':
        return 'text/plain';
      default:
        return 'text/plain';
    }
  }
}

// 单例实例
export const logService = new LogService();
