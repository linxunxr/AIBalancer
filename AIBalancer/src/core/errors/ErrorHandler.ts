/**
 * Error Handler
 * 统一错误处理和错误类型定义
 */

export enum ErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  API_ERROR = 'API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CANCELLED_ERROR = 'CANCELLED_ERROR'
}

export interface ErrorContext {
  [key: string]: any;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.originalError = originalError;

    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      originalError: this.originalError?.message
    };
  }

  toString(): string {
    return `[${this.code}] ${this.message}`;
  }
}

/**
 * Error Handler Class
 * 提供错误处理和日志记录功能
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Array<(error: AppError) => void> = [];

  private constructor() {
    // 私有构造函数
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 处理错误
   */
  handle(error: unknown, context?: ErrorContext): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(
        error.message,
        ErrorCode.UNKNOWN_ERROR,
        context,
        error
      );
    } else {
      appError = new AppError(
        String(error),
        ErrorCode.UNKNOWN_ERROR,
        context
      );
    }

    // 记录错误
    this.logError(appError);

    // 通知监听器
    this.notifyCallbacks(appError);

    return appError;
  }

  /**
   * 创建错误
   */
  create(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    context?: ErrorContext
  ): AppError {
    return new AppError(message, code, context);
  }

  /**
   * 包装异步函数，自动处理错误
   */
  async wrapAsync<T>(
    operation: () => Promise<T>,
    errorMessage?: string,
    errorCode?: ErrorCode
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const appError = this.handle(error);
      throw appError;
    }
  }

  /**
   * 包装同步函数，自动处理错误
   */
  wrapSync<T>(
    operation: () => T,
    errorMessage?: string,
    errorCode?: ErrorCode
  ): T {
    try {
      return operation();
    } catch (error) {
      const appError = this.handle(error);
      throw appError;
    }
  }

  /**
   * 注册错误回调
   */
  onError(callback: (error: AppError) => void): () => void {
    this.errorCallbacks.push(callback);

    // 返回取消函数
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 记录错误
   */
  private logError(error: AppError): void {
    console.error('[ErrorHandler]', error.toString());
    if (error.context) {
      console.error('[ErrorHandler] Context:', error.context);
    }
    if (error.stack) {
      console.error('[ErrorHandler] Stack:', error.stack);
    }
  }

  /**
   * 通知所有回调
   */
  private notifyCallbacks(error: AppError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('[ErrorHandler] Error in callback:', err);
      }
    });
  }

  /**
   * 判断是否为可重试的错误
   */
  isRetryable(error: AppError): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.API_ERROR
    ];
    return retryableCodes.includes(error.code);
  }

  /**
   * 判断是否为用户错误
   */
  isUserError(error: AppError): boolean {
    const userErrorCodes = [
      ErrorCode.VALIDATION_ERROR,
      ErrorCode.AUTH_ERROR,
      ErrorCode.PERMISSION_ERROR
    ];
    return userErrorCodes.includes(error.code);
  }
}

/**
 * 导出单例
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * 便捷函数
 */
export function handleError(error: unknown, context?: ErrorContext): AppError {
  return errorHandler.handle(error, context);
}

export function createError(
  message: string,
  code?: ErrorCode,
  context?: ErrorContext
): AppError {
  return errorHandler.create(message, code, context);
}
