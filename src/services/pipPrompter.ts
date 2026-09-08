export interface PiPOptions {
  title?: string;
  speed: number;
  fontSize: number;
  textColor?: string;
  bgColor?: string;
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
  private static backgroundIntervalId: any = null;
  private static audioCtx: AudioContext | null = null;
  private static isRunning = false;
  private static isPaused = false;
  private static currentScrollY = 0;
  private static currentSpeed = 1.0;
  private static onPositionCallback: ((pos: number) => void) | null = null;
  private static onTogglePlayCallback: ((playing: boolean) => void) | null = null;

  public static isSupported(): boolean {
    if (typeof document === 'undefined') return false;
    const hasStandardPiP =
      'pictureInPictureEnabled' in document &&
      typeof HTMLVideoElement !== 'undefined' &&
      'requestPictureInPicture' in HTMLVideoElement.prototype;

    const hasWebKitPiP =
      typeof HTMLVideoElement !== 'undefined' &&
      ('webkitSetPresentationMode' in HTMLVideoElement.prototype ||
        'webkitSupportsPresentationMode' in HTMLVideoElement.prototype);

    return !!(hasStandardPiP || hasWebKitPiP);
  }

  public static isPiPActive(): boolean {
    if (typeof document === 'undefined') return false;
    const isStandard =
      !!document.pictureInPictureElement && document.pictureInPictureElement === this.video;
    const isWebKit =
      this.video && (this.video as any).webkitPresentationMode === 'picture-in-picture';
    return !!(isStandard || isWebKit);
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

    // Stop any existing session
    this.stop();

    // High definition virtual canvas optimized for iPhone PiP window
    const width = 720;
    const height = 540;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Não foi possível obter contexto 2D para o PiP');

    this.canvas = canvas;
    this.ctx = ctx;
    this.currentSpeed = options.speed || 1.0;
    this.currentScrollY = options.initialScroll || 0;
    this.isPaused = false;
    this.onPositionCallback = options.onPositionChange || null;
    this.onTogglePlayCallback = options.onTogglePlay || null;

    // Wrap script content into readable lines fitting within the PiP screen width
    const formattedLines: string[] = [];
    const maxTextWidth = width - 80;
    const fontSize = Math.max(28, Math.min(46, Math.round(options.fontSize * 0.95)));
    const lineHeight = fontSize * 1.5;

    // Split paragraphs and wrap words
    ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;

    const rawContentLines = lines.length > 0 ? lines : ['Roteiro pronto para leitura.'];
    for (const paragraph of rawContentLines) {
      const clean = paragraph.replace(/\[.*?\]/g, '').trim();
      if (!clean) {
        formattedLines.push('');
        continue;
      }
      const words = clean.split(/\s+/);
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextWidth && currentLine) {
          formattedLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        formattedLines.push(currentLine);
      }
    }

    // Create stream at 30 FPS
    const stream = canvas.captureStream ? canvas.captureStream(30) : (canvas as any).mozCaptureStream?.(30);
    if (!stream) {
      throw new Error('Falha ao capturar stream de vídeo do canvas.');
    }

    // Add inaudible Web Audio track to ensure iOS keeps video rendering in background (when camera is open)
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        this.audioCtx = audioCtx;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0.0001; // Silent / inaudible
        osc.connect(gain);
        const dest = audioCtx.createMediaStreamDestination();
        gain.connect(dest);
        osc.start();
        const audioTracks = dest.stream.getAudioTracks();
        if (audioTracks && audioTracks[0]) {
          stream.addTrack(audioTracks[0]);
        }
      }
    } catch (audioErr) {
      console.warn('Silent audio background keepalive initialization skipped:', audioErr);
    }

    // Create and configure video element
    const video = document.createElement('video');
    video.id = 'pip-teleprompter-video';
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('autoplay', '');
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0.001';
    video.style.pointerEvents = 'none';
    video.srcObject = stream;
    document.body.appendChild(video);

    // MediaSession integration for iOS Lock Screen & PiP controls (Play / Pause double-tap)
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: options.title || 'Roteiro Teleprompter',
          artist: 'Teleprompter Flutuante iPhone',
          album: 'Câmera Nativa iOS',
        });

        navigator.mediaSession.setActionHandler('play', () => {
          this.setPaused(false);
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          this.setPaused(true);
        });

        navigator.mediaSession.setActionHandler('seekbackward', () => {
          this.currentScrollY = Math.max(0, this.currentScrollY - 250);
        });

        navigator.mediaSession.setActionHandler('seekforward', () => {
          this.currentScrollY += 250;
        });
      } catch (err) {
        console.warn('MediaSession handler registration warning:', err);
      }
    }

    await video.play();
    this.video = video;

    let lastTime = performance.now();
    this.isRunning = true;

    const scriptTitle = (options.title || 'ROTEIRO PARA TELEPROMPTER').trim().toUpperCase();

    // Render frame function
    const renderFrame = (dt: number) => {
      if (!this.isRunning || !this.ctx) return;

      // Scroll smoothly if not paused
      if (!this.isPaused) {
        this.currentScrollY += this.currentSpeed * 45 * dt;
        if (this.onPositionCallback) {
          this.onPositionCallback(Math.round(this.currentScrollY));
        }
      }

      // 1. Dark Background (identical to iOS PiP container)
      ctx.fillStyle = '#121318';
      ctx.fillRect(0, 0, width, height);

      // 2. Top Rounded Blue Pill: "Double click to continue scrolling" (identical to user screenshot)
      const pillWidth = 440;
      const pillHeight = 44;
      const pillX = (width - pillWidth) / 2;
      const pillY = 16;
      const pillRadius = 22;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pillX + pillRadius, pillY);
      ctx.lineTo(pillX + pillWidth - pillRadius, pillY);
      ctx.quadraticCurveTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + pillRadius);
      ctx.lineTo(pillX + pillWidth, pillY + pillHeight - pillRadius);
      ctx.quadraticCurveTo(
        pillX + pillWidth,
        pillY + pillHeight,
        pillX + pillWidth - pillRadius,
        pillY + pillHeight
      );
      ctx.lineTo(pillX + pillRadius, pillY + pillHeight);
      ctx.quadraticCurveTo(pillX, pillY + pillHeight, pillX, pillY + pillHeight - pillRadius);
      ctx.lineTo(pillX, pillY + pillRadius);
      ctx.quadraticCurveTo(pillX, pillY, pillX + pillRadius, pillY);
      ctx.closePath();
      ctx.fillStyle = '#0088ff';
      ctx.fill();

      // Text inside top pill
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const pillText = this.isPaused
        ? 'Double click to continue scrolling'
        : 'Double click to continue scrolling';
      ctx.fillText(pillText, width / 2, pillY + pillHeight / 2);
      ctx.restore();

      // 3. Script Title Header: 🎥 ROTEIRO PARA TELEPROMPTER
      const titleStartY = 110;
      const displayTitle = scriptTitle.startsWith('🎥') ? scriptTitle : `🎥 ${scriptTitle}`;
      
      ctx.save();
      ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Split title into lines if long
      const titleWords = displayTitle.split(/\s+/);
      let titleLine = '';
      let titleY = titleStartY - this.currentScrollY;

      for (const word of titleWords) {
        const test = titleLine ? `${titleLine} ${word}` : word;
        if (ctx.measureText(test).width > width - 80 && titleLine) {
          if (titleY > -40 && titleY < height + 40) {
            ctx.fillText(titleLine, 40, titleY);
          }
          titleY += 46;
          titleLine = word;
        } else {
          titleLine = test;
        }
      }
      if (titleLine && titleY > -40 && titleY < height + 40) {
        ctx.fillText(titleLine, 40, titleY);
      }
      titleY += 54;
      ctx.restore();

      // 4. Script Content Lines (high-contrast white text, clear line-height)
      ctx.save();
      ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
      ctx.fillStyle = options.textColor || '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      let textY = titleY;
      for (const line of formattedLines) {
        if (textY > 60 && textY < height + 60) {
          if (line.trim()) {
            ctx.fillText(line, 40, textY);
          }
        }
        textY += lineHeight;
      }

      // Bottom end-of-script marker
      if (textY < height / 2) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 20px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('— Fim do roteiro —', width / 2, Math.max(textY + 40, height - 30));
      }
      ctx.restore();
    };

    // Main animation loop
    const onFrame = (time: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      renderFrame(dt);
      this.animFrameId = requestAnimationFrame(onFrame);
    };

    this.animFrameId = requestAnimationFrame(onFrame);

    // Continuous background timer fallback:
    // Ensures rendering keeps ticking even when iPhone puts browser into background tab!
    this.backgroundIntervalId = setInterval(() => {
      if (!this.isRunning) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      if (dt >= 0.03) {
        lastTime = now;
        renderFrame(dt);
      }
    }, 33);

    // Launch native Picture-in-Picture
    try {
      if ('requestPictureInPicture' in video) {
        await video.requestPictureInPicture();
      } else if (typeof (video as any).webkitSetPresentationMode === 'function') {
        (video as any).webkitSetPresentationMode('picture-in-picture');
      } else {
        throw new Error('Nenhuma API de Picture-in-Picture disponível no Safari.');
      }

      const handleExit = () => {
        this.stop();
        if (options.onExit) options.onExit();
      };

      video.addEventListener('leavepictureinpicture', handleExit, { once: true });
      (video as any).addEventListener?.('webkitpresentationmodechanged', () => {
        if ((video as any).webkitPresentationMode === 'inline') {
          handleExit();
        }
      });

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
    if (this.backgroundIntervalId) {
      clearInterval(this.backgroundIntervalId);
      this.backgroundIntervalId = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
    if (this.video) {
      try {
        if (document.pictureInPictureElement === this.video) {
          document.exitPictureInPicture().catch(() => {});
        } else if (
          typeof (this.video as any).webkitSetPresentationMode === 'function' &&
          (this.video as any).webkitPresentationMode === 'picture-in-picture'
        ) {
          (this.video as any).webkitSetPresentationMode('inline');
        }
      } catch (e) {}

      if (this.video.srcObject) {
        try {
          const tracks = (this.video.srcObject as MediaStream).getTracks();
          tracks.forEach((t) => t.stop());
        } catch (e) {}
      }
      if (this.video.parentNode) {
        this.video.parentNode.removeChild(this.video);
      }
      this.video = null;
    }
    this.canvas = null;
    this.ctx = null;
  }
}
