<template>
  <slot v-if="!hasError" />
  <div v-else class="error-boundary">
    <div class="error-content">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div class="error-message">
        {{ userMessage }}
      </div>
      <button v-if="showRetry" class="retry-button" @click="handleRetry">
        重试
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, type ComponentPublicInstance } from 'vue';
import { captureException } from '../../core/errors/GlobalErrorHandler';

interface Props {
  /** 自定义错误消息 */
  userMessage?: string;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 错误发生时的回调 */
  onError?: (error: Error, instance: ComponentPublicInstance | null, info: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
  userMessage: '组件加载失败，请稍后重试',
  showRetry: true,
});

const emit = defineEmits<{
  retry: [];
}>();

const hasError = ref(false);
const errorInfo = ref<{ error: Error | null; info: string | null }>({
  error: null,
  info: null,
});

// 捕获子组件错误
onErrorCaptured((error: Error, instance: ComponentPublicInstance | null, info: string) => {
  hasError.value = true;
  errorInfo.value = { error, info };

  // 上报错误（用户无感知）
  captureException(error, {
    component: instance?.$options?.name || 'Unknown',
    lifecycleHook: info,
  });

  // 调用自定义错误处理
  if (props.onError) {
    props.onError(error, instance, info);
  }

  // 阻止错误继续向上传播
  return false;
});

// 重试处理
function handleRetry() {
  hasError.value = false;
  errorInfo.value = { error: null, info: null };
  emit('retry');
}

// 暴露方法供外部使用
defineExpose({
  reset: handleRetry,
  hasError,
});
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 24px;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 400px;
}

.error-icon {
  color: var(--text-tertiary, #999);
  margin-bottom: 16px;
}

.error-message {
  color: var(--text-secondary, #666);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.retry-button {
  padding: 8px 24px;
  background: var(--primary-color, #1890ff);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-button:hover {
  background: var(--primary-color-hover, #40a9ff);
}

.retry-button:active {
  background: var(--primary-color-active, #096dd9);
}
</style>
