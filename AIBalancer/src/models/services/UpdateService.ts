/**
 * Update Service
 * 更新服务 - 检查应用更新
 */

import { invoke } from '@tauri-apps/api/core';
import { AppError, ErrorCode } from '../../core/errors';

export interface UpdateInfo {
  version: string;
  releaseDate: Date;
  releaseNotes: string;
  downloadUrl: string;
  size: number;
  mandatory: boolean;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  updateInfo?: UpdateInfo;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

export class UpdateService {
  private static instance: UpdateService;
  private updateUrl = 'https://api.github.com/repos/your-org/AIBalancer/releases/latest';
  private currentVersion = '1.0.0';

  private downloading = false;
  private downloadProgress: DownloadProgress | null = null;

  private constructor() {
    // 私有构造函数
  }

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * 获取当前版本
   */
  async getCurrentVersion(): Promise<string> {
    try {
      const version = await invoke<string>('app_get_version');
      this.currentVersion = version;
      return version;
    } catch {
      return this.currentVersion;
    }
  }

  /**
   * 检查更新
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const currentVersion = await this.getCurrentVersion();

      try {
        const response = await fetch(this.updateUrl);
        if (!response.ok) {
          throw new AppError('检查更新失败', ErrorCode.NETWORK_ERROR);
        }

        const release = await response.json();
        const latestVersion = release.tag_name.replace(/^v/, '');

        const hasUpdate = this.compareVersions(latestVersion, currentVersion) > 0;

        return {
          hasUpdate,
          currentVersion,
          latestVersion: hasUpdate ? latestVersion : undefined,
          updateInfo: hasUpdate ? {
            version: latestVersion,
            releaseDate: new Date(release.published_at),
            releaseNotes: release.body || '',
            downloadUrl: this.getDownloadUrl(release.assets),
            size: this.getAssetSize(release.assets),
            mandatory: release.prerelease === false && this.isMandatoryUpdate(currentVersion, latestVersion)
          } : undefined
        };
      } catch (error) {
        // 网络错误或其他问题，返回无更新
        console.error('[UpdateService] Failed to check for updates:', error);
        return {
          hasUpdate: false,
          currentVersion
        };
      }
    } catch (error) {
      throw new AppError('检查更新失败', ErrorCode.API_ERROR, undefined, error as Error);
    }
  }

  /**
   * 下载更新
   */
  async downloadUpdate(
    downloadUrl: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<Blob> {
    if (this.downloading) {
      throw new AppError('已有更新正在下载中', ErrorCode.VALIDATION_ERROR);
    }

    this.downloading = true;
    this.downloadProgress = null;

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new AppError('下载更新失败', ErrorCode.NETWORK_ERROR);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const chunks: Uint8Array[] = [];
      let downloaded = 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AppError('无法读取响应流', ErrorCode.NETWORK_ERROR);
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        downloaded += value.length;

        if (total > 0 && onProgress) {
          this.downloadProgress = {
            downloaded,
            total,
            percentage: (downloaded / total) * 100
          };
          onProgress(this.downloadProgress);
        }
      }

      const blob = new Blob(chunks);
      this.downloadProgress = {
        downloaded: downloaded,
        total: downloaded,
        percentage: 100
      };

      return blob;
    } finally {
      this.downloading = false;
    }
  }

  /**
   * 安装更新
   */
  async installUpdate(updateFile: Blob): Promise<void> {
    try {
      // 在Tauri中调用安装更新命令
      const arrayBuffer = await updateFile.arrayBuffer();
      await invoke('app_install_update', {
        file: Array.from(new Uint8Array(arrayBuffer))
      });
    } catch (error) {
      throw new AppError('安装更新失败', ErrorCode.API_ERROR, undefined, error as Error);
    }
  }

  /**
   * 重启应用
   */
  async restart(): Promise<void> {
    try {
      await invoke('app_restart');
    } catch (error) {
      throw new AppError('重启应用失败', ErrorCode.API_ERROR, undefined, error as Error);
    }
  }

  /**
   * 获取下载进度
   */
  getDownloadProgress(): DownloadProgress | null {
    return this.downloadProgress;
  }

  /**
   * 是否正在下载
   */
  isDownloading(): boolean {
    return this.downloading;
  }

  /**
   * 取消下载
   */
  cancelDownload(): void {
    if (this.downloading) {
      this.downloading = false;
      this.downloadProgress = null;
    }
  }

  /**
   * 比较版本号
   */
  private compareVersions(version1: string, version2: string): number {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  /**
   * 判断是否为强制更新
   */
  private isMandatoryUpdate(currentVersion: string, latestVersion: string): boolean {
    // 如果主版本号变化，则是强制更新
    const v1 = currentVersion.split('.').map(Number);
    const v2 = latestVersion.split('.').map(Number);

    return v2[0] > v1[0];
  }

  /**
   * 获取下载URL
   */
  private getDownloadUrl(assets: any[]): string {
    // 查找适合当前平台的安装包
    const platform = this.getPlatform();
    const assetName = this.getAssetName(platform);

    const asset = assets.find((a: any) => a.name.includes(assetName));
    return asset?.browser_download_url || assets[0]?.browser_download_url || '';
  }

  /**
   * 获取资源大小
   */
  private getAssetSize(assets: any[]): number {
    const platform = this.getPlatform();
    const assetName = this.getAssetName(platform);

    const asset = assets.find((a: any) => a.name.includes(assetName));
    return asset?.size || 0;
  }

  /**
   * 获取当前平台
   */
  private getPlatform(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Windows')) return 'windows';
    if (userAgent.includes('Mac')) return 'mac';
    if (userAgent.includes('Linux')) return 'linux';

    return 'unknown';
  }

  /**
   * 获取资源名称
   */
  private getAssetName(platform: string): string {
    switch (platform) {
      case 'windows':
        return '.exe';
      case 'mac':
        return '.dmg';
      case 'linux':
        return '.AppImage';
      default:
        return '';
    }
  }
}

/**
 * 导出单例
 */
export const updateService = UpdateService.getInstance();
