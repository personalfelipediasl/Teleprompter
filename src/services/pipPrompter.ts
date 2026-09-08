export interface PiPOptions {
  speed: number;
  fontSize: number;
  textColor: string;
  bgColor: string;
  initialScroll?: number;
  opacity?: number;
  onExit?: () => void;
  onTogglePlay?: (playing: boolean) => void;
  onPositionChange?: (position: number) => void;
}

export class PiPPrompterService {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;
  private static video: HTMLVideoElement | null = null;
  private static animFrameId: number | null = null;
  private static isRunning = false;
  private static isPaused = false;
  private static currentScrollY = 0;
  private static currentSpeed = 1.0;
  private static onPositionCallback: ((pos: number) => void) | null = null;
  private static onTogglePlayCallback: ((playing: boolean) => void) | null = null;

  public static isSupported(): boolean {
    if (typeof document === 'undefined') return false;
    return (
      'pictureInPictureEnabled' in document &&
      typeof HTMLVideoElement !== 'undefined' &&
      'requestPictureInPicture' in HTMLVideoElement.prototype
    );
  }

  public static isPiPActive(): boolean {
    if (typeof document === 'undefined') return false;
    return !!document.pictureInPictureElement && document.pictureInPictureElement === this.video;
  }

  public static getCurrentScroll(): number {
    return this.currentScrollY;
  }

  public static setSpeed(speed: number): void {
    this.currentSpeed = Math.max(0.1, Math.min(5.0, speed));
  }

  public static setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (this.onTogglePlayCallback) {
      this.onTogglePlayCallback(!paused);
    }
  }

  public static togglePlay(): boolean {
    this.isPaused = !this.isPaused;
    if (this.onTogglePlayCallback) {
      this.onTogglePlayCallback(!this.isPaused);
    }
    return !this.isPaused;
  }

  public static async startPiP(lines: string[], options: PiPOptions): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Picture-in-Picture não suportado neste dispositivo iOS.');
    }

    this.stop();

    // High definition virtual canvas for iPhone Retina display
    const width = 800;
    const height = 480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Não foi possível obter contexto 2D para o PiP');

    this.canvas = canvas;
    this.ctx = ctx;
    this.currentSpeed = options.speed || 1.0;
    this.currentScrollY = options.initialScroll || 0;
    this.isPaused = false;
    this.onPositionCallback = options.onPositionChange || null;
    this.onTogglePlayCallback = options.onTogglePlay || null;

    // Create stream at 30 FPS
    const stream = canvas.captureStream(30);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;

    // MediaSession integration for native iOS controls (Lock Screen, PiP Controls, AirPods)
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Teleprompter Flutuante iPhone',
          artist: 'Modo Leitura Persistente',
          album: 'Câmera Nativa iOS',
        });

        navigator.mediaSession.setActionHandler('play', () => {
          this.setPaused(false);
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          this.setPaused(true);
        });

        navigator.mediaSession.setActionHandler('seekbackward', () => {
          this.currentScrollY = Math.max(0, this.currentScrollY - 200);
        });

        navigator.mediaSession.setActionHandler('seekforward', () => {
          this.currentScrollY += 200;
        });
      } catch (err) {
        console.warn('MediaSession handler registration failed:', err);
      }
    }

    await video.play();
    this.video = video;

    let lastTime = performance.now();
    this.isRunning = true;

    const render = (time: number) => {
      if (!this.isRunning || !this.ctx) return;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Scroll if not paused
      if (!this.isPaused) {
        this.currentScrollY += this.currentSpeed * 50 * dt;
        if (this.onPositionCallback) {
          this.onPositionCallback(Math.round(this.currentScrollY));
        }
      }

      // Draw background (optimized contrast for camera viewing)
      ctx.fillStyle = options.bgColor || '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Top Eye-Contact alignment guide (where the iPhone camera lens is located)
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fillRect(0, 0, width, 52);

      // Camera indicator badge
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('● LENTE DA CÂMERA AQUI (Mantenha o olhar)', 24, 32);

      ctx.fillStyle = this.isPaused ? '#f59e0b' : '#10b981';
      ctx.textAlign = 'right';
      ctx.fillText(
        `${this.isPaused ? '⏸ PAUSADO' : '▶ ROLANDO'}  |  ${this.currentSpeed.toFixed(1)}x`,
        width - 24,
        32
      );

      // Focus reading line
      const focusLineY = height * 0.38;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fillRect(0, focusLineY - 30, width, 60);

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, focusLineY - 30);
      ctx.lineTo(width - 30, focusLineY - 30);
      ctx.stroke();

      // Draw Text lines
      const fontSize = Math.max(24, Math.round(options.fontSize * 0.75));
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
      ctx.fillStyle = options.textColor || '#f8fafc';
      ctx.textAlign = 'center';

      let currentY = focusLineY - this.currentScrollY;
      for (const line of lines) {
        if (currentY > 40 && currentY < height + 60) {
          ctx.fillText(line, width / 2, currentY);
        }
        currentY += fontSize * 1.55;
      }

      // If finished, wrap softly or stay at bottom
      if (currentY < focusLineY - 100) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 18px sans-serif';
        ctx.fillText('— Fim do roteiro —', width / 2, height - 30);
      }

      this.animFrameId = requestAnimationFrame(render);
    };

    this.animFrameId = requestAnimationFrame(render);

    try {
      await video.requestPictureInPicture();
      video.addEventListener(
        'leavepictureinpicture',
        () => {
          this.stop();
          if (options.onExit) options.onExit();
        },
        { once: true }
      );
      return true;
    } catch (err) {
      this.stop();
      throw err;
    }
  }

  public static stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.video) {
      if (document.pictureInPictureElement === this.video) {
        document.exitPictureInPicture().catch(() => {});
      }
      if (this.video.srcObject) {
        const tracks = (this.video.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
      this.video = null;
    }
    this.canvas = null;
    this.ctx = null;
  }
}
