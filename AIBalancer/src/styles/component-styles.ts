// src/styles/component-styles.ts
// 玻璃拟态组件样式模板

export const componentStyles = {
  // 玻璃卡片组件样式
  card: `
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border-radius: var(--radius-xl);
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-glass);
    transition: all var(--transition-normal);
  `,

  cardHover: `
    background: var(--glass-bg-hover);
    border-color: var(--glass-border-hover);
    box-shadow: var(--shadow-glass-hover);
    transform: translateY(-4px);
  `,

  // 玻璃按钮变体样式
  buttonPrimary: `
    background: var(--gradient-primary);
    color: white;
    border: none;
    border-radius: 20px;
    box-shadow: var(--shadow-glass);
    position: relative;
    overflow: hidden;
  `,

  buttonPrimaryHover: `
    box-shadow: var(--shadow-glass-hover), var(--glow-primary);
    transform: translateY(-2px);
  `,

  buttonPrimaryActive: `
    transform: translateY(0);
    box-shadow: var(--shadow-glass-active);
  `,

  buttonSecondary: `
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur-light));
    -webkit-backdrop-filter: blur(var(--glass-blur-light));
    color: var(--text-primary);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
  `,

  buttonSecondaryHover: `
    background: var(--glass-bg-hover);
    border-color: var(--glass-border-hover);
    box-shadow: var(--shadow-glass-hover);
  `,

  buttonGhost: `
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid transparent;
    border-radius: 20px;
  `,

  buttonGhostHover: `
    background: var(--glass-bg);
    border-color: var(--glass-border);
    color: var(--text-primary);
  `,

  buttonDanger: `
    background: var(--gradient-danger);
    color: white;
    border: none;
    border-radius: 20px;
    box-shadow: var(--shadow-glass);
  `,

  buttonDangerHover: `
    box-shadow: var(--shadow-glass-hover), var(--glow-danger);
    transform: translateY(-2px);
  `,

  // 玻璃输入框样式
  input: `
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur-light));
    -webkit-backdrop-filter: blur(var(--glass-blur-light));
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    transition: all var(--transition-normal);
  `,

  inputFocus: `
    background: var(--glass-bg-hover);
    border-color: var(--primary-start);
    box-shadow: var(--glow-primary), inset 0 0 20px rgba(94, 114, 235, 0.1);
    outline: none;
  `,

  inputPlaceholder: `
    color: var(--text-tertiary);
  `,

  // 玻璃标签样式
  badgeSuccess: `
    background: var(--gradient-success);
    color: white;
    border-radius: 20px;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    padding: 4px 12px;
    box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
  `,

  badgeWarning: `
    background: var(--gradient-warning);
    color: white;
    border-radius: 20px;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    padding: 4px 12px;
    box-shadow: 0 2px 8px rgba(250, 173, 20, 0.3);
  `,

  badgeError: `
    background: var(--gradient-danger);
    color: white;
    border-radius: 20px;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    padding: 4px 12px;
    box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
  `,

  badgeInfo: `
    background: var(--gradient-primary);
    color: white;
    border-radius: 20px;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    padding: 4px 12px;
    box-shadow: var(--glow-primary);
  `,

  // 玻璃表格行样式
  tableRow: `
    transition: all var(--transition-fast);
    background: transparent;
  `,

  tableRowHover: `
    background: var(--glass-bg);
  `,

  tableRowSelected: `
    background: linear-gradient(135deg, rgba(94, 114, 235, 0.15), rgba(157, 80, 187, 0.15));
    border-left: 3px solid var(--primary-start);
  `
};
