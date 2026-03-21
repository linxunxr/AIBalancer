/**
 * 响应式设计系统
 * 提供断点检测、响应式状态管理和布局适配功能
 */

// 断点定义
export const BREAKPOINTS = {
  xs: 480,    // 超小屏幕
  sm: 640,    // 小屏幕（手机横屏）
  md: 768,    // 中等屏幕（平板竖屏）
  lg: 1024,   // 大屏幕（平板横屏/小笔记本）
  xl: 1280,   // 特大屏幕（桌面）
  xxl: 1536,  // 超大屏幕（大桌面）
} as const;

// 断点类型
export type Breakpoint = keyof typeof BREAKPOINTS;

// 设备类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';

// 屏幕方向
export type Orientation = 'portrait' | 'landscape';

// 响应式状态
export interface ResponsiveState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  deviceType: DeviceType;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouch: boolean;
  isRetina: boolean;
}

// 获取当前设备类型
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  if (width < BREAKPOINTS.xl) return 'desktop';
  return 'wide';
}

// 获取当前断点
export function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.xs) return 'xs';
  if (width < BREAKPOINTS.sm) return 'sm';
  if (width < BREAKPOINTS.md) return 'md';
  if (width < BREAKPOINTS.lg) return 'lg';
  if (width < BREAKPOINTS.xl) return 'xl';
  return 'xxl';
}

// 获取屏幕方向
export function getOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait';
}

// 检查是否为触摸设备
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // 检查触摸支持
  const hasTouchSupport = 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  // 检查是否为移动设备
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return hasTouchSupport && isMobileDevice;
}

// 检查是否为Retina屏幕
export function isRetinaDisplay(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaQuery = '(min-resolution: 2dppx)';
  return window.matchMedia(mediaQuery).matches;
}

// 创建响应式状态对象
export function createResponsiveState(): ResponsiveState {
  if (typeof window === 'undefined') {
    // 服务端渲染默认值
    return {
      width: 0,
      height: 0,
      breakpoint: 'md',
      deviceType: 'desktop',
      orientation: 'portrait',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isWide: false,
      isPortrait: false,
      isLandscape: false,
      isTouch: false,
      isRetina: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const breakpoint = getBreakpoint(width);
  const deviceType = getDeviceType(width);
  const orientation = getOrientation(width, height);

  return {
    width,
    height,
    breakpoint,
    deviceType,
    orientation,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop' || deviceType === 'wide',
    isWide: deviceType === 'wide',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isTouch: isTouchDevice(),
    isRetina: isRetinaDisplay(),
  };
}

// 断点匹配函数
export function matchesBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  return width >= BREAKPOINTS[breakpoint];
}

// 断点范围判断
export function isBetween(width: number, min: Breakpoint, max: Breakpoint): boolean {
  return width >= BREAKPOINTS[min] && width < BREAKPOINTS[max];
}

// 获取断点名称
export function getBreakpointName(breakpoint: Breakpoint): string {
  const names: Record<Breakpoint, string> = {
    xs: '超小',
    sm: '小',
    md: '中',
    lg: '大',
    xl: '特大',
    xxl: '超大',
  };
  return names[breakpoint];
}

// 获取设备类型名称
export function getDeviceTypeName(deviceType: DeviceType): string {
  const names: Record<DeviceType, string> = {
    mobile: '移动端',
    tablet: '平板',
    desktop: '桌面端',
    wide: '宽屏',
  };
  return names[deviceType];
}

// 计算列数
export function calculateColumns(
  width: number,
  options: {
    minColumnWidth?: number;
    maxColumns?: number;
    gap?: number;
  } = {}
): number {
  const {
    minColumnWidth = 280,
    maxColumns = 12,
    gap = 24,
  } = options;

  const availableWidth = width - gap;
  const calculatedColumns = Math.floor(availableWidth / (minColumnWidth + gap));

  return Math.min(Math.max(calculatedColumns, 1), maxColumns);
}

// 计算栅格布局
export function calculateGridLayout(
  width: number,
  columns: number,
  gap: number = 24
): { columnWidth: number; totalWidth: number } {
  const totalGaps = (columns - 1) * gap;
  const columnWidth = (width - totalGaps) / columns;

  return {
    columnWidth,
    totalWidth: width,
  };
}

// 响应式工具类名
export function getResponsiveClasses(state: ResponsiveState): string[] {
  const classes: string[] = [];

  // 设备类型
  classes.push(`device-${state.deviceType}`);
  classes.push(`breakpoint-${state.breakpoint}`);

  // 屏幕方向
  if (state.isPortrait) classes.push('orientation-portrait');
  if (state.isLandscape) classes.push('orientation-landscape');

  // 触摸设备
  if (state.isTouch) classes.push('is-touch');

  // Retina屏幕
  if (state.isRetina) classes.push('is-retina');

  return classes;
}

// 媒体查询辅助函数
export function getMediaQuery(breakpoint: Breakpoint, type: 'min' | 'max' = 'min'): string {
  const pixelValue = BREAKPOINTS[breakpoint];

  if (type === 'min') {
    return `(min-width: ${pixelValue}px)`;
  } else {
    return `(max-width: ${pixelValue - 1}px)`;
  }
}

// 组合媒体查询
export function combineMediaQueries(
  ...conditions: Array<{ breakpoint: Breakpoint; type: 'min' | 'max' }>
): string {
  return conditions
    .map(({ breakpoint, type }) => getMediaQuery(breakpoint, type))
    .join(' and ');
}

// 响应式间距计算
export function calculateResponsiveSpacing(
  state: ResponsiveState,
  options: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  }
): number {
  const {
    mobile = 16,
    tablet = 24,
    desktop = 32,
    wide = 48,
  } = options;

  switch (state.deviceType) {
    case 'mobile':
      return mobile;
    case 'tablet':
      return tablet;
    case 'desktop':
      return desktop;
    case 'wide':
      return wide;
    default:
      return desktop;
  }
}

// 响应式字号计算
export function calculateResponsiveFontSize(
  state: ResponsiveState,
  options: {
    base?: number;
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  }
): number {
  const {
    base = 16,
    mobile = 14,
    tablet = 16,
    desktop = 16,
    wide = 18,
  } = options;

  switch (state.deviceType) {
    case 'mobile':
      return mobile;
    case 'tablet':
      return tablet;
    case 'desktop':
      return desktop;
    case 'wide':
      return wide;
    default:
      return base;
  }
}

// 导出所有工具
export default {
  BREAKPOINTS,
  getDeviceType,
  getBreakpoint,
  getOrientation,
  isTouchDevice,
  isRetinaDisplay,
  createResponsiveState,
  matchesBreakpoint,
  isBetween,
  getBreakpointName,
  getDeviceTypeName,
  calculateColumns,
  calculateGridLayout,
  getResponsiveClasses,
  getMediaQuery,
  combineMediaQueries,
  calculateResponsiveSpacing,
  calculateResponsiveFontSize,
};
