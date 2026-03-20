import { createApp } from 'vue';
import { createPinia } from 'pinia';
import naive from 'naive-ui';
import App from './App.vue';
import './styles.css';
import './styles/design-system.css';
import themeStore from './models/stores/themeStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(naive);

// 初始化主题
const theme = themeStore();
theme.initTheme();

app.mount('#app');
