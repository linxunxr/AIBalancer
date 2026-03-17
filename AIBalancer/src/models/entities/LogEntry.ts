export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export enum LogSource {
  SYSTEM = 'system',
  BALANCE = 'balance',
  API = 'api',
  DATABASE = 'database',
  UI = 'ui',
  UPDATE = 'update',
  PLUGIN = 'plugin',
}

export enum LogMode {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: LogSource;
  module: string;
  message: string;
  details?: Record<string, any>;
  stackTrace?: string;
  threadId?: string;
  correlationId?: string;
}

export interface LogFileInfo {
  filename: string;
  path: string;
  size: number;
  created: Date;
  modified: Date;
  compressed: boolean;
  logCount: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface LogQueryFilter {
  startTime?: Date;
  endTime?: Date;
  levels?: LogLevel[];
  sources?: LogSource[];
  modules?: string[];
  keywords?: string[];
  limit?: number;
  offset?: number;
}

export interface LogRotationConfig {
  enabled: boolean;
  maxSize: number; // 字节数
  maxFiles: number;
  compression: boolean;
  compressionLevel: number; // 1-9
  retentionDays: number;
}

export interface LogExportConfig {
  format: 'json' | 'csv' | 'text';
  includeLevel: boolean;
  includeSource: boolean;
  includeModule: boolean;
  includeDetails: boolean;
  timeFormat: string;
}

// 实体类实现
export class LogEntryEntity implements LogEntry {
  constructor(
    public id: string,
    public timestamp: Date,
    public level: LogLevel,
    public source: LogSource,
    public module: string,
    public message: string,
    public details?: Record<string, any>,
    public stackTrace?: string,
    public threadId?: string,
    public correlationId?: string,
  ) {}

  static create(params: Omit<LogEntry, 'id'>): LogEntryEntity {
    return new LogEntryEntity(
      crypto.randomUUID(),
      params.timestamp,
      params.level,
      params.source,
      params.module,
      params.message,
      params.details,
      params.stackTrace,
      params.threadId,
      params.correlationId,
    );
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      timestamp: this.timestamp.toISOString(),
      level: this.level,
      source: this.source,
      module: this.module,
      message: this.message,
      details: this.details,
      stackTrace: this.stackTrace,
      threadId: this.threadId,
      correlationId: this.correlationId,
    };
  }

  format(format: 'text' | 'json' | 'csv'): string {
    switch (format) {
      case 'text':
        return `[${this.timestamp.toISOString()}] [${this.level}] [${this.source}/${this.module}] ${this.message}`;
      case 'json':
        return JSON.stringify(this.toJSON(), null, 2);
      case 'csv':
        return `"${this.timestamp.toISOString()}","${this.level}","${this.source}","${this.module}","${this.message.replace(/"/g, '""')}"`;
      default:
        return this.message;
    }
  }
}
