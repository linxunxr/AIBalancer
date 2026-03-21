/**
 * Monitoring Service
 * 监控服务 - 定期检查余额和使用量
 */

import { BalanceService } from './BalanceService';
import { UsageRepository } from '../repositories/UsageRepository';
import { AlertService } from './AlertService';
import { PlatformType } from '../entities';
import { AppError, ErrorCode } from '../../core/errors';

export interface MonitoringConfig {
  enabled: boolean;
  checkInterval: number;
  alertEnabled: boolean;
}

export interface MonitoringStatus {
  isRunning: boolean;
  lastCheck?: Date;
  nextCheck?: Date;
  config: MonitoringConfig;
}

export class MonitoringService {
  private balanceService: BalanceService;
  private usageRepository: UsageRepository;
  private alertService: AlertService;

  private monitoringTimer: number | null = null;
  private isRunning = false;
  private lastCheck: Date | null = null;

  private defaultConfig: MonitoringConfig = {
    enabled: true,
    checkInterval: 300000, // 5分钟
    alertEnabled: true
  };

  constructor(
    balanceService?: BalanceService,
    usageRepository?: UsageRepository,
    alertService?: AlertService
  ) {
    this.balanceService = balanceService || new BalanceService();
    this.usageRepository = usageRepository || new UsageRepository();
    this.alertService = alertService || new AlertService();
  }

  /**
   * 开始监控
   */
  async startMonitoring(config?: Partial<MonitoringConfig>): Promise<void> {
    if (this.isRunning) {
      throw new AppError('监控已在运行中', ErrorCode.VALIDATION_ERROR);
    }

    const mergedConfig = { ...this.defaultConfig, ...config };

    if (!mergedConfig.enabled) {
      return;
    }

    this.isRunning = true;
    this.lastCheck = new Date();

    // 立即执行一次检查
    await this.performCheck(mergedConfig);

    // 设置定时检查
    this.setMonitoringInterval(mergedConfig);
  }

  /**
   * 停止监控
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    if (this.monitoringTimer !== null) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    this.isRunning = false;
  }

  /**
   * 获取监控状态
   */
  getStatus(): MonitoringStatus {
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck || undefined,
      nextCheck: this.isRunning && this.monitoringTimer
        ? new Date(Date.now() + this.defaultConfig.checkInterval)
        : undefined,
      config: this.defaultConfig
    };
  }

  /**
   * 更新监控配置
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };

    if (this.isRunning) {
      // 重启监控以应用新配置
      this.stopMonitoring().then(() => {
        this.startMonitoring(this.defaultConfig);
      });
    }
  }

  /**
   * 手动执行检查
   */
  async performManualCheck(): Promise<void> {
    await this.performCheck(this.defaultConfig);
  }

  private setMonitoringInterval(config: MonitoringConfig): void {
    this.monitoringTimer = window.setInterval(async () => {
      try {
        await this.performCheck(config);
      } catch (error) {
        console.error('[MonitoringService] Check failed:', error);
      }
    }, config.checkInterval);
  }

  private async performCheck(config: MonitoringConfig): Promise<void> {
    try {
      this.lastCheck = new Date();

      // 检查所有平台的余额
      const platforms = Object.values(PlatformType);

      // 检查低余额
      if (config.alertEnabled) {
        const lowBalances = await this.balanceService.getLowBalances(50);
        for (const balance of lowBalances) {
          await this.alertService.triggerLowBalanceAlert(balance);
        }
      }

      // 检查预算
      if (config.alertEnabled) {
        const today = new Date();

        for (const platform of platforms) {
          const monthUsage = await this.usageRepository.getMonthUsage(
            today.getFullYear(),
            today.getMonth(),
            platform
          );

          const totalCost = monthUsage.reduce((sum, r) => sum + r.cost, 0);

          // 检查月预算告警
          const monthlyBudget = 3000; // 默认月预算
          if (totalCost >= monthlyBudget * 0.9) {
            await this.alertService.triggerBudgetAlert(
              platform,
              totalCost,
              monthlyBudget,
              'monthly'
            );
          }
        }
      }
    } catch (error) {
      console.error('[MonitoringService] Check failed:', error);
      throw error;
    }
  }
}
