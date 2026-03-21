import { createApp } from 'vue';
import { createPinia } from 'pinia';
import naive from 'naive-ui';
import App from './App.vue';
import './styles.css';
import './styles/design-system.css';

// 玻璃拟态样式文件
import './styles/glass-mixins.css';
import './styles/animations.css';
import './styles/naive-ui-glass.css';
import './styles/interactions.css';
import './styles/micro-interactions.css';
import './styles/glass-fallback.css';
import './styles/performance.css';
import './styles/responsive-mixins.css';

import themeStore from './models/stores/themeStore';

// 导入全局错误处理
import { globalErrorHandler } from './core/errors/GlobalErrorHandler';
import { ErrorBoundary } from './components/common';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(naive);

// 注册全局组件
app.component('ErrorBoundary', ErrorBoundary);

// 设置 Vue 全局错误处理器
app.config.errorHandler = (error, _instance, info) => {
  // 错误会被 GlobalErrorHandler 自动捕获
  console.error('[Vue Error]', error, info);
};

// 初始化全局错误处理器（自动捕获 JS 错误和 Promise 拒绝）
globalErrorHandler.init();

// 记录应用启动
globalErrorHandler.logInfo('app', 'Application started');

// 初始化主题
const theme = themeStore();
theme.initTheme();

app.mount('#app');
