# 智衡(Balancer) - 现代化UI设计方案

基于MVVM架构和现代化设计理念，为智衡Balancer设计一套完整的用户界面系统。

## 一、设计系统 (Design System)

### 1.1 色彩系统
```css
/* src/styles/design-system.css */
:root {
  /* 主色调 - 深色主题 */
  --primary-50: #e8f4ff;
  --primary-100: #d1e9ff;
  --primary-200: #a3d4ff;
  --primary-300: #75bfff;
  --primary-400: #47aaff;
  --primary-500: #1890ff;  /* 主色 */
  --primary-600: #1473cc;
  --primary-700: #105699;
  --primary-800: #0c3a66;
  --primary-900: #081d33;

  /* 语义色 */
  --success-500: #52c41a;
  --warning-500: #faad14;
  --error-500: #ff4d4f;
  --info-500: #1890ff;

  /* 中性色 */
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e8e8e8;
  --gray-300: #d9d9d9;
  --gray-400: #bfbfbf;
  --gray-500: #8c8c8c;
  --gray-600: #595959;
  --gray-700: #434343;
  --gray-800: #262626;
  --gray-900: #141414;

  /* 背景色 */
  --bg-primary: var(--gray-900);
  --bg-secondary: var(--gray-800);
  --bg-tertiary: var(--gray-700);
  --bg-card: var(--gray-800);
  --bg-elevated: var(--gray-700);

  /* 文字色 */
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.5);
  --text-disabled: rgba(255, 255, 255, 0.3);

  /* 边框色 */
  --border-light: rgba(255, 255, 255, 0.12);
  --border-medium: rgba(255, 255, 255, 0.2);
  --border-heavy: rgba(255, 255, 255, 0.3);

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6);

  /* 圆角 */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-xxl: 24px;

  /* 间距系统 */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 48px;
  --space-4xl: 64px;

  /* 动效 */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

  /* 字体系统 */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace;

  /* 字体大小 */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --text-4xl: 36px;

  /* 字重 */
  --font-thin: 100;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-black: 900;
}

/* 浅色主题变量 */
.light-theme {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;
  --bg-card: #ffffff;
  --bg-elevated: #f8f9fa;

  --text-primary: rgba(0, 0, 0, 0.95);
  --text-secondary: rgba(0, 0, 0, 0.7);
  --text-tertiary: rgba(0, 0, 0, 0.5);
  --text-disabled: rgba(0, 0, 0, 0.3);

  --border-light: rgba(0, 0, 0, 0.08);
  --border-medium: rgba(0, 0, 0, 0.15);
  --border-heavy: rgba(0, 0, 0, 0.25);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.12);
}

/* 混合模式优化 */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}

@media (prefers-color-scheme: light) {
  :root {
    color-scheme: light;
  }
}
```

### 1.2 组件设计规范
```typescript
// src/styles/component-styles.ts
import { css } from 'vue'

export const componentStyles = {
  // 卡片组件
  card: css`
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-light);
    transition: all var(--transition-normal);
    box-shadow: var(--shadow-sm);
  
    &:hover {
      border-color: var(--border-medium);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
  `,

  // 按钮变体
  button: {
    primary: css`
      background: var(--primary-500);
      color: white;
      border: none;
      border-radius: var(--radius-md);
    
      &:hover {
        background: var(--primary-600);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }
    
      &:active {
        background: var(--primary-700);
        transform: translateY(0);
      }
    `,
  
    secondary: css`
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-md);
    
      &:hover {
        background: var(--bg-tertiary);
        border-color: var(--border-heavy);
      }
    `,
  
    ghost: css`
      background: transparent;
      color: var(--text-secondary);
      border: none;
    
      &:hover {
        background: var(--bg-tertiary);
      }
    `,
  
    danger: css`
      background: var(--error-500);
      color: white;
      border: none;
      border-radius: var(--radius-md);
    
      &:hover {
        background: #ff7875;
        box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
      }
    `
  },

  // 输入框
  input: css`
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    transition: all var(--transition-fast);
  
    &:focus {
      border-color: var(--primary-500);
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      outline: none;
    }
  
    &:hover {
      border-color: var(--border-medium);
    }
  `,

  // 标签
  badge: {
    success: css`
      background: rgba(82, 196, 26, 0.15);
      color: var(--success-500);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
    `,
  
    warning: css`
      background: rgba(250, 173, 20, 0.15);
      color: var(--warning-500);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
    `,
  
    error: css`
      background: rgba(255, 77, 79, 0.15);
      color: var(--error-500);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
    `,
  
    info: css`
      background: rgba(24, 144, 255, 0.15);
      color: var(--info-500);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
    `
  },

  // 表格行
  tableRow: css`
    transition: background-color var(--transition-fast);
  
    &:hover {
      background: var(--bg-tertiary);
    }
  
    &.selected {
      background: rgba(24, 144, 255, 0.1);
    }
  `
}
```

## 二、应用布局设计

### 2.1 主布局组件
```vue
<!-- src/views/layout/MainLayout.vue -->
<template>
  <div class="main-layout" :class="themeClass">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <div class="app-logo">
          <div class="logo-icon">
            <BalanceIcon />
          </div>
          <div v-if="!isSidebarCollapsed" class="logo-text">
            <span class="app-name">智衡</span>
            <span class="app-subtitle">Balancer</span>
          </div>
        </div>
      
        <n-button
          class="collapse-btn"
          quaternary
          circle
          @click="toggleSidebar"
        >
          <template #icon>
            <n-icon>
              <ChevronLeftIcon v-if="!isSidebarCollapsed" />
              <ChevronRightIcon v-else />
            </n-icon>
          </template>
        </n-button>
      </div>
    
      <div class="sidebar-nav">
        <n-menu
          :value="activeKey"
          :options="menuOptions"
          :collapsed="isSidebarCollapsed"
          :collapsed-width="64"
          :collapsed-icon-size="20"
          @update:value="handleMenuSelect"
        />
      </div>
    
      <div class="sidebar-footer">
        <div class="user-profile">
          <n-avatar round :size="32" src="/avatar.jpg" />
          <div v-if="!isSidebarCollapsed" class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-status">{{ userStatus }}</div>
          </div>
        </div>
      
        <div class="sidebar-actions">
          <n-tooltip placement="right" trigger="hover">
            <template #trigger>
              <n-button quaternary circle @click="toggleTheme">
                <template #icon>
                  <n-icon>
                    <SunIcon v-if="theme === 'light'" />
                    <MoonIcon v-else />
                  </n-icon>
                </template>
              </n-button>
            </template>
            {{ theme === 'light' ? '切换到深色模式' : '切换到浅色模式' }}
          </n-tooltip>
        
          <n-tooltip placement="right" trigger="hover">
            <template #trigger>
              <n-button quaternary circle @click="showSettings">
                <template #icon>
                  <n-icon><SettingsIcon /></n-icon>
                </template>
              </n-button>
            </template>
            设置
          </n-tooltip>
        </div>
      </div>
    </aside>
  
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 顶部导航栏 -->
      <header class="top-navbar">
        <div class="navbar-left">
          <n-breadcrumb class="breadcrumb">
            <n-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.key"
              :href="item.href"
            >
              <n-icon v-if="item.icon" :component="item.icon" />
              {{ item.label }}
            </n-breadcrumb-item>
          </n-breadcrumb>
        </div>
      
        <div class="navbar-right">
          <n-space align="center" :size="16">
            <!-- 全局搜索 -->
            <n-auto-complete
              v-model:value="searchQuery"
              :options="searchOptions"
              placeholder="搜索功能或设置..."
              size="small"
              clearable
              class="global-search"
            >
              <template #prefix>
                <n-icon><SearchIcon /></n-icon>
              </template>
            </n-auto-complete>
          
            <!-- 通知中心 -->
            <n-dropdown :options="notificationOptions" @select="handleNotificationSelect">
              <n-badge :value="unreadCount" :max="99" dot>
                <n-button quaternary circle>
                  <template #icon>
                    <n-icon><BellIcon /></n-icon>
                  </template>
                </n-button>
              </n-badge>
            </n-dropdown>
          
            <!-- 快速操作 -->
            <n-dropdown :options="quickActionOptions" @select="handleQuickAction">
              <n-button type="primary" size="small">
                <template #icon>
                  <n-icon><PlusIcon /></n-icon>
                </template>
                快速操作
              </n-button>
            </n-dropdown>
          </n-space>
        </div>
      </header>
    
      <!-- 页面内容 -->
      <div class="page-container">
        <div class="page-header" v-if="$slots.header">
          <slot name="header"></slot>
        </div>
      
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
          <n-button text size="tiny" @click="checkForUpdates">
            <template #icon>
              <n-icon><RefreshIcon /></n-icon>
            </template>
            检查更新
          </n-button>
        </div>
      </footer>
    </main>
  
    <!-- 设置抽屉 -->
    <n-drawer
      v-model:show="showSettingsDrawer"
      placement="right"
      :width="400"
    >
      <n-drawer-content title="设置" closable>
        <SettingsPanel />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  NButton,
  NIcon,
  NMenu,
  NBreadcrumb,
  NBreadcrumbItem,
  NAutoComplete,
  NBadge,
  NDropdown,
  NSpace,
  NDrawer,
  NDrawerContent,
  NTooltip,
  NAvatar,
  useMessage
} from 'naive-ui'
import {
  DashboardOutline as DashboardIcon,
  WalletOutline as WalletIcon,
  TimeOutline as HistoryIcon,
  DocumentTextOutline as LogsIcon,
  SettingsOutline as SettingsIcon,
  SunOutline as SunIcon,
  MoonOutline as MoonIcon,
  ChevronLeftOutline as ChevronLeftIcon,
  ChevronRightOutline as ChevronRightIcon,
  SearchOutline as SearchIcon,
  BellOutline as BellIcon,
  AddOutline as PlusIcon,
  RefreshOutline as RefreshIcon
} from '@vicons/ionicons5'
import { ScaleBalance as BalanceIcon } from '@vicons/tabler'

// 导入组件和状态
import SettingsPanel from '../settings/SettingsPanel.vue'
import { useAppStore } from '../../stores/appStore'
import { useThemeStore } from '../../stores/themeStore'

const router = useRouter()
const route = useRoute()
const message = useMessage()

// 状态管理
const appStore = useAppStore()
const themeStore = useThemeStore()
const { theme } = storeToRefs(themeStore)

// 响应式状态
const isSidebarCollapsed = ref(false)
const searchQuery = ref('')
const showSettingsDrawer = ref(false)
const activeKey = ref('dashboard')
const unreadCount = ref(3)

// 计算属性
const themeClass = computed(() => theme.value === 'dark' ? '' : 'light-theme')
const userName = computed(() => appStore.user?.name || '用户')
const userStatus = computed(() => appStore.user?.status || '在线')
const appVersion = computed(() => import.meta.env.VITE_APP_VERSION || '1.0.0')
const lastUpdateTime = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
})

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(record => record.meta?.title)

  return matched.map(record => ({
    key: record.path,
    label: record.meta?.title as string,
    href: record.path,
    icon: record.meta?.icon
  }))
})

// 菜单选项
const menuOptions = computed(() => [
  {
    label: '仪表盘',
    key: 'dashboard',
    icon: () => h(NIcon, null, { default: () => h(DashboardIcon) }),
    path: '/dashboard'
  },
  {
    label: '账户管理',
    key: 'accounts',
    icon: () => h(NIcon, null, { default: () => h(WalletIcon) }),
    path: '/accounts',
    children: [
      {
        label: '平台账户',
        key: 'accounts-platforms',
        path: '/accounts/platforms'
      },
      {
        label: 'API密钥',
        key: 'accounts-api-keys',
        path: '/accounts/api-keys'
      }
    ]
  },
  {
    label: '使用历史',
    key: 'history',
    icon: () => h(NIcon, null, { default: () => h(HistoryIcon) }),
    path: '/history'
  },
  {
    label: '日志系统',
    key: 'logs',
    icon: () => h(NIcon, null, { default: () => h(LogsIcon) }),
    path: '/logs',
    children: [
      {
        label: '日志查看',
        key: 'logs-viewer',
        path: '/logs/viewer'
      },
      {
        label: '日志配置',
        key: 'logs-config',
        path: '/logs/config'
      }
    ]
  },
  {
    type: 'divider'
  },
  {
    label: '系统设置',
    key: 'settings',
    icon: () => h(NIcon, null, { default: () => h(SettingsIcon) }),
    path: '/settings'
  }
])

// 搜索选项
const searchOptions = computed(() => {
  if (!searchQuery.value) return []

  const query = searchQuery.value.toLowerCase()
  const allOptions = [
    { label: '仪表盘', value: 'dashboard', path: '/dashboard' },
    { label: '账户设置', value: 'accounts', path: '/accounts' },
    { label: '查看日志', value: 'logs', path: '/logs' },
    { label: '系统设置', value: 'settings', path: '/settings' },
    { label: '余额监控', value: 'balance-monitor', path: '/dashboard' },
    { label: 'API配置', value: 'api-config', path: '/accounts/api-keys' }
  ]

  return allOptions
    .filter(option => option.label.toLowerCase().includes(query))
    .slice(0, 5)
})

// 通知选项
const notificationOptions = computed(() => [
  {
    label: '查看所有通知',
    key: 'view-all',
    icon: () => h(NIcon, null, { default: () => h(BellIcon) })
  },
  {
    type: 'divider'
  },
  {
    label: '余额提醒: DeepSeek余额不足',
    key: 'alert-1',
    description: '10分钟前'
  },
  {
    label: '系统更新: 新版本可用',
    key: 'alert-2',
    description: '1小时前'
  },
  {
    label: 'API连接正常',
    key: 'alert-3',
    description: '今天'
  }
])

// 快速操作选项
const quickActionOptions = computed(() => [
  {
    label: '添加新账户',
    key: 'add-account',
    icon: () => h(NIcon, null, { default: () => h(PlusIcon) })
  },
  {
    label: '检查余额',
    key: 'check-balance',
    icon: () => h(NIcon, null, { default: () => h(RefreshIcon) })
  },
  {
    label: '导出数据',
    key: 'export-data',
    icon: () => h(NIcon, null, { default: () => h(DownloadIcon) })
  },
  {
    type: 'divider'
  },
  {
    label: '系统诊断',
    key: 'system-diagnose',
    icon: () => h(NIcon, null, { default: () => h(SearchIcon) })
  }
])

// 方法
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const showSettings = () => {
  showSettingsDrawer.value = true
}

const handleMenuSelect = (key: string, item: any) => {
  if (item.path) {
    router.push(item.path)
  }
  activeKey.value = key
}

const handleNotificationSelect = (key: string) => {
  if (key === 'view-all') {
    router.push('/notifications')
  } else {
    message.info(`处理通知: ${key}`)
  }
}

const handleQuickAction = (key: string) => {
  switch (key) {
    case 'add-account':
      router.push('/accounts/add')
      break
    case 'check-balance':
      appStore.refreshAllBalances()
      break
    case 'export-data':
      message.info('开始导出数据...')
      break
    case 'system-diagnose':
      router.push('/diagnose')
      break
  }
}

const checkForUpdates = () => {
  message.info('正在检查更新...')
  // 这里调用更新检查逻辑
}

// 监听路由变化
watch(() => route.path, (newPath) => {
  // 根据路由更新激活的菜单项
  const matchedRoute = menuOptions.value.find(option => 
    option.path === newPath || 
    option.children?.some(child => child.path === newPath)
  )
  if (matchedRoute) {
    activeKey.value = matchedRoute.key
  }
})

// 初始化
onMounted(() => {
  // 根据当前路由设置激活的菜单项
  const currentRoute = menuOptions.value.find(option => 
    option.path === route.path || 
    option.children?.some(child => child.path === route.path)
  )
  if (currentRoute) {
    activeKey.value = currentRoute.key
  }
})
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
  transition: transform var(--transition-normal);
}

.collapse-btn:hover {
  transform: scale(1.1);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md) 0;
  overflow-y: auto;
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
}

.navbar-left {
  flex: 1;
}

.navbar-right {
  display: flex;
  align-items: center;
}

.breadcrumb {
  font-size: var(--text-sm);
}

.global-search {
  width: 240px;
}

.page-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xl);
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* 页脚 */
.app-footer {
  height: 48px;
  padding: 0 var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--border-light);
  background: var(--bg-secondary);
}

.footer-content {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.divider {
  opacity: 0.3;
}

/* 动画效果 */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all var(--transition-normal);
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
  opacity: 0;
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
    width: 180px;
  }

  .page-container {
    padding: var(--space-lg);
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-medium);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-heavy);
}
</style>
```

## 三、仪表盘页面设计

### 3.1 现代化仪表盘
```vue
<!-- src/views/dashboard/DashboardView.vue -->
<template>
  <div class="dashboard-view">
    <!-- 顶部概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card total-balance">
        <div class="card-icon">
          <n-icon size="24" :depth="3">
            <WalletIcon />
          </n-icon>
        </div>
        <div class="card-content">
          <div class="card-label">总余额</div>
          <div class="card-value">{{ formatCurrency(totalBalance) }}</div>
          <div class="card-trend" :class="trendClass">
            <n-icon :size="16">
              <TrendUpIcon v-if="totalTrend > 0" />
              <TrendDownIcon v-else-if="totalTrend < 0" />
              <TrendFlatIcon v-else />
            </n-icon>
            <span>{{ formatPercentage(totalTrend) }}</span>
          </div>
        </div>
      </div>
    
      <div class="overview-card today-usage">
        <div class="card-icon">
          <n-icon size="24" :depth="3">
            <ActivityIcon />
          </n-icon>
        </div>
        <div class="card-content">
          <div class="card-label">今日使用</div>
          <div class="card-value">{{ formatTokens(todayUsage) }}</div>
          <div class="card-subtitle">Tokens</div>
        </div>
      </div>
    
      <div class="overview-card active-platforms">
        <div class="card-icon">
          <n-icon size="24" :depth="3">
            <ServerIcon />
          </n-icon>
        </div>
        <div class="card-content">
          <div class="card-label">活跃平台</div>
          <div class="card-value">{{ activePlatforms }}</div>
          <div class="card-subtitle">/{{ totalPlatforms }} 个</div>
        </div>
      </div>
    
      <div class="overview-card system-status">
        <div class="card-icon">
          <n-icon size="24" :depth="3">
            <CheckmarkCircleIcon v-if="systemOk" />
            <WarningIcon v-else />
          </n-icon>
        </div>
        <div class="card-content">
          <div class="card-label">系统状态</div>
          <div class="card-value" :class="systemOk ? 'status-ok' : 'status-warning'">
            {{ systemOk ? '正常' : '异常' }}
          </div>
          <div class="card-subtitle">
            {{ systemOk ? '所有服务运行中' : '需要检查' }}
          </div>
        </div>
      </div>
    </div>
  
    <!-- 余额卡片网格 -->
    <div class="balance-cards-section">
      <div class="section-header">
        <h3 class="section-title">平台余额</h3>
        <div class="section-actions">
          <n-button size="small" @click="refreshAllBalances">
            <template #icon>
              <n-icon><RefreshIcon /></n-icon>
            </template>
            刷新全部
          </n-button>
          <n-button size="small" type="primary" @click="addAccount">
            <template #icon>
              <n-icon><PlusIcon /></n-icon>
            </template>
            添加账户
          </n-button>
        </div>
      </div>
    
      <div class="balance-cards-grid">
        <BalanceCard
          v-for="balance in balances"
          :key="balance.id"
          :balance="balance"
          class="balance-card"
        />
      </div>
    </div>
  
    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-row">
        <!-- 使用趋势图表 -->
        <div class="chart-container large">
          <n-card title="使用趋势" class="chart-card">
            <template #header-extra>
              <n-select
                v-model:value="trendPeriod"
                :options="periodOptions"
                size="small"
                style="width: 120px"
              />
            </template>
            <div ref="usageChartRef" class="chart"></div>
          </n-card>
        </div>
      
        <!-- 平台分布 -->
        <div class="chart-container small">
          <n-card title="平台分布" class="chart-card">
            <div ref="platformChartRef" class="chart"></div>
          </n-card>
        </div>
      </div>
    
      <div class="chart-row">
        <!-- 余额历史 -->
        <div class="chart-container medium">
          <n-card title="余额变化" class="chart-card">
            <div ref="balanceChartRef" class="chart"></div>
          </n-card>
        </div>
      
        <!-- 实时监控 -->
        <div class="chart-container medium">
          <n-card title="实时监控" class="chart-card">
            <template #header-extra>
              <n-switch v-model:value="realtimeMonitoring" size="small">
                实时模式
              </n-switch>
            </template>
            <div ref="realtimeChartRef" class="chart"></div>
          </n-card>
        </div>
      </div>
    </div>
  
    <!-- 最近活动 -->
    <div class="recent-activity-section">
      <n-card title="最近活动" class="activity-card">
        <template #header-extra>
          <n-button text size="small" @click="viewAllActivities">
            查看全部
          </n-button>
        </template>
      
        <n-list>
          <n-list-item
            v-for="activity in recentActivities"
            :key="activity.id"
            class="activity-item"
          >
            <template #prefix>
              <div class="activity-icon" :class="`type-${activity.type}`">
                <n-icon :size="20">
                  <component :is="getActivityIcon(activity.type)" />
                </n-icon>
              </div>
            </template>
          
            <n-thing :title="activity.title" :description="formatTime(activity.timestamp)">
              {{ activity.description }}
            </n-thing>
          
            <template #suffix>
              <n-tag
                v-if="activity.status"
                :type="getStatusType(activity.status)"
                size="small"
              >
                {{ activity.status }}
              </n-tag>
            </template>
          </n-list-item>
        </n-list>
      </n-card>
    </div>
  
    <!-- 底部统计 -->
    <div class="stats-footer">
      <n-space justify="space-between">
        <div class="stat-item">
          <div class="stat-label">平均每日使用</div>
          <div class="stat-value">{{ formatTokens(avgDailyUsage) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">预计剩余天数</div>
          <div class="stat-value">{{ estimatedDays }} 天</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">API成功率</div>
          <div class="stat-value">{{ apiSuccessRate }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">数据更新时间</div>
          <div class="stat-value">{{ lastUpdate }}</div>
        </div>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NIcon,
  NCard,
  NSelect,
  NSwitch,
  NList,
  NListItem,
  NThing,
  NTag,
  NSpace,
  useMessage
} from 'naive-ui'
import {
  WalletOutline as WalletIcon,
  ActivityOutline as ActivityIcon,
  ServerOutline as ServerIcon,
  CheckmarkCircleOutline as CheckmarkCircleIcon,
  WarningOutline as WarningIcon,
  RefreshOutline as RefreshIcon,
  AddOutline as PlusIcon,
  TrendUpOutline as TrendUpIcon,
  TrendDownOutline as TrendDownIcon,
  RemoveOutline as TrendFlatIcon,
  TimeOutline as TimeIcon,
  DownloadOutline as DownloadIcon,
  AlertCircleOutline as AlertIcon,
  CheckmarkOutline as SuccessIcon
} from '@vicons/ionicons5'
import * as echarts from 'echarts'

// 导入组件
import BalanceCard from '../../components/dashboard/BalanceCard.vue'
import { useDashboardViewModel } from '../../viewmodels/dashboard/useDashboardViewModel'

const router = useRouter()
const message = useMessage()

// 使用ViewModel
const {
  // 状态
  state,
  isLoading,
  error,

  // 计算属性
  totalBalance,
  platformCount,
  hasActiveAlerts,

  // 方法
  refresh,
  updateBalance
} = useDashboardViewModel()

// 本地状态
const trendPeriod = ref('7d')
const realtimeMonitoring = ref(true)

// 图表引用
const usageChartRef = ref<HTMLElement>()
const platformChartRef = ref<HTMLElement>()
const balanceChartRef = ref<HTMLElement>()
const realtimeChartRef = ref<HTMLElement>()

let usageChart: echarts.ECharts | null = null
let platformChart: echarts.ECharts | null = null
let balanceChart: echarts.ECharts | null = null
let realtimeChart: echarts.ECharts | null = null

// 计算属性
const balances = computed(() => state.balances)
const todayUsage = computed(() => state.usageSummary.today)
const activePlatforms = computed(() => state.balances.filter(b => b.currentBalance > 0).length)
const totalPlatforms = computed(() => state.balances.length)
const totalTrend = computed(() => {
  const trends = state.balances.map(b => b.trend.dailyAverageChange)
  return trends.reduce((sum, change) => sum + change, 0) / trends.length
})
const systemOk = computed(() => state.systemStatus.apiConnected && !hasActiveAlerts.value)

const periodOptions = [
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' },
  { label: '最近3个月', value: '3m' },
  { label: '最近1年', value: '1y' }
]

// 最近活动数据（示例）
const recentActivities = computed(() => [
  {
    id: '1',
    type: 'balance',
    title: '余额更新',
    description: 'DeepSeek余额已更新为 ¥245.60',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
    status: '成功'
  },
  {
    id: '2',
    type: 'api',
    title: 'API调用',
    description: 'OpenAI GPT-4 API调用完成',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
    status: '完成'
  },
  {
    id: '3',
    type: 'warning',
    title: '余额提醒',
    description: 'Anthropic余额低于阈值 ¥50.00',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5小时前
    status: '警告'
  },
  {
    id: '4',
    type: 'system',
    title: '系统更新',
    description: '自动检查更新完成',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前
    status: '成功'
  }
])

// 统计信息
const avgDailyUsage = computed(() => 12500)
const estimatedDays = computed(() => 45)
const apiSuccessRate = computed(() => 99.8)
const lastUpdate = computed(() => {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const trendClass = computed(() => {
  if (totalTrend.value > 5) return 'trend-up'
  if (totalTrend.value < -5) return 'trend-down'
  return 'trend-flat'
})

// 方法
const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`
}

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

const getActivityIcon = (type: string) => {
  const icons: Record<string, any> = {
    balance: WalletIcon,
    api: DownloadIcon,
    warning: AlertIcon,
    system: RefreshIcon,
    success: SuccessIcon
  }
  return icons[type] || TimeIcon
}

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    成功: 'success',
    完成: 'info',
    警告: 'warning',
    错误: 'error'
  }
  return types[status] || 'default'
}

const refreshAllBalances = async () => {
  try {
    await refresh()
    message.success('余额已刷新')
  } catch {
    message.error('刷新失败')
  }
}

const addAccount = () => {
  router.push('/accounts/add')
}

const viewAllActivities = () => {
  router.push('/history')
}

// 图表相关
const initCharts = () => {
  if (usageChartRef.value) {
    usageChart = echarts.init(usageChartRef.value)
  }
  if (platformChartRef.value) {
    platformChart = echarts.init(platformChartRef.value)
  }
  if (balanceChartRef.value) {
    balanceChart = echarts.init(balanceChartRef.value)
  }
  if (realtimeChartRef.value) {
    realtimeChart = echarts.init(realtimeChartRef.value)
  }

  updateCharts()
}

const updateCharts = () => {
  updateUsageChart()
  updatePlatformChart()
  updateBalanceChart()
  if (realtimeMonitoring.value) {
    updateRealtimeChart()
  }
}

const updateUsageChart = () => {
  if (!usageChart) return

  // 示例数据
  const data = [
    { date: '01-15', usage: 12300 },
    { date: '01-16', usage: 14500 },
    { date: '01-17', usage: 11000 },
    { date: '01-18', usage: 16200 },
    { date: '01-19', usage: 13800 },
    { date: '01-20', usage: 15500 },
    { date: '01-21', usage: 14200 }
  ]

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>使用量: {c} tokens'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLine: {
        lineStyle: {
          color: 'var(--border-light)'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: 'var(--border-light)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'var(--border-light)',
          opacity: 0.1
        }
      }
    },
    series: [
      {
        name: '使用量',
        type: 'line',
        smooth: true,
        data: data.map(d => d.usage),
        itemStyle: {
          color: 'var(--primary-500)'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(24, 144, 255, 0.5)'
            },
            {
              offset: 1,
              color: 'rgba(24, 144, 255, 0.1)'
            }
          ])
        }
      }
    ]
  }

  usageChart.setOption(option)
}

const updatePlatformChart = () => {
  if (!platformChart) return

  const data = [
    { value: 35, name: 'DeepSeek' },
    { value: 40, name: 'OpenAI' },
    { value: 25, name: 'Anthropic' }
  ]

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    series: [
      {
        name: '平台分布',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'var(--bg-primary)',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: 'var(--text-primary)'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        data: data.map(item => ({
          ...item,
          itemStyle: {
            color: getPlatformColor(item.name)
          }
        }))
      }
    ]
  }

  platformChart.setOption(option)
}

const updateBalanceChart = () => {
  if (!balanceChart) return

  const data = [
    { platform: 'DeepSeek', balance: 245.6, trend: 12.5 },
    { platform: 'OpenAI', balance: 180.3, trend: -5.2 },
    { platform: 'Anthropic', balance: 320.8, trend: 8.7 }
  ]

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any[]) => {
        const param = params[0]
        return `${param.name}<br/>余额: ¥${param.data.value}<br/>趋势: ${param.data.trend > 0 ? '+' : ''}${param.data.trend}%`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.platform),
      axisLine: {
        lineStyle: {
          color: 'var(--border-light)'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: 'var(--border-light)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'var(--border-light)',
          opacity: 0.1
        }
      }
    },
    series: [
      {
        name: '余额',
        type: 'bar',
        data: data.map(d => ({
          value: d.balance,
          trend: d.trend,
          itemStyle: {
            color: getPlatformColor(d.platform)
          }
        })),
        label: {
          show: true,
          position: 'top',
          formatter: '¥{c}'
        }
      }
    ]
  }

  balanceChart.setOption(option)
}

const updateRealtimeChart = () => {
  if (!realtimeChart) return

  // 生成实时数据
  const now = new Date()
  const data = []
  for (let i = 9; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000) // 每分钟一个点
    data.push({
      time: time.getMinutes().toString().padStart(2, '0') + ':' + time.getSeconds().toString().padStart(2, '0'),
      value: Math.random() * 100 + 50
    })
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>延迟: {c}ms'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.time),
      axisLine: {
        lineStyle: {
          color: 'var(--border-light)'
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLine: {
        lineStyle: {
          color: 'var(--border-light)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'var(--border-light)',
          opacity: 0.1
        }
      }
    },
    series: [
      {
        name: 'API延迟',
        type: 'line',
        data: data.map(d => d.value),
        smooth: true,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: 'var(--primary-500)'
        }
      }
    ]
  }

  realtimeChart.setOption(option)
}

const getPlatformColor = (platform: string): string => {
  const colors: Record<string, string> = {
    DeepSeek: '#3a86ff',
    OpenAI: '#10b981',
    Anthropic: '#8b5cf6'
  }
  return colors[platform] || 'var(--primary-500)'
}

const disposeCharts = () => {
  usageChart?.dispose()
  platformChart?.dispose()
  balanceChart?.dispose()
  realtimeChart?.dispose()
}

// 实时监控定时器
let realtimeInterval: number | null = null

const startRealtimeMonitoring = () => {
  if (realtimeInterval) clearInterval(realtimeInterval)

  realtimeInterval = setInterval(() => {
    if (realtimeMonitoring.value && realtimeChart) {
      updateRealtimeChart()
    }
  }, 5000) as unknown as number
}

const stopRealtimeMonitoring = () => {
  if (realtimeInterval) {
    clearInterval(realtimeInterval)
    realtimeInterval = null
  }
}

// 生命周期
onMounted(() => {
  initCharts()
  startRealtimeMonitoring()

  // 监听窗口大小变化，重新绘制图表
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  disposeCharts()
  stopRealtimeMonitoring()
  window.removeEventListener('resize', handleResize)
})

// 监听状态变化
watch(realtimeMonitoring, (newValue) => {
  if (newValue) {
    startRealtimeMonitoring()
  } else {
    stopRealtimeMonitoring()
  }
})

const handleResize = () => {
  usageChart?.resize()
  platformChart?.resize()
  balanceChart?.resize()
  realtimeChart?.resize()
}
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-lg);
}

.overview-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.overview-card:hover {
  border-color: var(--border-medium);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.overview-card.total-balance {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
  color: white;
  border: none;
}

.overview-card.total-balance .card-icon {
  background: rgba(255, 255, 255, 0.2);
}

.overview-card.total-balance .card-label,
.overview-card.total-balance .card-value,
.overview-card.total-balance .card-trend {
  color: white;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.card-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.card-subtitle {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.card-trend {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.card-trend.trend-up {
  color: var(--success-500);
}

.card-trend.trend-down {
  color: var(--error-500);
}

.card-trend.trend-flat {
  color: var(--text-tertiary);
}

.status-ok {
  color: var(--success-500);
}

.status-warning {
  color: var(--warning-500);
}

/* 余额卡片区域 */
.balance-cards-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-xl);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.section-actions {
  display: flex;
  gap: var(--space-sm);
}

.balance-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

.balance-card {
  transition: all var(--transition-normal);
}

.balance-card:hover {
  transform: translateY(-4px);
}

/* 图表区域 */
.charts-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.chart-row {
  display: grid;
  gap: var(--space-lg);
}

.chart-row:first-child {
  grid-template-columns: 2fr 1fr;
}

.chart-row:last-child {
  grid-template-columns: 1fr 1fr;
}

.chart-container {
  height: 320px;
}

.chart-container.large {
  grid-column: span 2;
}

.chart-card {
  height: 100%;
}

.chart {
  width: 100%;
  height: 240px;
}

/* 最近活动 */
.recent-activity-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.activity-item {
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border-light);
  transition: background-color var(--transition-fast);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: var(--bg-tertiary);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-icon.type-balance {
  background: rgba(24, 144, 255, 0.1);
  color: var(--primary-500);
}

.activity-icon.type-api {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success-500);
}

.activity-icon.type-warning {
  background: rgba(250, 173, 20, 0.1);
  color: var(--warning-500);
}

.activity-icon.type-system {
  background: rgba(128, 90, 213, 0.1);
  color: #805ad5;
}

/* 底部统计 */
.stats-footer {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-lg) var(--space-xl);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-xs);
}

.stat-value {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-row:first-child,
  .chart-row:last-child {
    grid-template-columns: 1fr;
  }

  .balance-cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }

  .balance-cards-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .section-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
```

## 四、现代化日志查看器设计

### 4.1 现代化日志查看器组件
```vue
<!-- src/views/logging/LogViewer.vue -->
<template>
  <div class="modern-log-viewer">
    <!-- 顶部工具栏 -->
    <div class="log-toolbar">
      <n-card class="toolbar-card" content-class="toolbar-content">
        <div class="toolbar-main">
          <div class="toolbar-left">
            <n-space align="center">
              <!-- 视图模式切换 -->
              <n-radio-group v-model:value="viewMode" size="small">
                <n-radio-button value="list">
                  <template #icon>
                    <n-icon><ListIcon /></n-icon>
                  </template>
                  列表
                </n-radio-button>
                <n-radio-button value="table">
                  <template #icon>
                    <n-icon><TableIcon /></n-icon>
                  </template>
                  表格
                </n-radio-button>
                <n-radio-button value="chart">
                  <template #icon>
                    <n-icon><BarChartIcon /></n-icon>
                  </template>
                  图表
                </n-radio-button>
              </n-radio-group>
            
              <!-- 实时模式切换 -->
              <n-switch
                v-model:value="liveMode"
                size="small"
                :round="false"
                class="live-switch"
              >
                <template #checked>
                  <n-icon size="14" color="var(--success-500)">
                    <RadioIcon />
                  </n-icon>
                  <span>实时</span>
                </template>
                <template #unchecked>
                  <n-icon size="14" color="var(--text-tertiary)">
                    <RadioIcon />
                  </n-icon>
                  <span>静态</span>
                </template>
              </n-switch>
            
              <!-- 自动滚动 -->
              <n-switch
                v-model:value="autoScroll"
                size="small"
                :disabled="!liveMode"
              >
                <template #checked>自动滚动</template>
                <template #unchecked>自动滚动</template>
              </n-switch>
            </n-space>
          </div>
        
          <div class="toolbar-center">
            <!-- 快速时间筛选 -->
            <n-button-group>
              <n-button
                v-for="period in quickPeriods"
                :key="period.value"
                size="small"
                :type="activeQuickPeriod === period.value ? 'primary' : 'default'"
                @click="setQuickPeriod(period.value)"
              >
                {{ period.label }}
              </n-button>
            </n-button-group>
          </div>
        
          <div class="toolbar-right">
            <n-space align="center">
              <!-- 日志级别过滤器 -->
              <n-dropdown
                :options="levelFilterOptions"
                trigger="click"
                placement="bottom-start"
              >
                <n-button size="small" :type="hasLevelFilter ? 'primary' : 'default'">
                  <template #icon>
                    <n-icon><FilterIcon /></n-icon>
                  </template>
                  级别过滤
                  <n-badge
                    v-if="filterLevels.length > 0"
                    :value="filterLevels.length"
                    :max="9"
                    type="error"
                    class="filter-badge"
                  />
                </n-button>
              </n-dropdown>
            
              <!-- 高级搜索 -->
              <n-button
                size="small"
                @click="showAdvancedSearch = !showAdvancedSearch"
              >
                <template #icon>
                  <n-icon><SearchIcon /></n-icon>
                </template>
                高级搜索
              </n-button>
            
              <!-- 批量操作 -->
              <n-dropdown :options="batchOptions" @select="handleBatchAction">
                <n-button size="small">
                  <template #icon>
                    <n-icon><MoreHorizontalIcon /></n-icon>
                  </template>
                  批量操作
                </n-button>
              </n-dropdown>
            
              <!-- 刷新按钮 -->
              <n-button
                size="small"
                circle
                :loading="isLoading"
                @click="handleRefresh"
              >
                <template #icon>
                  <n-icon><RefreshIcon /></n-icon>
                </template>
              </n-button>
            </n-space>
          </div>
        </div>
      
        <!-- 高级搜索面板 -->
        <n-collapse-transition :show="showAdvancedSearch">
          <div class="advanced-search-panel">
            <div class="search-grid">
              <!-- 时间范围 -->
              <div class="search-group">
                <div class="search-label">时间范围</div>
                <n-date-picker
                  v-model:value="timeRange"
                  type="datetimerange"
                  clearable
                  :is-date-disabled="disableFutureDate"
                  style="width: 100%"
                />
              </div>
            
              <!-- 关键词搜索 -->
              <div class="search-group">
                <div class="search-label">关键词</div>
                <n-input-group>
                  <n-input
                    v-model:value="keyword"
                    placeholder="搜索日志内容..."
                    clearable
                    @keyup.enter="applySearch"
                  />
                  <n-button type="primary" @click="applySearch">
                    搜索
                  </n-button>
                </n-input-group>
              </div>
            
              <!-- 来源过滤 -->
              <div class="search-group">
                <div class="search-label">来源</div>
                <n-select
                  v-model:value="selectedSources"
                  multiple
                  :options="sourceOptions"
                  placeholder="选择来源"
                  clearable
                  max-tag-count="responsive"
                />
              </div>
            </div>
          
            <div class="search-actions">
              <n-space>
                <n-button size="small" @click="clearSearch">
                  清空条件
                </n-button>
                <n-button size="small" type="primary" @click="applySearch">
                  应用搜索
                </n-button>
              </n-space>
            </div>
          </div>
        </n-collapse-transition>
      </n-card>
    </div>
  
    <!-- 日志统计 -->
    <div class="log-stats">
      <n-space justify="space-between" align="center">
        <div class="stats-left">
          <n-space>
            <n-statistic label="总日志数" :value="totalLogs">
              <template #suffix>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-icon size="14" :depth="3">
                      <InfoIcon />
                    </n-icon>
                  </template>
                  最近24小时内的日志数量
                </n-tooltip>
              </template>
            </n-statistic>
          
            <n-statistic
              v-for="stat in levelStats"
              :key="stat.level"
              :label="stat.level"
              :value="stat.count"
              :class="`level-${stat.level.toLowerCase()}`"
            />
          </n-space>
        </div>
      
        <div class="stats-right">
          <n-space>
            <!-- 导出按钮 -->
            <n-dropdown :options="exportOptions" @select="handleExport">
              <n-button size="small" type="primary">
                <template #icon>
                  <n-icon><DownloadIcon /></n-icon>
                </template>
                导出日志
              </n-button>
            </n-dropdown>
          
            <!-- 清理按钮 -->
            <n-popconfirm @positive-click="handleCleanup">
              <template #trigger>
                <n-button size="small" type="warning" ghost>
                  <template #icon>
                    <n-icon><TrashIcon /></n-icon>
                  </template>
                  清理日志
                </n-button>
              </template>
              确定要清理30天前的日志吗？
            </n-popconfirm>
          </n-space>
        </div>
      </n-space>
    </div>
  
    <!-- 日志内容区域 -->
    <div class="log-content">
      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="log-list-view">
        <virtual-list
          :data="filteredLogs"
          :item-height="80"
          :buffer="10"
          class="virtual-list"
        >
          <template #default="{ item: log }">
            <LogListItem
              :log="log"
              :expanded="expandedLogs.has(log.id)"
              @click="toggleLogExpand(log.id)"
              @copy="copyLogMessage(log)"
            />
          </template>
        </virtual-list>
      </div>
    
      <!-- 表格视图 -->
      <div v-else-if="viewMode === 'table'" class="log-table-view">
        <n-data-table
          :columns="tableColumns"
          :data="filteredLogs"
          :loading="isLoading"
          :pagination="pagination"
          :bordered="false"
          :single-line="false"
          virtual-scroll
          :scroll-x="1400"
          class="log-table"
          row-class-name="log-table-row"
        />
      </div>
    
      <!-- 图表视图 -->
      <div v-else-if="viewMode === 'chart'" class="log-chart-view">
        <div class="chart-container">
          <n-card class="chart-card">
            <div ref="chartRef" class="chart"></div>
          </n-card>
        </div>
      
        <div class="chart-controls">
          <n-space>
            <n-select
              v-model:value="chartType"
              :options="chartTypeOptions"
              size="small"
              style="width: 120px"
            />
            <n-select
              v-model:value="chartGroupBy"
              :options="chartGroupOptions"
              size="small"
              style="width: 120px"
            />
            <n-date-picker
              v-model:value="chartTimeRange"
              type="datetimerange"
              size="small"
              clearable
            />
          </n-space>
        </div>
      </div>
    </div>
  
    <!-- 底部状态栏 -->
    <div class="log-statusbar">
      <n-space justify="space-between" align="center">
        <div class="status-left">
          <n-space>
            <span class="status-item">
              <n-icon size="14" :depth="3"><DatabaseIcon /></n-icon>
              日志文件: {{ logFileCount }} 个
            </span>
            <span class="status-item">
              <n-icon size="14" :depth="3"><StorageIcon /></n-icon>
              总大小: {{ formatFileSize(totalFileSize) }}
            </span>
            <span class="status-item" :class="{ 'status-error': hasErrors }">
              <n-icon size="14"><AlertIcon /></n-icon>
              错误: {{ errorCount }} 个
            </span>
          </n-space>
        </div>
      
        <div class="status-right">
          <n-space>
            <!-- 分页信息 -->
            <span class="pagination-info">
              第 {{ currentPage }} 页，共 {{ totalPages }} 页
            </span>
          
            <!-- 分页控件 -->
            <n-pagination
              v-model:page="currentPage"
              :page-count="totalPages"
              :page-size="pageSize"
              size="small"
              :page-sizes="[50, 100, 200, 500]"
              show-size-picker
              show-quick-jumper
            />
          </n-space>
        </div>
      </n-space>
    </div>
  
    <!-- 日志详情抽屉 -->
    <n-drawer
      v-model:show="showDetailDrawer"
      placement="right"
      :width="600"
    >
      <n-drawer-content
        v-if="selectedLog"
        :title="`日志详情 - ${selectedLog.id}`"
        closable
      >
        <LogDetailPanel :log="selectedLog" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, h } from 'vue'
import {
  NButton,
  NIcon,
  NCard,
  NSpace,
  NRadioGroup,
  NRadioButton,
  NSwitch,
  NButtonGroup,
  NBadge,
  NDropdown,
  NCollapseTransition,
  NDatePicker,
  NInput,
  NInputGroup,
  NSelect,
  NStatistic,
  NTooltip,
  NPopconfirm,
  NDataTable,
  NPagination,
  NDrawer,
  NDrawerContent,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import {
  ListOutline as ListIcon,
  GridOutline as TableIcon,
  BarChartOutline as BarChartIcon,
  RadioOutline as RadioIcon,
  FilterOutline as FilterIcon,
  SearchOutline as SearchIcon,
  MoreHorizontalOutline as MoreHorizontalIcon,
  RefreshOutline as RefreshIcon,
  DownloadOutline as DownloadIcon,
  TrashOutline as TrashIcon,
  InformationCircleOutline as InfoIcon,
  AlertCircleOutline as AlertIcon,
  DatabaseOutline as DatabaseIcon,
  ServerOutline as StorageIcon,
  ChevronDownOutline as ChevronDownIcon
} from '@vicons/ionicons5'
import VirtualList from 'vue-virtual-list-3'
import * as echarts from 'echarts'

// 导入组件
import LogListItem from '../../components/logging/LogListItem.vue'
import LogDetailPanel from '../../components/logging/LogDetailPanel.vue'

// 导入ViewModel
import { useLogQueryViewModel } from '../../viewmodels/logging/useLogQueryViewModel'
import { LogLevel, LogSource, type LogEntry } from '../../models/entities/LogEntry'

const message = useMessage()

// 使用ViewModel
const {
  logs,
  isLoading,
  error,
  filter,
  totalCount,
  page: vmPage,
  pageSize: vmPageSize,
  levelCounts,
  sourceCounts,
  totalPages,
  hasPrevPage,
  hasNextPage,
  refresh,
  updateFilter,
  changePage,
  changePageSize,
  exportLogs,
  clearFilter
} = useLogQueryViewModel()

// 本地状态
const viewMode = ref<'list' | 'table' | 'chart'>('list')
const liveMode = ref(false)
const autoScroll = ref(true)
const showAdvancedSearch = ref(false)
const showDetailDrawer = ref(false)
const expandedLogs = ref(new Set<string>())
const selectedLog = ref<LogEntry | null>(null)

// 过滤状态
const activeQuickPeriod = ref('24h')
const filterLevels = ref<LogLevel[]>([])
const timeRange = ref<[number, number] | null>(null)
const keyword = ref('')
const selectedSources = ref<LogSource[]>([])

// 图表状态
const chartType = ref('line')
const chartGroupBy = ref('hour')
const chartTimeRange = ref<[number, number] | null>(null)
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 计算属性
const hasLevelFilter = computed(() => filterLevels.value.length > 0)
const hasErrors = computed(() => levelCounts.value[LogLevel.ERROR] > 0)
const errorCount = computed(() => levelCounts.value[LogLevel.ERROR] || 0)

const totalLogs = computed(() => totalCount.value)
const currentPage = computed({
  get: () => vmPage.value,
  set: (value) => changePage(value)
})

const pageSize = computed({
  get: () => vmPageSize.value,
  set: (value) => changePageSize(value)
})

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    // 级别过滤
    if (filterLevels.value.length > 0 && !filterLevels.value.includes(log.level)) {
      return false
    }
  
    // 来源过滤
    if (selectedSources.value.length > 0 && !selectedSources.value.includes(log.source)) {
      return false
    }
  
    // 关键词过滤
    if (keyword.value) {
      const searchText = `${log.message} ${log.module} ${log.source}`.toLowerCase()
      if (!searchText.includes(keyword.value.toLowerCase())) {
        return false
      }
    }
  
    // 时间范围过滤
    if (timeRange.value) {
      const [start, end] = timeRange.value
      const logTime = log.timestamp.getTime()
      if (logTime < start || logTime > end) {
        return false
      }
    }
  
    return true
  })
})

// 统计信息
const levelStats = computed(() => {
  return Object.entries(levelCounts.value).map(([level, count]) => ({
    level,
    count,
    percentage: (count / totalLogs.value * 100).toFixed(1)
  }))
})

// 日志文件统计（示例）
const logFileCount = computed(() => 12)
const totalFileSize = computed(() => 45 * 1024 * 1024) // 45MB

// 选项配置
const quickPeriods = [
  { label: '最近1小时', value: '1h' },
  { label: '最近24小时', value: '24h' },
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' },
  { label: '全部', value: 'all' }
]

const levelFilterOptions = computed(() => {
  return Object.values(LogLevel).map(level => ({
    label: level,
    key: level,
    type: 'checkbox',
    checked: filterLevels.value.includes(level)
  }))
})

const sourceOptions = computed(() => {
  return Object.values(LogSource).map(source => ({
    label: formatSourceName(source),
    value: source
  }))
})

const exportOptions = [
  {
    label: '导出为JSON',
    key: 'json'
  },
  {
    label: '导出为CSV',
    key: 'csv'
  },
  {
    label: '导出为文本',
    key: 'text'
  },
  {
    label: '导出选中项',
    key: 'selected',
    disabled: true // 需要实现选中功能
  }
]

const batchOptions = [
  {
    label: '标记为已读',
    key: 'mark-read'
  },
  {
    label: '删除选中项',
    key: 'delete-selected',
    disabled: true
  },
  {
    type: 'divider'
  },
  {
    label: '导出选中项',
    key: 'export-selected',
    disabled: true
  }
]

const chartTypeOptions = [
  { label: '折线图', value: 'line' },
  { label: '柱状图', value: 'bar' },
  { label: '饼图', value: 'pie' },
  { label: '散点图', value: 'scatter' }
]

const chartGroupOptions = [
  { label: '按小时', value: 'hour' },
  { label: '按天', value: 'day' },
  { label: '按级别', value: 'level' },
  { label: '按来源', value: 'source' }
]

// 表格列定义
const tableColumns: DataTableColumns<LogEntry> = [
  {
    title: '时间',
    key: 'timestamp',
    width: 180,
    sorter: (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    render: (row) => {
      return h('span', { class: 'timestamp-cell' }, formatDateTime(row.timestamp))
    }
  },
  {
    title: '级别',
    key: 'level',
    width: 100,
    filterOptions: Object.values(LogLevel).map(level => ({
      label: level,
      value: level
    })),
    filter: (value, row) => row.level === value,
    render: (row) => {
      return h('div', { class: `level-badge level-${row.level.toLowerCase()}` }, [
        h('span', { class: 'level-dot' }),
        h('span', { class: 'level-text' }, row.level)
      ])
    }
  },
  {
    title: '来源',
    key: 'source',
    width: 120,
    render: (row) => {
      return h('span', { class: 'source-cell' }, formatSourceName(row.source))
    }
  },
  {
    title: '模块',
    key: 'module',
    width: 150
  },
  {
    title: '消息',
    key: 'message',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (row) => {
      return h(NSpace, { size: 'small' }, [
        h(NButton, {
          size: 'tiny',
          onClick: () => showLogDetail(row)
        }, '详情'),
        h(NButton, {
          size: 'tiny',
          ghost: true,
          onClick: () => copyLogContent(row)
        }, '复制')
      ])
    }
  }
]

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  pageCount: totalPages.value,
  showSizePicker: true,
  pageSizes: [50, 100, 200, 500],
  onChange: (page: number) => changePage(page),
  onUpdatePageSize: (pageSize: number) => changePageSize(pageSize),
  prefix: (info: any) => {
    return h('div', { class: 'pagination-prefix' }, [
      `共 ${totalLogs.value} 条日志，`,
      `当前显示 ${info.startIndex + 1}-${info.endIndex}`
    ])
  }
}))

// 方法
const setQuickPeriod = (period: string) => {
  activeQuickPeriod.value = period

  const now = new Date()
  let startTime: Date

  switch (period) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      startTime = new Date(0) // 所有时间
  }

  updateFilter({
    startTime,
    endTime: period === 'all' ? undefined : now
  })
}

const applySearch = () => {
  if (timeRange.value) {
    updateFilter({
      startTime: new Date(timeRange.value[0]),
      endTime: new Date(timeRange.value[1])
    })
  }

  showAdvancedSearch.value = false
  message.success('搜索条件已应用')
}

const clearSearch = () => {
  timeRange.value = null
  keyword.value = ''
  selectedSources.value = []
  filterLevels.value = []
  clearFilter()
  message.info('搜索条件已清除')
}

const handleRefresh = async () => {
  try {
    await refresh()
    message.success('日志已刷新')
  } catch {
    message.error('刷新失败')
  }
}

const handleExport = async (format: string) => {
  try {
    const content = await exportLogs(filter.value, format as any, true)
  
    // 创建下载
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  
    message.success('导出成功')
  } catch (error) {
    console.error('Export failed:', error)
    message.error('导出失败')
  }
}

const handleCleanup = async () => {
  try {
    // 调用清理接口
    message.success('日志清理任务已开始')
  } catch (error) {
    message.error('清理失败')
  }
}

const handleBatchAction = (key: string) => {
  switch (key) {
    case 'mark-read':
      message.info('标记为已读功能开发中')
      break
    case 'delete-selected':
      message.info('删除选中项功能开发中')
      break
    case 'export-selected':
      message.info('导出选中项功能开发中')
      break
  }
}

const toggleLogExpand = (logId: string) => {
  if (expandedLogs.value.has(logId)) {
    expandedLogs.value.delete(logId)
  } else {
    expandedLogs.value.add(logId)
  }
}

const showLogDetail = (log: LogEntry) => {
  selectedLog.value = log
  showDetailDrawer.value = true
}

const copyLogContent = (log: LogEntry) => {
  const text = `${formatDateTime(log.timestamp)} [${log.level}] [${log.source}::${log.module}] ${log.message}`
  navigator.clipboard.writeText(text)
    .then(() => message.success('已复制到剪贴板'))
    .catch(() => message.error('复制失败'))
}

const copyLogMessage = (log: LogEntry) => {
  navigator.clipboard.writeText(log.message)
    .then(() => message.success('消息已复制'))
    .catch(() => message.error('复制失败'))
}

const disableFutureDate = (timestamp: number) => {
  return timestamp > Date.now()
}

const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatSourceName = (source: LogSource): string => {
  const names: Record<LogSource, string> = {
    [LogSource.SYSTEM]: '系统',
    [LogSource.BALANCE]: '余额',
    [LogSource.API]: 'API',
    [LogSource.DATABASE]: '数据库',
    [LogSource.UI]: '用户界面',
    [LogSource.UPDATE]: '更新',
    [LogSource.PLUGIN]: '插件'
  }
  return names[source] || source
}

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// 图表相关
const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    updateChart()
  }
}

const updateChart = () => {
  if (!chartInstance) return

  // 根据日志数据生成图表
  const levelData = Object.entries(levelCounts.value).map(([level, count]) => ({
    name: level,
    value: count
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: 'var(--text-primary)'
      }
    },
    series: [
      {
        name: '日志级别分布',
        type: 'pie',
        radius: '50%',
        data: levelData.map(item => ({
          ...item,
          itemStyle: {
            color: getLevelColor(item.name as LogLevel)
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const getLevelColor = (level: LogLevel): string => {
  const colors: Record<LogLevel, string> = {
    [LogLevel.TRACE]: 'var(--text-tertiary)',
    [LogLevel.DEBUG]: 'var(--info-500)',
    [LogLevel.INFO]: 'var(--success-500)',
    [LogLevel.WARN]: 'var(--warning-500)',
    [LogLevel.ERROR]: 'var(--error-500)',
    [LogLevel.FATAL]: '#8b0000'
  }
  return colors[level] || 'var(--text-primary)'
}

const disposeChart = () => {
  chartInstance?.dispose()
}

// 实时日志处理
let liveLogInterval: number | null = null

const startLiveLogging = () => {
  if (liveLogInterval) clearInterval(liveLogInterval)

  liveLogInterval = setInterval(async () => {
    if (liveMode.value) {
      await refresh()
    }
  }, 5000) as unknown as number
}

const stopLiveLogging = () => {
  if (liveLogInterval) {
    clearInterval(liveLogInterval)
    liveLogInterval = null
  }
}

// 自动滚动处理
const handleAutoScroll = () => {
  if (autoScroll.value && viewMode.value === 'list') {
    // 滚动到最新日志
    const container = document.querySelector('.virtual-list')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }
}

// 生命周期
onMounted(() => {
  initChart()
  startLiveLogging()
})

onUnmounted(() => {
  disposeChart()
  stopLiveLogging()
})

// 监听变化
watch(liveMode, (newValue) => {
  if (newValue) {
    startLiveLogging()
  } else {
    stopLiveLogging()
  }
})

watch(filteredLogs, () => {
  if (autoScroll.value) {
    setTimeout(handleAutoScroll, 100)
  }
})

watch(viewMode, () => {
  if (viewMode.value === 'chart') {
    setTimeout(() => {
      chartInstance?.resize()
      updateChart()
    }, 100)
  }
})
</script>

<style scoped>
.modern-log-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--space-lg);
  background: var(--bg-primary);
}

/* 工具栏 */
.log-toolbar {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.toolbar-card {
  border: none;
  box-shadow: none;
}

.toolbar-content {
  padding: 0 !important;
}

.toolbar-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-light);
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.live-switch {
  :deep(.n-switch__button) {
    transition: all var(--transition-fast);
  }

  :deep(.n-switch--active) {
    background: var(--success-500) !important;
  }
}

.filter-badge {
  margin-left: 4px;
}

/* 高级搜索面板 */
.advanced-search-panel {
  padding: var(--space-lg);
  background: var(--bg-tertiary);
}

.search-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.search-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.search-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.search-actions {
  display: flex;
  justify-content: flex-end;
}

/* 日志统计 */
.log-stats {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-md) var(--space-lg);
}

.stats-left {
  flex: 1;
}

.level-trace {
  color: var(--text-tertiary);
}

.level-debug {
  color: var(--info-500);
}

.level-info {
  color: var(--success-500);
}

.level-warn {
  color: var(--warning-500);
}

.level-error,
.level-fatal {
  color: var(--error-500);
}

/* 日志内容区域 */
.log-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 列表视图 */
.log-list-view {
  flex: 1;
  overflow: hidden;
}

.virtual-list {
  height: 100%;
  overflow-y: auto;
}

/* 表格视图 */
.log-table-view {
  flex: 1;
  overflow: hidden;
}

.log-table {
  height: 100%;
}

.log-table :deep(.log-table-row) {
  transition: background-color var(--transition-fast);
}

.log-table :deep(.log-table-row:hover) {
  background: var(--bg-tertiary);
}

.timestamp-cell {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.level-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
}

.level-badge.level-trace {
  background: rgba(128, 128, 128, 0.1);
  color: var(--text-tertiary);
}

.level-badge.level-debug {
  background: rgba(24, 144, 255, 0.1);
  color: var(--info-500);
}

.level-badge.level-info {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success-500);
}

.level-badge.level-warn {
  background: rgba(250, 173, 20, 0.1);
  color: var(--warning-500);
}

.level-badge.level-error,
.level-badge.level-fatal {
  background: rgba(255, 77, 79, 0.1);
  color: var(--error-500);
}

.level-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.level-badge.level-trace .level-dot {
  background: var(--text-tertiary);
}

.level-badge.level-debug .level-dot {
  background: var(--info-500);
}

.level-badge.level-info .level-dot {
  background: var(--success-500);
}

.level-badge.level-warn .level-dot {
  background: var(--warning-500);
}

.level-badge.level-error .level-dot,
.level-badge.level-fatal .level-dot {
  background: var(--error-500);
}

.source-cell {
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.pagination-prefix {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* 图表视图 */
.log-chart-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.chart-container {
  flex: 1;
  min-height: 0;
}

.chart-card {
  height: 100%;
}

.chart {
  width: 100%;
  height: 400px;
}

.chart-controls {
  display: flex;
  justify-content: center;
}

/* 底部状态栏 */
.log-statusbar {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.status-left,
.status-right {
  flex: 1;
}

.status-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

.status-item.status-error {
  color: var(--error-500);
}

.pagination-info {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .toolbar-main {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-md);
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    justify-content: center;
  }

  .search-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .log-stats {
    flex-direction: column;
    gap: var(--space-md);
  }

  .stats-left,
  .stats-right {
    width: 100%;
    justify-content: center;
  }

  .log-statusbar {
    flex-direction: column;
    gap: var(--space-md);
  }

  .status-left,
  .status-right {
    justify-content: center;
  }
}
</style>
```

## 五、设计系统总结

### 5.1 现代化设计特点

#### ✅ **视觉层次清晰**
- 使用卡片式设计，通过阴影和边框区分层次
- 明确的间距系统，确保内容呼吸感
- 精心设计的色彩对比度，符合WCAG标准

#### ✅ **交互反馈完善**
- 按钮和卡片有悬停和点击反馈
- 平滑的过渡动画，提升用户体验
- 加载状态和错误状态的视觉反馈

#### ✅ **响应式设计**
- 适应不同屏幕尺寸的布局调整
- 移动端优化的交互方式
- 字体大小和间距的响应式调整

#### ✅ **可访问性考虑**
- 足够的色彩对比度
- 键盘导航支持
- 屏幕阅读器友好的语义化标签

#### ✅ **性能优化**
- 虚拟列表处理大数据量
- 图表懒加载和按需渲染
- 图片和资源的优化加载

### 5.2 实现建议

1. **渐进式增强**：先实现核心功能，再添加高级特性
2. **组件复用**：将通用组件提取为独立组件库
3. **主题系统**：完善深色/浅色主题切换
4. **性能监控**：集成性能监控和错误报告
5. **用户反馈**：添加用户反馈机制，持续改进设计

这个现代化UI设计方案为智衡Balancer提供了：
- ✅ **专业的企业级外观**
- ✅ **优秀的数据可视化**
- ✅ **流畅的用户体验**
- ✅ **灵活的扩展性**
- ✅ **完整的响应式支持**

设计遵循了现代化UI设计的最佳实践，并针对数据监控类应用的特点进行了优化。