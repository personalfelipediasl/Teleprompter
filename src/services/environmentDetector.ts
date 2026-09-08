import { IPhoneEnvironmentCapabilities } from '../types';

export class EnvironmentDetector {
  private static cached: IPhoneEnvironmentCapabilities | null = null;

  public static getCapabilities(): IPhoneEnvironmentCapabilities {
    if (typeof window === 'undefined') {
      return {
        isIPhone: false,
        isIOS: false,
        isSafari: false,
        isStandalonePWA: false,
        isNativeCapacitor: false,
        supportsPictureInPicture: false,
        supportsBackgroundExecution: false,
        supportsNativeOverlay: false,
        supportsCamera: false,
        supportsWakeLock: false,
      };
    }

    if (this.cached) return this.cached;

    const ua = window.navigator.userAgent;
    const isIPhone = /iPhone|iPod/.test(ua);
    const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIOS = isIPhone || isIPad;

    // Safari detection on iOS
    const isWebKit = /WebKit/i.test(ua);
    const isChromeIOS = /CriOS/i.test(ua);
    const isFirefoxIOS = /FxiOS/i.test(ua);
    const isSafari = isIOS && isWebKit && !isChromeIOS && !isFirefoxIOS;

    // Standalone PWA detection on iPhone
    const isStandalonePWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Capacitor Native iOS detection
    const isNativeCapacitor =
      typeof (window as any).Capacitor !== 'undefined' &&
      typeof (window as any).Capacitor.isNativePlatform === 'function' &&
      (window as any).Capacitor.isNativePlatform();

    // PiP support
    const supportsPictureInPicture =
      'pictureInPictureEnabled' in document &&
      typeof HTMLVideoElement !== 'undefined' &&
      'requestPictureInPicture' in HTMLVideoElement.prototype;

    // Native overlay in iOS is exclusively through PiP / AVPictureInPictureController
    const supportsNativeOverlay = isNativeCapacitor || supportsPictureInPicture;

    // Background execution
    const supportsBackgroundExecution = isNativeCapacitor || isStandalonePWA;

    const supportsCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const supportsWakeLock = 'wakeLock' in navigator;

    this.cached = {
      isIPhone,
      isIOS,
      isSafari,
      isStandalonePWA,
      isNativeCapacitor,
      supportsPictureInPicture,
      supportsBackgroundExecution,
      supportsNativeOverlay,
      supportsCamera,
      supportsWakeLock,
    };

    return this.cached;
  }

  public static getRecommendedFloatingMode(): 'pip' | 'native-plugin' | 'in-app' | 'camera-studio' {
    const caps = this.getCapabilities();
    if (caps.isNativeCapacitor) {
      return 'native-plugin';
    }
    if (caps.supportsPictureInPicture) {
      return 'pip';
    }
    return 'camera-studio';
  }

  public static getDeviceStatusSummary(): string {
    const caps = this.getCapabilities();
    if (caps.isNativeCapacitor) {
      return 'iPhone Nativo (Capacitor iOS) — Suporte a PiP e Background habilitados';
    }
    if (caps.isStandalonePWA) {
      return 'iPhone PWA Instalada — Otimizado para tela cheia e Picture-in-Picture';
    }
    if (caps.isIPhone) {
      return 'iPhone (Safari iOS) — Picture-in-Picture e Estúdio de Câmera prontos';
    }
    return 'Ambiente iOS / WebKit compatível';
  }
}
