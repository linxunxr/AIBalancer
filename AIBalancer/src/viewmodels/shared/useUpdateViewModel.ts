/**
 * Update ViewModel
 * 更新检查和安装的视图逻辑
 */

import { BaseViewModel } from '../BaseViewModel';
import { computed } from 'vue';
import { updateService, UpdateCheckResult, DownloadProgress } from '../../models/services/UpdateService';

interface UpdateState {
  isChecking: boolean;
  checkResult: UpdateCheckResult | null;
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  downloadError: string | null;
  isInstalling: boolean;
  installError: string | null;
  showUpdateDialog: boolean;
}

export class UpdateViewModel extends BaseViewModel<UpdateState> {
  // Computed properties
  readonly hasUpdate = computed(() => this.state.checkResult?.hasUpdate ?? false);
  readonly currentVersion = computed(() => this.state.checkResult?.currentVersion ?? '');
  readonly latestVersion = computed(() => this.state.checkResult?.latestVersion ?? '');
  readonly updateInfo = computed(() => this.state.checkResult?.updateInfo ?? null);
  readonly downloadPercentage = computed(() => {
    return this.state.downloadProgress?.percentage ?? 0;
  });
  readonly canInstall = computed(() => {
    return this.hasUpdate.value && !this.state.isDownloading && !this.state.isInstalling;
  });

  constructor(private autoCheck: boolean = true) {
    super({
      isChecking: false,
      checkResult: null,
      isDownloading: false,
      downloadProgress: null,
      downloadError: null,
      isInstalling: false,
      installError: null,
      showUpdateDialog: false
    });
  }

  protected async onInitialize(): Promise<void> {
    if (this.autoCheck) {
      await this.checkForUpdates();
    }
  }

  /**
   * 检查更新
   */
  async checkForUpdates(): Promise<UpdateCheckResult | null> {
    try {
      this.state.isChecking = true;
      this.state.downloadError = null;

      const result = await updateService.checkForUpdates();
      this.state.checkResult = result;

      // 如果有更新，自动显示对话框
      if (result.hasUpdate) {
        this.state.showUpdateDialog = true;
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '检查更新失败';
      this.setError(message);
      return null;
    } finally {
      this.state.isChecking = false;
    }
  }

  /**
   * 下载更新
   */
  async downloadUpdate(): Promise<boolean> {
    if (!this.state.checkResult?.updateInfo) {
      this.setError('没有可用的更新信息');
      return false;
    }

    try {
      this.state.isDownloading = true;
      this.state.downloadError = null;
      this.state.downloadProgress = null;

      const updateFile = await updateService.downloadUpdate(
        this.state.checkResult.updateInfo.downloadUrl,
        (progress) => {
          this.state.downloadProgress = progress;
        }
      );

      // 下载完成后自动安装
      await this.installUpdate(updateFile);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '下载更新失败';
      this.state.downloadError = message;
      this.setError(message);
      return false;
    } finally {
      this.state.isDownloading = false;
    }
  }

  /**
   * 安装更新
   */
  async installUpdate(updateFile?: Blob): Promise<boolean> {
    try {
      this.state.isInstalling = true;
      this.state.installError = null;

      if (updateFile) {
        await updateService.installUpdate(updateFile);
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '安装更新失败';
      this.state.installError = message;
      this.setError(message);
      return false;
    } finally {
      this.state.isInstalling = false;
    }
  }

  /**
   * 重启应用
   */
  async restart(): Promise<void> {
    try {
      await updateService.restart();
    } catch (error) {
      this.setError('重启失败');
      throw error;
    }
  }

  /**
   * 取消下载
   */
  cancelDownload(): void {
    updateService.cancelDownload();
    this.state.isDownloading = false;
    this.state.downloadProgress = null;
  }

  /**
   * 关闭更新对话框
   */
  closeUpdateDialog(): void {
    this.state.showUpdateDialog = false;
  }

  /**
   * 显示更新对话框
   */
  showUpdateDialog(): void {
    if (this.hasUpdate.value) {
      this.state.showUpdateDialog = true;
    }
  }

  /**
   * 暂时跳过此更新
   */
  skipUpdate(): void {
    this.closeUpdateDialog();
    // TODO: 保存跳过的版本号
  }

  /**
   * 忽略此更新
   */
  ignoreUpdate(): void {
    this.closeUpdateDialog();
    // TODO: 保存忽略的版本号
  }

  /**
   * 获取更新描述
   */
  getUpdateDescription(): string {
    const info = this.state.checkResult?.updateInfo;
    if (!info) return '';

    let description = `新版本: ${info.version}\n`;
    description += `发布日期: ${info.releaseDate.toLocaleDateString()}\n`;

    if (info.mandatory) {
      description += '\n⚠️ 这是一个强制更新\n';
    }

    if (info.releaseNotes) {
      description += '\n更新内容:\n';
      description += info.releaseNotes;
    }

    return description;
  }

  /**
   * 获取下载大小描述
   */
  getDownloadSizeDescription(): string {
    const info = this.state.checkResult?.updateInfo;
    if (!info) return '';

    const sizeMB = (info.size / (1024 * 1024)).toFixed(2);
    return `${sizeMB} MB`;
  }

  /**
   * 格式化下载进度
   */
  formatDownloadProgress(): string {
    if (!this.state.downloadProgress) return '0%';

    const { downloaded, total, percentage } = this.state.downloadProgress;
    const downloadedMB = (downloaded / (1024 * 1024)).toFixed(1);
    const totalMB = (total / (1024 * 1024)).toFixed(1);

    return `${percentage.toFixed(1)}% (${downloadedMB} / ${totalMB} MB)`;
  }
}
