/**
 * Notification ViewModel
 * 通知管理的视图逻辑
 */

import { BaseViewModel } from '../BaseViewModel';
import { computed, watch } from 'vue';
import { useUIStore } from '../../models/stores/uiStore';
import { AlertService, Alert } from '../../models/services/AlertService';

interface NotificationState {
  notifications: Alert[];
  showPanel: boolean;
  filter: 'all' | 'unread';
  autoClose: boolean;
  autoCloseDelay: number;
}

export class NotificationViewModel extends BaseViewModel<NotificationState> {
  private uiStore = useUIStore();
  private alertService = new AlertService();
  private autoCloseTimer: number | null = null;

  // Computed properties
  readonly notifications = computed(() => this.state.notifications);
  readonly unreadCount = computed(() =>
    this.state.notifications.filter(n => !n.read).length
  );
  readonly hasUnread = computed(() => this.unreadCount.value > 0);
  readonly filteredNotifications = computed(() => {
    return this.state.filter === 'unread'
      ? this.state.notifications.filter(n => !n.read)
      : this.state.notifications;
  });

  constructor() {
    super({
      notifications: [],
      showPanel: false,
      filter: 'all',
      autoClose: true,
      autoCloseDelay: 5000
    });
  }

  protected async onInitialize(): Promise<void> {
    await this.alertService.initialize();
    this.loadNotifications();

    // 监听全局通知
    this.watchGlobalNotifications();
  }

  /**
   * 加载通知
   */
  loadNotifications(): void {
    this.state.notifications = this.alertService.getAlerts();
  }

  /**
   * 监听全局通知
   */
  watchGlobalNotifications(): void {
    // 使用Pinia store的通知
    watch(
      () => this.uiStore.notifications,
      (newNotifications) => {
        // 添加新通知
        newNotifications.forEach(notif => {
          this.state.notifications.unshift({
            id: notif.id,
            type: this.mapNotificationType(notif.type),
            platform: 'deepseek' as any, // TODO: 从通知中获取
            message: notif.message,
            severity: this.mapSeverity(notif.type),
            timestamp: new Date(),
            read: false
          } as Alert);
        });

        // 自动关闭面板
        if (this.state.autoClose) {
          this.scheduleAutoClose();
        }
      },
      { deep: true }
    );
  }

  /**
   *.标记为已读
   */
  markAsRead(id: string): void {
    this.alertService.markAsRead(id);

    const notification = this.state.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * 标记所有为已读
   */
  markAllAsRead(): void {
    this.state.notifications.forEach(n => {
      this.markAsRead(n.id);
    });
  }

  /**
   * 删除通知
   */
  removeNotification(id: string): void {
    const index = this.state.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      this.state.notifications.splice(index, 1);
    }
  }

  /**
   * 清除所有通知
   */
  clearAll(): void {
    this.alertService.clearAllAlerts();
    this.state.notifications = [];
  }

  /**
   *.清除已读通知
   */
  clearRead(): void {
    this.alertService.clearReadAlerts();
    this.state.notifications = this.state.notifications.filter(n => !n.read);
  }

  /**
   * 切换通知面板
   */
  togglePanel(): void {
    this.state.showPanel = !this.state.showPanel;

    if (this.state.showPanel) {
      this.cancelAutoClose();
    }
  }

  /**
   * 显示通知面板
   */
  showPanel(): void {
    this.state.showPanel = true;
    this.cancelAutoClose();
  }

  /**
   * 隐藏通知面板
   */
  hidePanel(): void {
    this.state.showPanel = false;
  }

  /**
   * 切换过滤器
   */
  toggleFilter(): void {
    this.state.filter = this.state.filter === 'all' ? 'unread' : 'all';
  }

  /**
   * 设置过滤器
   */
  setFilter(filter: 'all' | 'unread'): void {
    this.state.filter = filter;
  }

  /**
   *.设置自动关闭
   */
  setAutoClose(enabled: boolean, delay?: number): void {
    this.state.autoClose = enabled;
    if (delay !== undefined) {
      this.state.autoCloseDelay = delay;
    }
  }

  /**
   * 调度自动关闭
   */
  private scheduleAutoClose(): void {
    this.cancelAutoClose();

    if (this.autoCloseTimer !== null) {
      clearTimeout(this.autoCloseTimer);
    }

    this.autoCloseTimer = window.setTimeout(() => {
      this.state.showPanel = false;
    }, this.state.autoCloseDelay);
  }

  /**
   * 取消自动关闭
   */
  private cancelAutoClose(): void {
    if (this.autoCloseTimer !== null) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }

  /**
   * 映射通知类型
   */
  private mapNotificationType(_type: any): string {
    // TODO: 实现类型映射
    return 'info';
  }

  /**
   * 映射严重级别
   */
  private mapSeverity(_type: any): 'info' | 'warning' | 'error' {
    // TODO: 实现严重级别映射
    return 'info';
  }

  protected async onDispose(): Promise<void> {
    this.cancelAutoClose();
  }
}
