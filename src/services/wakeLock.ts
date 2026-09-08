export class WakeLockManager {
  private static sentinel: any = null;
  private static isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  private static shouldBeActive = false;

  public static isLockSupported(): boolean {
    return this.isSupported;
  }

  public static async request(): Promise<boolean> {
    this.shouldBeActive = true;
    if (!this.isSupported) return false;

    try {
      if (this.sentinel !== null) {
        return true;
      }
      this.sentinel = await (navigator as any).wakeLock.request('screen');
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
      });

      // Handle visibility changes (e.g. app goes to background and comes back)
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      return false;
    }
  }

  public static async release(): Promise<void> {
    this.shouldBeActive = false;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (this.sentinel !== null) {
      try {
        await this.sentinel.release();
      } catch (err) {
        console.warn('Wake Lock release error:', err);
      }
      this.sentinel = null;
    }
  }

  private static handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && WakeLockManager.shouldBeActive) {
      try {
        WakeLockManager.sentinel = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('Failed to re-acquire wake lock on visibility change', err);
      }
    }
  };
}
