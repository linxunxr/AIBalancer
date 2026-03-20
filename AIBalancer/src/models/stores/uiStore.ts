/**
 * UI Store
 * UI状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
  timestamp: Date;
}

export interface ModalState {
  show: boolean;
  title: string;
  content?: any;
  width?: string;
  persistent?: boolean;
}

export interface DrawerState {
  show: boolean;
  direction: 'left' | 'right';
  width?: string;
}

export interface UIState {
  sidebarExpanded: boolean;
  sidebarItems: SidebarItem[];
  activeMenu: string;
  notifications: Notification[];
  modal: ModalState;
  drawer: DrawerState;
  loading: boolean;
  loadingMessage?: string;
  fullscreen: boolean;
}

// 默认侧边栏菜单
const defaultSidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: '仪表盘',
    icon: 'dashboard',
    path: '/'
  },
  {
    id: 'balance',
    label: '余额管理',
    icon: 'wallet',
    path: '/balance'
  },
  {
    id: 'usage',
    label: '使用记录',
    icon: 'chart',
    path: '/usage'
  },
  {
    id: 'logs',
    label: '日志查看',
    icon: 'document-text',
    path: '/logs'
  },
  {
    id: 'settings',
    label: '设置',
    icon: 'settings',
    path: '/settings'
  }
];

export const useUIStore = defineStore('ui', () => {
  // State
  const sidebarExpanded = ref(true);
  const sidebarItems = ref<SidebarItem[]>(defaultSidebarItems);
  const activeMenu = ref('dashboard');
  const notifications = ref<Notification[]>([]);
  const modal = ref<ModalState>({
    show: false,
    title: ''
  });
  const drawer = ref<DrawerState>({
    show: false,
    direction: 'right'
  });
  const loading = ref(false);
  const loadingMessage = ref<string | undefined>();
  const fullscreen = ref(false);

  // Getters
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.read).length;
  });

  const hasNotifications = computed(() => {
    return notifications.value.length > 0;
  });

  // Actions
  function toggleSidebar() {
    sidebarExpanded.value = !sidebarExpanded.value;
  }

  function setSidebarExpanded(expanded: boolean) {
    sidebarExpanded.value = expanded;
  }

  function setActiveMenu(menuId: string) {
    activeMenu.value = menuId;
  }

  function addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      ...notification,
      timestamp: new Date()
    };

    notifications.value.push(newNotification);

    // 自动移除通知
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration);
    }
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  }

  function clearNotifications() {
    notifications.value = [];
  }

  function markNotificationAsRead(id: string) {
    const notification = notifications.value.find(n => n.id.id);
    if (notification) {
      // 标记已读（暂时存储在内存中）
    }
  }

  function showModal(title: string, content?: any, options?: {
    width?: string;
    persistent?: boolean;
  }) {
    modal.value = {
      show: true,
      title,
      content,
      width: options?.width || '600px',
      persistent: options?.persistent || false
    };
  }

  function hideModal() {
    modal.value.show = false;
    modal.value.content = undefined;
  }

  function showDrawer(direction: 'left' | 'right' = 'right', width?: string) {
    drawer.value = {
      show: true,
      direction,
      width: width || '400px'
    };
  }

  function hideDrawer() {
    drawer.value.show = false;
  }

  function showLoading(message?: string) {
    loading.value = true;
    loadingMessage.value = message;
  }

  function hideLoading() {
    loading.value = false;
    loadingMessage.value = undefined;
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      fullscreen.value = false;
    } else {
      document.documentElement.requestFullscreen();
      fullscreen.value = true;
    }
  }

  function setFullscreen(value: boolean) {
    if (value && !document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (!value && document.fullscreenElement) {
      document.exitFullscreen();
    }
    fullscreen.value = value;
  }

  // 通知快捷方法
  function showSuccess(message: string, title = '成功') {
    addNotification({
      type: 'success',
      title,
      message,
      duration: 3000
    });
  }

  function showError(message: string, title = '错误') {
    addNotification({
      type: 'error',
      title,
      message,
      duration: 5000
    });
  }

  function showWarning(message: string, title = '警告') {
    addNotification({
      type: 'warning',
      title,
      message,
      duration: 4000
    });
  }

  function showInfo(message: string, title = '提示') {
    addNotification({
      type: 'info',
      title,
      message,
      duration: 3000
    });
  }

  return {
    // State
    sidebarExpanded,
    sidebarItems,
    activeMenu,
    notifications,
    modal,
    drawer,
    loading,
    loadingMessage,
    fullscreen,

    // Getters
    unreadNotifications,
    hasNotifications,

    // Sidebar Actions
    toggleSidebar,
    setSidebarExpanded,
    setActiveMenu,

    // Notification Actions
    addNotification,
    removeNotification,
    clearNotifications,
    markNotificationAsRead,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Modal Actions
    showModal,
    hideModal,

    // Drawer Actions
    showDrawer,
    hideDrawer,

    // Loading Actions
    showLoading,
    hideLoading,

    // Fullscreen Actions
    toggleFullscreen,
    setFullscreen
  };
});
