/**
 * 代理配置服务
 * 管理网络代理设置的获取、保存和测试
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * 代理配置
 */
export interface ProxyConfig {
  /** 是否启用代理 */
  enabled: boolean;
  /** 代理类型 */
  proxy_type: ProxyType;
  /** 代理地址 */
  host: string;
  /** 代理端口 */
  port: number;
  /** 代理协议 */
  protocol: 'http' | 'https' | 'socks5';
  /** 认证用户名 */
  username?: string;
  /** 认证密码 */
  password?: string;
  /** 绕过代理的域名列表 */
  bypass_list: string[];
  /** 排除的域名列表 */
  exclude_list: string[];
  /** 是否全局代理 */
  global: boolean;
  /** 是否启用认证 */
  auth_enabled: boolean;
}

/**
 * 代理类型
 */
export enum ProxyType {
  Http = 'http',
  Https = 'https',
  Socks5 = 'socks5',
  System = 'system',
  None = 'none',
}

/**
 * 代理测试结果
 */
export interface ProxyTestResult {
  /** 是否成功 */
  success: boolean;
  /** 响应时间（毫秒） */
  latency: number;
  /** 错误信息 */
  error?: string;
  /** 响应内容 */
  response?: string;
}

/**
 * 代理状态
 */
export interface ProxyStatus {
  /** 是否启用 */
  enabled: boolean;
  /** 代理类型 */
  proxy_type: ProxyType;
  /** 连接状态 */
  connection_status: ConnectionStatus;
  /** 最后测试时间 */
  last_test?: string;
  /** 最后成功时间 */
  last_success?: string;
}

/**
 * 连接状态
 */
export enum ConnectionStatus {
  Connected = 'connected',
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Failed = 'failed',
  Timeout = 'timeout',
}

/**
 * 默认代理配置
 */
export const defaultProxyConfig: ProxyConfig = {
  enabled: false,
  proxy_type: ProxyType.None,
  host: '',
  port: 0,
  protocol: 'http',
  username: undefined,
  password: undefined,
  bypass_list: ['localhost', '127.0.0.1', '::1'],
  exclude_list: [],
  global: false,
  auth_enabled: false,
};

/**
 * 代理配置服务
 */
export class ProxyConfigService {
  private static instance: ProxyConfigService;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ProxyConfigService {
    if (!ProxyConfigService.instance) {
      ProxyConfigService.instance = new ProxyConfigService();
    }
    return ProxyConfigService.instance;
  }

  /**
   * 获取代理配置
   */
  async getConfig(): Promise<ProxyConfig> {
    try {
      const config = await invoke<ProxyConfig>('get_proxy_config');
      return config;
    } catch (error) {
      console.error('获取代理配置失败:', error);
      return defaultProxyConfig;
    }
  }

  /**
   * 保存代理配置
   */
  async saveConfig(config: ProxyConfig): Promise<void> {
    await invoke('save_proxy_config', { config });
    console.log('代理配置已保存');
  }

  /**
   * 测试代理连接
   */
  async testConnection(config: ProxyConfig): Promise<ProxyTestResult> {
    try {
      const result = await invoke<ProxyTestResult>('test_proxy_connection', { config });
      return result;
    } catch (error) {
      return {
        success: false,
        latency: 0,
        error: `测试失败: ${error}`
      };
    }
  }

  /**
   * 获取代理状态
   */
  async getStatus(): Promise<ProxyStatus> {
    try {
      const status = await invoke<ProxyStatus>('get_proxy_status');
      return status;
    } catch (error) {
      console.error('获取代理状态失败:', error);
      return {
        enabled: false,
        proxy_type: ProxyType.None,
        connection_status: ConnectionStatus.Disconnected,
      };
    }
  }

  /**
   * 清除代理配置
   */
  async clearConfig(): Promise<void> {
    await invoke('clear_proxy_config');
    console.log('代理配置已清除');
  }

  /**
   * 检查域名是否应该使用代理
   */
  async shouldUseProxy(host: string): Promise<boolean> {
    const config = await this.getConfig();
    if (!config.enabled) {
      return false;
    }

    // 检查是否在排除列表中
    for (const pattern of config.exclude_list) {
      if (this.matchPattern(host, pattern)) {
        return false;
      }
    }

    // 如果是绕过列表中的域名，不使用代理
    for (const pattern of config.bypass_list) {
      if (this.matchPattern(host, pattern)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 匹配域名模式
   */
  private matchPattern(host: string, pattern: string): boolean {
    if (pattern.startsWith('*')) {
      return host.endsWith(pattern.slice(1));
    }
    return host === pattern || host.endsWith(`.${pattern}`);
  }

  /**
   * 验证代理配置
   */
  validateConfig(config: ProxyConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.enabled) {
      if (!config.host.trim()) {
        errors.push('代理地址不能为空');
      }

      if (config.port <= 0 || config.port > 65535) {
        errors.push('代理端口必须在1-65535之间');
      }

      if (!['http', 'https', 'socks5'].includes(config.protocol)) {
        errors.push('无效的代理协议');
      }

      if (config.auth_enabled) {
        if (!config.username?.trim()) {
          errors.push('认证用户名不能为空');
        }
        if (!config.password) {
          errors.push('认证密码不能为空');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 构建代理URL
   */
  buildProxyUrl(config: ProxyConfig): string {
    if (!config.enabled || !config.host) {
      return '';
    }

    const auth = config.auth_enabled && config.username && config.password
      ? `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@`
      : '';

    return `${config.protocol}://${auth}${config.host}:${config.port}`;
  }

  /**
   * 从URL解析代理配置
   */
  parseProxyUrl(url: string): Partial<ProxyConfig> {
    if (!url) {
      return {};
    }

    try {
      const parsed = new URL(url);
      return {
        protocol: parsed.protocol.replace(':', '') as ProxyConfig['protocol'],
        host: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port, 10) : undefined,
        username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
        auth_enabled: !!(parsed.username && parsed.password),
      };
    } catch {
      return {};
    }
  }
}

// 导出单例
export const proxyConfigService = ProxyConfigService.getInstance();
