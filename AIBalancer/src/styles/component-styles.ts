import { css } from '@vue/reactivity';

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
};
