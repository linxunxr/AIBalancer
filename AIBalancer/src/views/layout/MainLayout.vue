<template>
  <div class="main-layout" :class="themeClass">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <div class="app-logo">
          <div class="logo-icon">
            <span style="font-size: 20px; font-weight: bold;">⚖</span>
          </div>
          <div v-if="!isSidebarCollapsed" class="logo-text">
            <span class="app-name">智衡</span>
            <span class="app-subtitle">Balancer</span>
          </div>
        </div>

        <button
          class="collapse-btn"
          @click="toggleSidebar"
        >
          <span v-if="!isSidebarCollapsed">◀</span>
          <span v-else>◁</span>
        </button>
      </div>

      <div class="sidebar-nav">
        <a
          v-for="item in menuItems"
          :key="item.key"
          :class="['nav-item', { active: activeKey === item.key }]"
          @click="handleMenuSelect(item)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!isSidebarCollapsed" class="nav-text">{{ item.label }}</span>
        </a>
      </div>

      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar">{{ userName.charAt(0) }}</div>
          <div v-if="!isSidebarCollapsed" class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-status">{{ userStatus }}</div>
          </div>
        </div>

        <div class="sidebar-actions">
          <button class="action-btn" @click="toggleTheme" :title="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'">
            <span v-if="theme === 'light'">🌙</span>
            <span v-else>🌞</span>
          </button>
          <button class="action-btn" @click="showSettings" title="设置">
            ⚙
          </button>
        </div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 顶部导航栏 -->
      <header class="top-navbar">
        <div class="navbar-left">
          <div class="breadcrumb">
            <span
              v-for="(item, index) in breadcrumbs"
              :key="item.key"
              class="breadcrumb-item"
            >
              <span v-if="index > 0" class="separator">/</span>
              <span>{{ item.label }}</span>
            </span>
          </div>
        </div>

        <div class="navbar-right">
          <!-- 全局搜索 -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索功能或设置..."
            class="global-search"
          />

          <!-- 通知中心 -->
          <button class="icon-btn" @click="showNotifications" :class="{ 'has-badge': unreadCount > 0 }">
            <span>🔔</span>
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
          </button>

          <!-- 快速操作 -->
          <button class="action-btn primary" @click="showQuickActions">
            <span>+</span> 快速操作
          </button>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="page-container">
        <div class="page-content">
          <slot></slot>
        </div>
      </div>

      <!-- 页脚 -->
      <footer class="app-footer">
        <div class="footer-content">
          <span>智衡 Balancer v{{ appVersion }}</span>
          <span class="divider">•</span>
          <span>最后更新: {{ lastUpdateTime }}</span>
          <span class="divider">•</span>
          <button class="link-btn" @click="checkForUpdates">检查更新</button>
        </div>
      </footer>
    </main>

    <!-- 设置抽屉 -->
    <div v-if="showSettingsDrawer" class="drawer-overlay" @click="closeSettings">
      <div class="drawer right-drawer" @click.stop>
        <div class="drawer-header">
          <h3>设置</h3>
          <button class="close-btn" @click="closeSettings">×</button>
        </div>
        <div class="drawer-content">
          <p>设置面板内容...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import appStore from '../../models/stores/appStore';
import themeStore from '../../models/stores/themeStore';

const emit = defineEmits<{
  select: [key: string];
}>();

// 状态管理
const appS = appStore();
const themeS = themeStore();
const { theme } = storeToRefs(themeS);

// 响应式状态
const isSidebarCollapsed = ref(false);
const searchQuery = ref('');
const showSettingsDrawer = ref(false);
const activeKey = ref('logs');
const unreadCount = ref(3);

// 计算属性
const themeClass = computed(() => theme.value === 'dark' ? '' : 'light-theme');
const userName = computed(() => appS.user?.name || '用户');
const userStatus = computed(() => appS.user?.status || '在线');
const appVersion = computed(() => '1.0.0');
const lastUpdateTime = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
});

const breadcrumbs = computed(() => {
  const routeMap: Record<string, string> = {
    'logs': '日志查看',
    'log-settings': '日志设置',
    'settings': '系统设置',
    'dashboard': '仪表盘'
  };
  const activeLabel = routeMap[activeKey.value] || activeKey.value;
  return [{ key: activeKey.value, label: activeLabel, href: `/${activeKey.value}` }];
});

// 菜单选项
const menuItems = [
  { key: 'dashboard', label: '仪表盘', icon: '📊', path: '/dashboard' },
  { key: 'logs', label: '日志查看', icon: '📝', path: '/logs' },
  { key: 'log-settings', label: '日志设置', icon: '⚙', path: '/log-settings' },
  { key: 'settings', label: '系统设置', icon: '⚙', path: '/settings' },
];

// 方法
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const toggleTheme = () => {
  themeS.toggleTheme();
};

const showSettings = () => {
  showSettingsDrawer.value = true;
};

const closeSettings = () => {
  showSettingsDrawer.value = false;
};

const handleMenuSelect = (item: any) => {
  activeKey.value = item.key;
  emit('select', item.key);
};

const showNotifications = () => {
  // TODO: 显示通知中心
};

const showQuickActions = () => {
  // TODO: 显示快速操作菜单
};

const checkForUpdates = () => {
  // TODO: 检查更新
};
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family);
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 256px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  z-index: 100;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: var(--space-lg) var(--space-lg) var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light);
}

.app-logo {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.app-name {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.app-subtitle {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  letter-spacing: 1px;
}

.collapse-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md) 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 12px 24px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  border-radius: var(--radius-md);
  margin: 0 4px;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(24, 144, 255, 0.15);
  color: var(--primary-500);
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: var(--text-sm);
}

.sidebar-footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--border-light);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-400), var(--primary-600));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-medium);
}

.user-info {
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.sidebar-actions {
  display: flex;
  gap: var(--space-xs);
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-btn.primary {
  background: var(--primary-500);
  color: white;
  border-radius: var(--radius-md);
  padding: 6px 12px;
}

.action-btn.primary:hover {
  background: var(--primary-600);
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.top-navbar {
  height: 64px;
  padding: 0 var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.navbar-left {
  flex: 1;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.breadcrumb-item:last-child .separator {
  display: none;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.global-search {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--text-sm);
  width: 200px;
  transition: all var(--transition-fast);
}

.global-search:focus {
  border-color: var(--primary-500);
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.icon-btn {
  position: relative;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  font-size: 18px;
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background: var(--bg-tertiary);
}

.icon-btn.has-badge::after {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: var(--error-500);
  border-radius: 50%;
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--error-500);
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  font-weight: var(--font-bold);
}

.page-container {
  flex: 1;
  overflow-y: auto;
}

.page-content {
  padding: var(--space-xl);
  max-width: 1400px;
  margin: 0 auto;
}

/* 页脚 */
.app-footer {
  padding: var(--space-md) var(--space-xl);
  border-top: 1px solid var(--border-light);
  background: var(--bg-secondary);
  display: flex;
  justify-content: center;
}

.footer-content {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.divider {
  opacity: 0.5;
}

.link-btn {
  background: transparent;
  border: none;
  color: var(--primary-500);
  cursor: pointer;
  font-size: var(--text-xs);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.link-btn:hover {
  background: rgba(24, 144, 255, 0.1);
  color: var(--primary-600);
}

/* 设置抽屉 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  height: 100%;
  width: 400px;
  background: var(--bg-card);
  border-left: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-light);
}

.drawer-header h3 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.drawer-content {
  flex: 1;
  padding: var(--space-xl);
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
  }

  .sidebar.show {
    transform: translateX(0);
  }

  .global-search {
    width: 140px;
  }

  .page-content {
    padding: var(--space-lg);
  }
}
</style>
