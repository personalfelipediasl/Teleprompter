import { EnvironmentDetector } from './environmentDetector';
import { PiPPrompterService } from './pipPrompter';
import { StorageService } from './storage';
import { Script, TeleprompterSettings, FloatingModeState } from '../types';

export interface NativeBridgeResponse {
  success: boolean;
  mode: 'native-plugin' | 'pip' | 'in-app' | 'fallback';
  message?: string;
  error?: string;
}

export interface NativeBridgeCallbacks {
  onExit?: (finalPosition?: number) => void;
  onPlayPause?: (playing: boolean) => void;
  onPositionChange?: (position: number) => void;
  onSpeedChange?: (speed: number) => void;
  onError?: (error: string) => void;
}

export type PiPEventName =
  | 'pipWillStart'
  | 'pipDidStart'
  | 'pipWillStop'
  | 'pipDidStop'
  | 'pipFailed'
  | 'pipPaused'
  | 'pipResumed'
  | 'pipPositionUpdate';

export class NativeIOSBridge {
  private static listeners: Map<PiPEventName, Set<(data: any) => void>> = new Map();

  /**
   * Check if Native Capacitor runtime is available on iOS
   */
  public static isNativeAvailable(): boolean {
    const caps = EnvironmentDetector.getCapabilities();
    return caps.isNativeCapacitor;
  }

  /**
   * Real check for Picture-in-Picture availability on device and environment
   */
  public static async isPictureInPicturePossible(): Promise<{
    possible: boolean;
    reason?: string;
    mode: 'native' | 'webkit-pip' | 'unsupported';
  }> {
    const caps = EnvironmentDetector.getCapabilities();

    // 1. Native Capacitor iOS layer with AVKit / AVPictureInPictureController
    if (caps.isNativeCapacitor) {
      const plugin =
        (window as any).Capacitor?.Plugins?.TeleprompterPiPPlugin ||
        (window as any).Capacitor?.Plugins?.FloatingPrompterPlugin;
      if (plugin) {
        try {
          const res = await plugin.isSupported();
          if (res && res.supported !== false) {
            return { possible: true, mode: 'native' };
          }
        } catch (e) {
          // plugin probe failed, fallback to checking web capabilities
        }
      }
    }

    // 2. WebKit / Safari iOS Picture-in-Picture API
    if (caps.supportsPictureInPicture) {
      return { possible: true, mode: 'webkit-pip' };
    }

    // 3. Fallback when not supported (e.g. older browser or unsupported webview)
    let reason = 'Picture-in-Picture não está disponível neste dispositivo ou neste ambiente.';
    if (caps.isSafari && !caps.isNativeCapacitor) {
      reason =
        'Para utilizar o teleprompter flutuante sobre outros aplicativos, instale a versão do aplicativo para iPhone ou use a versão nativa.';
    }

    return { possible: false, reason, mode: 'unsupported' };
  }

  /**
   * Starts the Picture-in-Picture teleprompter session.
   * Crucially persists the complete teleprompter state before initiating the session.
   */
  public static async start(
    script: Script,
    settings: TeleprompterSettings,
    initialPosition?: number,
    callbacks?: NativeBridgeCallbacks
  ): Promise<NativeBridgeResponse> {
    const targetPos = Math.round(initialPosition ?? script.lastPosition ?? 0);

    // 1. Persist complete state according to Section 6
    const stateSnapshot: FloatingModeState = {
      active: true,
      scriptId: script.id,
      scriptTitle: script.title,
      text: script.content,
      currentPosition: targetPos,
      progressPercent: script.estimatedSeconds
        ? Math.min(100, (targetPos / Math.max(1, script.estimatedSeconds * 50)) * 100)
        : 0,
      scrollSpeed: settings.speed,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      textAlign: settings.textAlign,
      opacity: settings.backgroundOpacity,
      textOpacity: 100,
      windowPosition: { x: 20, y: 55 },
      windowSize: 'medium',
      isPlaying: true,
      theme: settings.backgroundColor,
      mirrored: settings.mirrorHorizontal,
      readingSettings: settings,
      timestamp: Date.now(),
    };

    await StorageService.saveFloatingState(stateSnapshot);

    // 2. Verify availability
    const check = await this.isPictureInPicturePossible();
    if (!check.possible) {
      return {
        success: false,
        mode: 'fallback',
        message: check.reason,
      };
    }

    // 3. Native iOS Capacitor execution (AVKit + AVPictureInPictureController)
    const nativePlugin =
      (window as any).Capacitor?.Plugins?.TeleprompterPiPPlugin ||
      (window as any).Capacitor?.Plugins?.FloatingPrompterPlugin;

    if (check.mode === 'native' && nativePlugin) {
      try {
        // Register native event hooks if supported
        if (typeof nativePlugin.addListener === 'function') {
          nativePlugin.addListener('pipWillStart', () => this.emit('pipWillStart', {}));
          nativePlugin.addListener('pipDidStart', () => this.emit('pipDidStart', {}));
          nativePlugin.addListener('pipWillStop', () => this.emit('pipWillStop', {}));
          nativePlugin.addListener('pipDidStop', (data: any) => {
            const finalPos = data?.position ?? targetPos;
            this.emit('pipDidStop', { position: finalPos });
            callbacks?.onExit?.(finalPos);
          });
          nativePlugin.addListener('pipFailed', (data: any) => {
            this.emit('pipFailed', data);
            callbacks?.onError?.(data?.error || 'Erro no PiP');
          });
          nativePlugin.addListener('pipPaused', () => {
            this.emit('pipPaused', {});
            callbacks?.onPlayPause?.(false);
          });
          nativePlugin.addListener('pipResumed', () => {
            this.emit('pipResumed', {});
            callbacks?.onPlayPause?.(true);
          });
          nativePlugin.addListener('pipPositionUpdate', (data: any) => {
            this.emit('pipPositionUpdate', data);
            if (typeof data?.position === 'number') {
              callbacks?.onPositionChange?.(data.position);
            }
          });
        }

        await nativePlugin.start({
          id: script.id,
          title: script.title,
          content: script.content,
          initialPosition: targetPos,
          speed: settings.speed,
          fontSize: settings.fontSize,
          textColor: settings.textColor,
          bgColor: settings.backgroundColor,
          opacity: settings.backgroundOpacity / 100,
          isPlaying: true,
        });

        return { success: true, mode: 'native-plugin' };
      } catch (err: any) {
        console.warn('Native iOS plugin launch error, falling back to WebKit PiP:', err);
      }
    }

    // 4. WebKit / Safari iOS PiP execution (AVKit-backed HTMLVideoElement stream)
    if (check.mode === 'webkit-pip' || EnvironmentDetector.getCapabilities().supportsPictureInPicture) {
      try {
        const lines = script.content.split('\n').filter((l) => l.trim().length > 0);
        await PiPPrompterService.startPiP(lines, {
          title: script.title,
          speed: settings.speed,
          fontSize: settings.fontSize,
          textColor: settings.textColor,
          bgColor: settings.backgroundColor,
          initialScroll: targetPos,
          opacity: settings.backgroundOpacity / 100,
          onExit: () => {
            const finalPos = PiPPrompterService.getCurrentScroll();
            this.emit('pipDidStop', { position: finalPos });
            callbacks?.onExit?.(finalPos);
          },
          onTogglePlay: (playing) => {
            if (playing) {
              this.emit('pipResumed', {});
            } else {
              this.emit('pipPaused', {});
            }
            callbacks?.onPlayPause?.(playing);
          },
          onPositionChange: (pos) => {
            this.emit('pipPositionUpdate', { position: pos });
            callbacks?.onPositionChange?.(pos);
          },
        });

        this.emit('pipDidStart', {});
        return { success: true, mode: 'pip' };
      } catch (err: any) {
        console.warn('WebKit PiP execution error:', err);
        return {
          success: false,
          mode: 'pip',
          message: err.message || 'Falha ao iniciar Picture-in-Picture no Safari.',
        };
      }
    }

    return {
      success: false,
      mode: 'fallback',
      message: 'Picture-in-Picture não está disponível neste dispositivo ou neste ambiente.',
    };
  }

  /**
   * Stops the active Picture-in-Picture session
   */
  public static async stop(): Promise<void> {
    const plugin =
      (window as any).Capacitor?.Plugins?.TeleprompterPiPPlugin ||
      (window as any).Capacitor?.Plugins?.FloatingPrompterPlugin;
    if (this.isNativeAvailable() && plugin?.stop) {
      try {
        await plugin.stop();
      } catch (err) {}
    }
    PiPPrompterService.stop();
    this.emit('pipDidStop', {});
  }

  /**
   * Pauses the reading / scrolling
   */
  public static async pause(): Promise<void> {
    const plugin =
      (window as any).Capacitor?.Plugins?.TeleprompterPiPPlugin ||
      (window as any).Capacitor?.Plugins?.FloatingPrompterPlugin;
    if (this.isNativeAvailable() && plugin?.pause) {
      try {
        await plugin.pause();
      } catch (err) {}
    }
    PiPPrompterService.setPaused(true);
    this.emit('pipPaused', {});
  }

  /**
   * Resumes the reading / scrolling
   */
  public static async resume(): Promise<void> {
    const plugin =
      (window as any).Capacitor?.Plugins?.TeleprompterPiPPlugin ||
      (window as any).Capacitor?.Plugins?.FloatingPrompterPlugin;
    if (this.isNativeAvailable() && plugin?.resume) {
      try {
        await plugin.resume();
      } catch (err) {}
    }
    PiPPrompterService.setPaused(false);
    this.emit('pipResumed', {});
  }

  /**
   * Changes scrolling speed dynamically
   */
  public static async setSpeed(speed: number): Promise<void> {
    const plugin =
      (window as any).Capacitor?.Plugins?.TeleprompterPiPPlugin ||
      (window as any).Capacitor?.Plugins?.FloatingPrompterPlugin;
    if (this.isNativeAvailable() && plugin?.setSpeed) {
      try {
        await plugin.setSpeed({ speed });
      } catch (err) {}
    }
    PiPPrompterService.setSpeed(speed);
  }

  /**
   * Updates script text during session
   */
  public static async updateContent(content: string): Promise<void> {
    const plugin =
      (window as any).Capacitor?.Plugins?.TeleprompterPiPPlugin ||
      (window as any).Capacitor?.Plugins?.FloatingPrompterPlugin;
    if (this.isNativeAvailable() && plugin?.updateContent) {
      try {
        await plugin.updateContent({ content });
      } catch (err) {}
    }
  }

  /**
   * Synchronizes full state
   */
  public static async updateState(state: Partial<FloatingModeState>): Promise<void> {
    const current = await StorageService.getFloatingState();
    if (current) {
      const merged: FloatingModeState = { ...current, ...state, timestamp: Date.now() };
      await StorageService.saveFloatingState(merged);
    }
  }

  /**
   * Restores state from Storage
   */
  public static async getState(): Promise<FloatingModeState | null> {
    return StorageService.getFloatingState();
  }

  // MARK: - Event Subscription System
  public static addListener(event: PiPEventName, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private static emit(event: PiPEventName, data: any): void {
    const subs = this.listeners.get(event);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.warn(`Error in listener for ${event}:`, e);
        }
      });
    }
  }

  // Backward compatibility alias for existing calls
  public static async requestFloatingPrompter(
    script: Script,
    settings: TeleprompterSettings,
    initialPosition?: number,
    callbacks?: NativeBridgeCallbacks
  ): Promise<NativeBridgeResponse> {
    return this.start(script, settings, initialPosition, callbacks);
  }

  public static stopFloatingPrompter(): void {
    this.stop().catch(console.warn);
  }
}
