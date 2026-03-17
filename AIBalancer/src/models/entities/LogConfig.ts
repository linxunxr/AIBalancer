import { LogLevel, LogMode, LogSource, LogRotationConfig, LogExportConfig } from './LogEntry';

export interface LogSystemConfig {
  mode: LogMode;
  defaultLevel: LogLevel;
  consoleOutput: boolean;
  fileOutput: boolean;
  rotation: LogRotationConfig;
  export: LogExportConfig;
  sources: {
    [key in LogSource]: LogLevel;
  };
}

export const DefaultLogConfig: LogSystemConfig = {
  mode: (import.meta as any).env.DEV ? LogMode.DEVELOPMENT : LogMode.PRODUCTION,
  defaultLevel: LogLevel.INFO,
  consoleOutput: true,
  fileOutput: true,
  rotation: {
    enabled: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    compression: true,
    compressionLevel: 6,
    retentionDays: 30,
  },
  export: {
    format: 'json',
    includeLevel: true,
    includeSource: true,
    includeModule: true,
    includeDetails: false,
    timeFormat: 'yyyy-MM-dd HH:mm:ss.SSS',
  },
  sources: {
    [LogSource.SYSTEM]: LogLevel.INFO,
    [LogSource.BALANCE]: LogLevel.DEBUG,
    [LogSource.API]: LogLevel.INFO,
    [LogSource.DATABASE]: LogLevel.WARN,
    [LogSource.UI]: LogLevel.INFO,
    [LogSource.UPDATE]: LogLevel.INFO,
    [LogSource.PLUGIN]: LogLevel.DEBUG,
  },
};

export class LogConfigEntity {
  constructor(
    public config: LogSystemConfig = DefaultLogConfig,
  ) {}

  update(newConfig: Partial<LogSystemConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      rotation: {
        ...this.config.rotation,
        ...(newConfig.rotation || {}),
      },
      export: {
        ...this.config.export,
        ...(newConfig.export || {}),
      },
      sources: {
        ...this.config.sources,
        ...(newConfig.sources || {}),
      },
    };
  }

  getSourceLevel(source: LogSource): LogLevel {
    return this.config.sources[source] || this.config.defaultLevel;
  }

  shouldLog(source: LogSource, level: LogLevel): boolean {
    const levelPriority: Record<LogLevel, number> = {
      [LogLevel.TRACE]: 0,
      [LogLevel.DEBUG]: 1,
      [LogLevel.INFO]: 2,
      [LogLevel.WARN]: 3,
      [LogLevel.ERROR]: 4,
      [LogLevel.FATAL]: 5,
    };

    const sourceLevel = this.getSourceLevel(source);
    return levelPriority[level] >= levelPriority[sourceLevel];
  }

  isDevelopmentMode(): boolean {
    return this.config.mode === LogMode.DEVELOPMENT;
  }

  isProductionMode(): boolean {
    return this.config.mode === LogMode.PRODUCTION;
  }
}
