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
        <template v-for="item in menuItems" :key="item.key">
          <!-- 有子菜单的项 -->
          <template v-if="item.children">
            <a
              :class="['nav-item', { active: activeKey.startsWith(item.key), expanded: expandedMenus.has(item.key) }]"
              @click="toggleSubMenu(item)"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span v-if="!isSidebarCollapsed" class="nav-text">{{ item.label }}</span>
              <span v-if="!isSidebarCollapsed" class="expand-icon">
                {{ expandedMenus.has(item.key) ? '▼' : '▶' }}
              </span>
            </a>
            <!-- 子菜单 -->
            <div v-if="expandedMenus.has(item.key) && !isSidebarCollapsed" class="sub-menu">
              <a
                v-for="child in item.children"
                :key="child.key"
                :class="['nav-item sub-item', { active: activeKey === child.key }]"
                @click="handleMenuSelect(child)"
              >
                <span class="nav-icon">{{ child.icon }}</span>
                <span class="nav-text">{{ child.label }}</span>
              </a>
            </div>
          </template>
          <!-- 无子菜单的项 -->
          <template v-else>
            <a
              :class="['nav-item', { active: activeKey === item.key }]"
              @click="handleMenuSelect(item)"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span v-if="!isSidebarCollapsed" class="nav-text">{{ item.label }}</span>
            </a>
          </template>
        </template>
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
        <n-config-provider :theme-overrides="currentThemeOverrides">
          <n-message-provider>
            <div class="page-content">
              <slot></slot>
            </div>
          </n-message-provider>
        </n-config-provider>
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
import { NMessageProvider, NConfigProvider } from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';
import appStore from '../../models/stores/appStore';
import themeStore from '../../models/stores/themeStore';

// 玻璃拟态主题覆盖配置
const glassThemeOverrides: GlobalThemeOverrides = {
  common: {
    borderRadius: '12px',
    borderRadiusSmall: '8px',
  },
  Card: {
    color: 'rgba(255, 255, 255, 0.08)',
    colorEmbedded: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    titleTextColor: 'rgba(255, 255, 255, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.85)',
  },
  Button: {
    borderRadiusMedium: '20px',
    borderRadiusSmall: '16px',
    borderRadiusTiny: '12px',
    // Primary 按钮配置
    colorPrimary: '#5e72e4',
    colorHoverPrimary: '#6c7ae4',
    colorPressedPrimary: '#4e62d4',
    textColorPrimary: '#ffffff',
    textColorHoverPrimary: '#ffffff',
    textColorPressedPrimary: '#ffffff',
    // Error 按钮配置
    colorError: 'rgba(239, 68, 68, 0.15)',
    colorHoverError: 'rgba(239, 68, 68, 0.25)',
    colorPressedError: 'rgba(239, 68, 68, 0.35)',
    textColorError: '#ff4d4f',
    textColorHoverError: '#ff4d4f',
    textColorPressedError: '#ff4d4f',
    // Default 按钮配置
    color: 'rgba(255, 255, 255, 0.08)',
    colorHover: 'rgba(255, 255, 255, 0.15)',
    colorPressed: 'rgba(255, 255, 255, 0.2)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    textColorHover: 'rgba(255, 255, 255, 1)',
    textColorPressed: 'rgba(255, 255, 255, 0.9)',
    textColorFocus: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderColorHover: 'rgba(255, 255, 255, 0.25)',
    borderColorPressed: 'rgba(255, 255, 255, 0.3)',
    borderColorFocus: 'rgba(94, 114, 235, 0.5)',
    // Tiny 按钮字体大小
    fontSizeTiny: '13px',
    fontSizeSmall: '13px',
    fontSizeMedium: '14px',
    fontSizeLarge: '15px',
    // 按钮内边距
    paddingTiny: '0 10px',
    paddingSmall: '0 14px',
    paddingMedium: '0 18px',
    paddingLarge: '0 22px',
    // 按钮高度
    heightTiny: '26px',
    heightSmall: '30px',
    heightMedium: '34px',
    heightLarge: '40px',
  },
  Input: {
    color: 'rgba(255, 255, 255, 0.05)',
    colorFocus: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderColorFocus: '#5e72e4',
    borderRadius: '12px',
    textColor: 'rgba(255, 255, 255, 0.95)',
    placeholderColor: 'rgba(255, 255, 255, 0.35)',
  },
  Select: {
    peers: {
      InternalSelection: {
        color: 'rgba(255, 255, 255, 0.05)',
        colorActive: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderColorFocus: '#5e72e4',
        borderRadius: '12px',
        textColor: 'rgba(255, 255, 255, 0.95)',
        placeholderColor: 'rgba(255, 255, 255, 0.35)',
      },
      InternalSelectMenu: {
        color: 'rgba(30, 30, 45, 0.95)',
        optionColorPending: 'rgba(94, 114, 235, 0.12)',
        optionColorActive: 'rgba(94, 114, 235, 0.2)',
        optionColorActivePending: 'rgba(94, 114, 235, 0.25)',
        optionTextColor: 'rgba(255, 255, 255, 0.85)',
        optionTextColorPressed: 'rgba(255, 255, 255, 0.9)',
        optionTextColorActive: 'rgba(255, 255, 255, 0.95)',
        optionCheckColor: '#5e72e4',
        groupHeaderTextColor: 'rgba(255, 255, 255, 0.5)',
        paddingMedium: '6px',
      },
    },
  },
  DataTable: {
    thColor: 'rgba(255, 255, 255, 0.03)',
    tdColor: 'transparent',
    tdColorHover: 'rgba(94, 114, 235, 0.05)',
    thColorHover: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    thTextColor: 'rgba(255, 255, 255, 0.6)',
    tdTextColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '12px',
  },
  Tag: {
    borderRadius: '6px',
    colorBordered: 'rgba(94, 114, 235, 0.1)',
    borderColor: 'rgba(94, 114, 235, 0.3)',
    textColor: 'rgba(94, 114, 235, 1)',
  },
  Dialog: {
    color: 'rgba(30, 30, 45, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    titleTextColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
  },
  Modal: {
    color: 'rgba(30, 30, 45, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    titleTextColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
  },
  Drawer: {
    color: 'rgba(30, 30, 45, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    headerBorderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    footerBorderTop: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px 0 0 16px',
  },
  Message: {
    color: 'rgba(30, 30, 45, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
  },
  Notification: {
    color: 'rgba(30, 30, 45, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
  },
  Pagination: {
    buttonColor: 'rgba(255, 255, 255, 0.05)',
    buttonColorHover: 'rgba(255, 255, 255, 0.1)',
    buttonColorActive: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
    buttonTextColor: 'rgba(255, 255, 255, 0.85)',
    buttonTextColorActive: '#ffffff',
    borderRadius: '8px',
  },
  Tabs: {
    tabTextColorCard: 'rgba(255, 255, 255, 0.6)',
    tabTextColorActiveCard: 'rgba(255, 255, 255, 0.95)',
    tabTextColorHoverCard: 'rgba(255, 255, 255, 0.8)',
    barColor: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
  },
  Switch: {
    railColorActive: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
  },
  Checkbox: {
    colorChecked: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
    borderChecked: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
  },
  Radio: {
    buttonColorActive: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
    buttonTextColorActive: '#ffffff',
    dotColorActive: '#ffffff',
  },
  Popover: {
    color: 'rgba(30, 30, 45, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
  },
  Tooltip: {
    color: 'rgba(30, 30, 45, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '8px',
  },
  Dropdown: {
    color: 'rgba(30, 30, 45, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.85)',
    optionColorHover: 'rgba(94, 114, 235, 0.1)',
    optionTextColorHover: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
  },
  Empty: {
    textColor: 'rgba(255, 255, 255, 0.4)',
  },
  Spin: {
    color: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
  },
  Skeleton: {
    color: 'rgba(255, 255, 255, 0.05)',
    colorEnd: 'rgba(255, 255, 255, 0.1)',
  },
  Alert: {
    colorError: 'rgba(239, 68, 68, 0.1)',
    colorWarning: 'rgba(250, 173, 20, 0.1)',
    colorSuccess: 'rgba(82, 196, 26, 0.1)',
    colorInfo: 'rgba(94, 114, 235, 0.1)',
    textColorError: 'rgba(255, 77, 79, 0.95)',
    textColorWarning: 'rgba(250, 173, 20, 0.95)',
    textColorSuccess: 'rgba(82, 196, 26, 0.95)',
    textColorInfo: 'rgba(94, 114, 235, 0.95)',
    borderRadius: '12px',
  },
  Progress: {
    fillGradient: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
    railColor: 'rgba(255, 255, 255, 0.1)',
  },
  Avatar: {
    color: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
    textColor: '#ffffff',
  },
  Badge: {
    color: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
    textColor: '#ffffff',
  },
};

// 浅色主题配置
const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    borderRadius: '12px',
    borderRadiusSmall: '8px',
  },
  Card: {
    color: 'rgba(255, 255, 255, 0.9)',
    colorEmbedded: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    titleTextColor: 'rgba(0, 0, 0, 0.9)',
    textColor: 'rgba(0, 0, 0, 0.75)',
  },
  Button: {
    borderRadiusMedium: '20px',
    borderRadiusSmall: '16px',
    borderRadiusTiny: '12px',
    // Primary 按钮配置
    colorPrimary: '#5e72e4',
    colorHoverPrimary: '#6c7ae4',
    colorPressedPrimary: '#4e62d4',
    textColorPrimary: '#ffffff',
    textColorHoverPrimary: '#ffffff',
    textColorPressedPrimary: '#ffffff',
    // Error 按钮配置
    colorError: 'rgba(239, 68, 68, 0.1)',
    colorHoverError: 'rgba(239, 68, 68, 0.2)',
    colorPressedError: 'rgba(239, 68, 68, 0.3)',
    textColorError: '#ff4d4f',
    textColorHoverError: '#ff4d4f',
    textColorPressedError: '#ff4d4f',
    // Default 按钮配置
    color: 'rgba(0, 0, 0, 0.05)',
    colorHover: 'rgba(0, 0, 0, 0.1)',
    colorPressed: 'rgba(0, 0, 0, 0.15)',
    textColor: 'rgba(0, 0, 0, 0.85)',
    textColorHover: 'rgba(0, 0, 0, 0.95)',
    textColorPressed: 'rgba(0, 0, 0, 0.9)',
    textColorFocus: 'rgba(0, 0, 0, 0.85)',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderColorHover: 'rgba(0, 0, 0, 0.2)',
    borderColorPressed: 'rgba(0, 0, 0, 0.25)',
    borderColorFocus: 'rgba(94, 114, 235, 0.5)',
    // Tiny 按钮字体大小
    fontSizeTiny: '13px',
    fontSizeSmall: '13px',
    fontSizeMedium: '14px',
    fontSizeLarge: '15px',
    // 按钮内边距
    paddingTiny: '0 10px',
    paddingSmall: '0 14px',
    paddingMedium: '0 18px',
    paddingLarge: '0 22px',
    // 按钮高度
    heightTiny: '26px',
    heightSmall: '30px',
    heightMedium: '34px',
    heightLarge: '40px',
  },
  Input: {
    color: 'rgba(0, 0, 0, 0.03)',
    colorFocus: 'rgba(0, 0, 0, 0.05)',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderColorFocus: '#5e72e4',
    borderRadius: '12px',
    textColor: 'rgba(0, 0, 0, 0.9)',
    placeholderColor: 'rgba(0, 0, 0, 0.4)',
  },
  Select: {
    peers: {
      InternalSelection: {
        color: 'rgba(0, 0, 0, 0.03)',
        colorActive: 'rgba(0, 0, 0, 0.05)',
        borderColor: 'rgba(0, 0, 0, 0.12)',
        borderColorFocus: '#5e72e4',
        borderRadius: '12px',
        textColor: 'rgba(0, 0, 0, 0.9)',
        placeholderColor: 'rgba(0, 0, 0, 0.4)',
      },
      InternalSelectMenu: {
        color: 'rgba(255, 255, 255, 0.98)',
        optionColorPending: 'rgba(94, 114, 235, 0.08)',
        optionColorActive: 'rgba(94, 114, 235, 0.15)',
        optionColorActivePending: 'rgba(94, 114, 235, 0.2)',
        optionTextColor: 'rgba(0, 0, 0, 0.85)',
        optionTextColorPressed: 'rgba(0, 0, 0, 0.9)',
        optionTextColorActive: 'rgba(0, 0, 0, 0.95)',
        optionCheckColor: '#5e72e4',
        groupHeaderTextColor: 'rgba(0, 0, 0, 0.5)',
        paddingMedium: '6px',
      },
    },
  },
  DataTable: {
    thColor: 'rgba(0, 0, 0, 0.03)',
    tdColor: 'transparent',
    tdColorHover: 'rgba(94, 114, 235, 0.08)',
    thColorHover: 'rgba(0, 0, 0, 0.05)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    thTextColor: 'rgba(0, 0, 0, 0.6)',
    tdTextColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: '12px',
  },
  Tag: {
    borderRadius: '6px',
    colorBordered: 'rgba(94, 114, 235, 0.1)',
    borderColor: 'rgba(94, 114, 235, 0.3)',
    textColor: 'rgba(94, 114, 235, 1)',
  },
  Dialog: {
    color: 'rgba(255, 255, 255, 0.98)',
    textColor: 'rgba(0, 0, 0, 0.9)',
    titleTextColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: '16px',
  },
  Modal: {
    color: 'rgba(255, 255, 255, 0.98)',
    textColor: 'rgba(0, 0, 0, 0.9)',
    titleTextColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: '16px',
  },
  Drawer: {
    color: 'rgba(255, 255, 255, 0.98)',
    textColor: 'rgba(0, 0, 0, 0.9)',
    headerBorderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    footerBorderTop: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '16px 0 0 16px',
  },
  Message: {
    color: 'rgba(255, 255, 255, 0.98)',
    textColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: '12px',
  },
  Pagination: {
    buttonColor: 'rgba(0, 0, 0, 0.03)',
    buttonColorHover: 'rgba(0, 0, 0, 0.08)',
    buttonColorActive: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
    buttonTextColor: 'rgba(0, 0, 0, 0.85)',
    buttonTextColorActive: '#ffffff',
    borderRadius: '8px',
  },
  Tabs: {
    tabTextColorCard: 'rgba(0, 0, 0, 0.6)',
    tabTextColorActiveCard: 'rgba(0, 0, 0, 0.9)',
    tabTextColorHoverCard: 'rgba(0, 0, 0, 0.75)',
    barColor: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
  },
  Switch: {
    railColorActive: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
  },
  Checkbox: {
    colorChecked: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
    borderChecked: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
  },
  Radio: {
    buttonColorActive: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
    buttonTextColorActive: '#ffffff',
    dotColorActive: '#ffffff',
  },
  Popover: {
    color: 'rgba(255, 255, 255, 0.98)',
    textColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: '12px',
  },
  Tooltip: {
    color: 'rgba(30, 30, 45, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '8px',
  },
  Dropdown: {
    color: 'rgba(255, 255, 255, 0.98)',
    textColor: 'rgba(0, 0, 0, 0.85)',
    optionColorHover: 'rgba(94, 114, 235, 0.1)',
    optionTextColorHover: 'rgba(0, 0, 0, 0.95)',
    borderRadius: '12px',
  },
  Empty: {
    textColor: 'rgba(0, 0, 0, 0.4)',
  },
  Spin: {
    color: 'linear-gradient(135deg, #5e72e4 0%, #9d50bb 100%)',
  },
  Alert: {
    colorError: 'rgba(239, 68, 68, 0.1)',
    colorWarning: 'rgba(250, 173, 20, 0.1)',
    colorSuccess: 'rgba(82, 196, 26, 0.1)',
    colorInfo: 'rgba(94, 114, 235, 0.1)',
    textColorError: 'rgba(239, 68, 68, 1)',
    textColorWarning: 'rgba(250, 173, 20, 1)',
    textColorSuccess: 'rgba(82, 196, 26, 1)',
    textColorInfo: 'rgba(94, 114, 235, 1)',
    borderRadius: '12px',
  },
};

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
const activeKey = ref('dashboard');
const unreadCount = ref(3);
const expandedMenus = ref(new Set()); // 默认无展开菜单

// 计算属性
const themeClass = computed(() => theme.value === 'dark' ? '' : 'light-theme');
const currentThemeOverrides = computed(() => theme.value === 'dark' ? glassThemeOverrides : lightThemeOverrides);
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
  const routeMap: Record<string, { label: string; parent?: string }> = {
    'dashboard': { label: '仪表盘' },
    'accounts': { label: '账户管理' },
    'quota': { label: '配额管理' },
    'settings': { label: '系统设置' }
  };

  const item = routeMap[activeKey.value] || { label: activeKey.value };
  const result = [];

  if (item.parent) {
    const parentItem = routeMap[item.parent];
    if (parentItem) {
      result.push({ key: item.parent, label: parentItem.label });
    }
  }

  result.push({ key: activeKey.value, label: item.label });
  return result;
});

// 菜单选项
const menuItems = [
  { key: 'dashboard', label: '仪表盘', icon: '📊', path: '/dashboard' },
  { key: 'accounts', label: '账户管理', icon: '💳', path: '/accounts' },
  { key: 'quota', label: '配额管理', icon: '📦', path: '/quota' },
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

const toggleSubMenu = (item: any) => {
  if (isSidebarCollapsed.value) {
    // 如果侧边栏折叠，先展开侧边栏
    isSidebarCollapsed.value = false;
  }

  if (expandedMenus.value.has(item.key)) {
    expandedMenus.value.delete(item.key);
  } else {
    expandedMenus.value.add(item.key);
  }
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
/* 玻璃拟态主布局 */
.main-layout {
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family);
  overflow: hidden;
  /* 添加背景渐变装饰 */
  background-image:
    radial-gradient(ellipse at 20% 0%, rgba(94, 114, 235, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(157, 80, 187, 0.06) 0%, transparent 50%);
}

/* 玻璃侧边栏样式 */
.sidebar {
  width: 256px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-medium));
  -webkit-backdrop-filter: blur(var(--glass-blur-medium));
  border-right: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  transition: all var(--transition-normal);
  z-index: 100;
  flex-shrink: 0;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.2);
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: var(--space-lg) var(--space-lg) var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--glass-border);
  position: relative;
}

/* 头部渐变分隔线 */
.sidebar-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.app-logo {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--gradient-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: var(--glow-primary);
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
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  letter-spacing: 1px;
}

.collapse-btn {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  color: var(--text-primary);
  box-shadow: var(--shadow-glass-hover);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md) 0;
  overflow-y: auto;
}

/* 玻璃导航项 */
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 12px 24px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-decoration: none;
  border-radius: var(--radius-lg);
  margin: 2px 8px;
  border: 1px solid transparent;
  background: transparent;
  position: relative;
  overflow: hidden;
}

/* 导航项悬浮效果 */
.nav-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity var(--transition-normal);
  filter: blur(10px);
  z-index: -1;
}

.nav-item:hover {
  background: var(--glass-bg);
  border-color: var(--glass-border);
  color: var(--text-primary);
}

.nav-item:hover::before {
  opacity: 0.1;
}

/* 激活状态 - 渐变背景 + 发光 */
.nav-item.active {
  background: linear-gradient(
    135deg,
    rgba(94, 114, 235, 0.2),
    rgba(157, 80, 187, 0.2)
  );
  border: 1px solid rgba(94, 114, 235, 0.3);
  color: var(--primary-start);
  box-shadow: var(--glow-primary), inset 0 0 20px rgba(94, 114, 235, 0.1);
}

.nav-item.active::before {
  opacity: 0.2;
}

/* 激活指示条 */
.nav-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--gradient-primary);
  border-radius: 0 2px 2px 0;
  box-shadow: var(--glow-primary);
}

.nav-icon {
  font-size: 18px;
  transition: transform var(--transition-fast);
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.expand-icon {
  margin-left: auto;
  font-size: 10px;
  transition: transform var(--transition-fast);
}

.sub-menu {
  padding-left: 16px;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.nav-item.sub-item {
  padding: 10px 24px 10px 40px;
  font-size: var(--text-xs);
}

.nav-item.expanded .expand-icon {
  transform: rotate(90deg);
}

/* 玻璃页脚 */
.sidebar-footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--glass-border);
  position: relative;
}

/* 页脚渐变分隔线 */
.sidebar-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-semibold);
  box-shadow: var(--glow-primary);
  border: 2px solid var(--glass-border);
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
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.action-btn:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  color: var(--text-primary);
  box-shadow: var(--shadow-glass-hover);
}

/* 主要操作按钮 - 渐变效果 */
.action-btn.primary {
  background: var(--gradient-primary);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: var(--shadow-glass);
}

.action-btn.primary:hover {
  box-shadow: var(--shadow-glass-hover), var(--glow-primary);
  transform: translateY(-2px);
}

.action-btn.primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-glass-active);
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

/* 玻璃顶部导航栏 */
.top-navbar {
  height: 64px;
  padding: 0 var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-medium));
  -webkit-backdrop-filter: blur(var(--glass-blur-medium));
  flex-shrink: 0;
  position: relative;
}

/* 导航栏底部发光线 */
.top-navbar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
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

.breadcrumb-item:last-child {
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

/* 玻璃搜索框 */
.global-search {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
  color: var(--text-primary);
  font-size: var(--text-sm);
  width: 220px;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-glass);
}

.global-search:focus {
  border-color: var(--primary-start);
  background: var(--glass-bg-hover);
  outline: none;
  box-shadow: var(--glow-primary), inset 0 0 20px rgba(94, 114, 235, 0.1);
}

.global-search::placeholder {
  color: var(--text-tertiary);
}

/* 玻璃图标按钮 */
.icon-btn {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
  border: 1px solid var(--glass-border);
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  font-size: 18px;
  transition: all var(--transition-fast);
  color: var(--text-secondary);
}

.icon-btn:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  color: var(--text-primary);
  box-shadow: var(--shadow-glass-hover);
}

/* 通知徽章 */
.icon-btn.has-badge::after {
  content: '';
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: var(--gradient-danger);
  border-radius: 50%;
  box-shadow: var(--glow-danger);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--gradient-danger);
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  font-weight: var(--font-bold);
  box-shadow: var(--glow-danger);
}

.page-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xl);
}

.page-content {
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

/* 玻璃页脚 */
.app-footer {
  padding: var(--space-md) var(--space-xl);
  border-top: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-medium));
  -webkit-backdrop-filter: blur(var(--glass-blur-medium));
  display: flex;
  justify-content: center;
  position: relative;
}

/* 页脚顶部发光线 */
.app-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
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

/* 玻璃链接按钮 */
.link-btn {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--primary-start);
  cursor: pointer;
  font-size: var(--text-xs);
  padding: 6px 12px;
  border-radius: 20px;
  transition: all var(--transition-fast);
}

.link-btn:hover {
  background: var(--gradient-primary);
  border-color: transparent;
  color: white;
  box-shadow: var(--glow-primary);
}

/* 玻璃设置抽屉遮罩 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 玻璃抽屉 */
.drawer {
  height: 100%;
  width: 400px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-left: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);
}

@keyframes slideInRight {
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
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--glass-border);
  position: relative;
}

.drawer-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.drawer-header h3 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-light));
  -webkit-backdrop-filter: blur(var(--glass-blur-light));
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
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
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
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
