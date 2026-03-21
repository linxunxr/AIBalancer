<template>
  <div class="settings-view">
    <div class="page-header">
      <h2 class="page-title">系统设置</h2>
      <p class="page-description">管理应用的全局设置和偏好选项</p>
    </div>

    <div class="settings-container">
      <!-- 通用设置 -->
      <div class="settings-section">
        <div class="section-header">
          <div class="section-icon">⚙</div>
          <h3 class="section-title">通用设置</h3>
        </div>

        <div class="setting-item">
          <label class="setting-label">语言</label>
          <div class="setting-control">
            <select v-model="settings.language" class="form-select">
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">主题</label>
          <div class="setting-control">
            <select v-model="settings.theme" class="form-select">
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="auto">跟随系统</option>
            </select>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">启动时自动检查更新</label>
          <div class="setting-control">
            <label class="toggle-label">
              <input type="checkbox" v-model="settings.autoCheckUpdates" class="toggle-input" />
              <span class="toggle-text">启用</span>
</label>
          </div>
        </div>
      </div>

      <!-- 账户设置 -->
      <div class="settings-section">
        <div class="section-header">
          <div class="section-icon">👤</div>
          <h3 class="section-title">账户设置</h3>
        </div>

        <div class="setting-item">
          <label class="setting-label">用户名</label>
          <div class="setting-control">
            <input
              type="text"
              v-model="settings.userName"
              placeholder="请输入用户名"
              class="form-input"
            />
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">API密钥管理</label>
          <div class="setting-control">
            <button class="btn btn-secondary" @click="showApiKeyManager">
              🔑 管理API密钥
            </button>
          </div>
        </div>
      </div>

      <!-- 通知设置 -->
      <div class="settings-section">
        <div class="section-header">
          <div class="section-icon">🔔</div>
          <h3 class="section-title">通知设置</h3>
        </div>

        <div class="setting-item">
          <label class="setting-label">启用通知</label>
          <div class="setting-control">
            <label class="toggle-label">
              <input type="checkbox" v-model="settings.notifications.enabled" class="toggle-input" />
              <span class="toggle-text">启用</span>
</label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">余额提醒阈值</label>
          <div class="setting-control">
            <div class="input-group">
              <input
                type="number"
                v-model.number="settings.notifications.balanceThreshold"
                :disabled="!settings.notifications.enabled"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="form-input"
              />
              <span class="unit">元</span>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">通知方式</label>
          <div class="setting-control">
            <select v-model="settings.notifications.method" :disabled="!settings.notifications.enabled" class="form-select">
              <option value="system">系统通知</option>
              <option value="email">邮件通知</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 数据设置 -->
      <div class="settings-section">
        <div class="section-header">
          <div class="section-icon">💾</div>
          <h3 class="section-title">数据设置</h3>
        </div>

        <div class="setting-item">
          <label class="setting-label">数据保留期</label>
          <div class="setting-control">
            <div class="input-group">
              <input
                type="number"
                v-model.number="settings.data.retentionDays"
                min="7"
                max="365"
                class="form-input"
              />
              <span class="unit">天</span>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">自动备份</label>
          <div class="setting-control">
            <label class="toggle-label">
              <input type="checkbox" v-model="settings.data.autoBackup" class="toggle-input" />
              <span class="toggle-text">启用</span>
</label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">上次备份时间</label>
          <div class="setting-control">
            <span class="info-text">{{ settings.data.lastBackup || '未备份' }}</span>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">数据操作</label>
          <div class="setting-control">
            <button class="btn btn-secondary" @click="exportAllData">
              📤 导出全部数据
            </button>
            <button class="btn btn-secondary" @click="importData">
              📥 导入数据
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">日志管理</label>
          <div class="setting-control">
            <button class="btn btn-secondary" @click="exportLogs">
              📋 导出日志
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="btn btn-secondary" @click="resetToDefault">
        ♻️ 重置为默认
      </button>
      <button class="btn btn-primary" @click="saveSettings">
        💾 保存设置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export interface NotificationSettings {
  enabled: boolean;
  balanceThreshold: number;
  method: 'system' | 'email' | 'webhook';
}

export interface DataSettings {
  retentionDays: number;
  autoBackup: boolean;
  lastBackup: string;
}

export interface AppSettings {
  language: string;
  theme: string;
  autoCheckUpdates: boolean;
  userName: string;
  notifications: NotificationSettings;
  data: DataSettings;
}

const defaultSettings: AppSettings = {
  language: 'zh-CN',
  theme: 'auto',
  autoCheckUpdates: true,
  userName: '用户',
  notifications: {
    enabled: true,
    balanceThreshold: 50.00,
    method: 'system',
  },
  data: {
    retentionDays: 30,
    autoBackup: false,
    lastBackup: '从未备份',
  },
};

const settings = ref<AppSettings>({ ...defaultSettings });

// 方法
const resetToDefault = () => {
  if (confirm('确定要重置为默认设置吗？')) {
    settings.value = { ...defaultSettings };
  }
};

const saveSettings = () => {
  localStorage.setItem('app-settings', JSON.stringify(settings.value));
  alert('设置已保存！');
};

const showApiKeyManager = () => {
  // TODO: 显示API密钥管理对话框
  alert('API密钥管理功能开发中...');
};

const exportAllData = () => {
  // TODO: 导出全部数据
  alert('导出功能开发中...');
};

const importData = () => {
  // TODO: 导入数据
  alert('导入功能开发中...');
};

const exportLogs = () => {
  // TODO: 调用 Rust 命令导出日志
  alert('导出日志功能开发中...\n日志将导出到应用目录的 logs 文件夹');
};

// 加载保存的设置
const loadSettings = () => {
  const saved = localStorage.getItem('app-settings');
  if (saved) {
    try {
      settings.value = JSON.parse(saved);
    } catch (e) {
      console.error('加载设置失败:', e);
    }
  }
};

loadSettings();
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  padding: var(--space-xl) 0;
}

.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.page-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

.settings-container {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-sm);
}

.settings-section {
  margin-bottom: var(--space-2xl);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-light);
}

.section-icon {
  font-size: 28px;
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) 0;
  border-bottom: 1px solid transparent;
  transition: border-color var(--transition-fast);
}

.setting-item:hover {
  border-bottom-color: var(--border-light);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin: 0 calc(-1 * var(--space-lg));
}

.setting-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  min-width: 200px;
}

.setting-control {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 300px;
}

.form-select,
.form-input {
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: all var(--transition-fast);
  min-width: 200px;
}

.form-select:disabled,
.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-select:focus,
.form-input:focus {
  border-color: var(--primary-500);
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-select:hover,
.form-input:hover {
  border-color: var(--border-medium);
}

.form-select {
  cursor: pointer;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.toggle-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.input-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.unit {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  margin-left: var(--space-xs);
}

.info-text {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--border-light);
  margin-top: var(--space-xl);
}

.btn {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn-primary {
  background: var(--primary-500);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-600);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-medium);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-heavy);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-view {
    max-width: 100%;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .setting-control {
    width: 100%;
    min-width: auto;
  }

  .form-select,
  .form-input {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
