import { EnvironmentDetector } from './environmentDetector';
import { PiPPrompterService } from './pipPrompter';
import { Script, TeleprompterSettings } from '../types';

export interface NativeBridgeResponse {
  success: boolean;
  mode: 'native-plugin' | 'pip' | 'in-app' | 'fallback';
  message?: string;
}

export class NativeIOSBridge {
  public static isNativeAvailable(): boolean {
    const caps = EnvironmentDetector.getCapabilities();
    return caps.isNativeCapacitor;
  }

  public static async requestFloatingPrompter(
    script: Script,
    settings: TeleprompterSettings,
    initialPosition?: number,
    callbacks?: {
      onExit?: () => void;
      onPlayPause?: (playing: boolean) => void;
      onPositionChange?: (position: number) => void;
      onSpeedChange?: (speed: number) => void;
    }
  ): Promise<NativeBridgeResponse> {
    const caps = EnvironmentDetector.getCapabilities();

    // 1. If running under native Capacitor iOS
    if (caps.isNativeCapacitor && (window as any).Capacitor?.Plugins?.FloatingPrompterPlugin) {
      try {
        const plugin = (window as any).Capacitor.Plugins.FloatingPrompterPlugin;
        await plugin.startFloating({
          scriptTitle: script.title,
          content: script.content,
          speed: settings.speed,
          fontSize: settings.fontSize,
          opacity: settings.backgroundOpacity,
        });
        return { success: true, mode: 'native-plugin' };
      } catch (err: any) {
        console.warn('Native iOS plugin error, falling back to WebKit PiP:', err);
      }
    }

    // 2. Picture-in-Picture on iPhone WebKit / Safari / PWA
    if (caps.supportsPictureInPicture) {
      try {
        const lines = script.content.split('\n').filter((l) => l.trim().length > 0);
        await PiPPrompterService.startPiP(lines, {
          title: script.title,
          speed: settings.speed,
          fontSize: settings.fontSize,
          textColor: settings.textColor,
          bgColor: settings.backgroundColor,
          initialScroll: initialPosition || script.lastPosition || 0,
          onExit: () => {
            if (callbacks?.onExit) callbacks.onExit();
          },
          onTogglePlay: (playing) => {
            if (callbacks?.onPlayPause) callbacks.onPlayPause(playing);
          },
          onPositionChange: (pos) => {
            if (callbacks?.onPositionChange) callbacks.onPositionChange(pos);
          },
        });
        return { success: true, mode: 'pip' };
      } catch (err: any) {
        console.warn('WebKit PiP launch failed:', err);
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
      message:
        'Picture-in-Picture não suportado neste navegador. Use o modo Gravar no App para ler sobre a Câmera.',
    };
  }

  public static stopFloatingPrompter(): void {
    if (this.isNativeAvailable() && (window as any).Capacitor?.Plugins?.FloatingPrompterPlugin) {
      try {
        (window as any).Capacitor.Plugins.FloatingPrompterPlugin.stopFloating();
      } catch (err) {}
    }
    PiPPrompterService.stop();
  }
}
