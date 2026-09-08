export type CameraResolution = 'auto' | '480p' | '720p' | '1080p' | '4k';
export type CameraAspectRatio = 'free' | '16:9' | '9:16' | '1:1' | '4:3';
export type CompositionGuide = 'none' | 'rule-of-thirds' | 'crosshair' | 'safe-margins';

export interface CameraStreamOptions {
  facingMode: 'user' | 'environment';
  audio: boolean;
  resolution: CameraResolution;
  deviceId?: string;
  audioDeviceId?: string;
}

export interface AvailableMediaDevices {
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
}

export class CameraService {
  public static isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }

  public static isMediaRecorderSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.MediaRecorder === 'function';
  }

  public static isPauseSupported(): boolean {
    if (!this.isMediaRecorderSupported()) return false;
    return (
      typeof MediaRecorder.prototype.pause === 'function' &&
      typeof MediaRecorder.prototype.resume === 'function'
    );
  }

  public static async getAvailableDevices(): Promise<AvailableMediaDevices> {
    if (!this.isSupported() || !navigator.mediaDevices.enumerateDevices) {
      return { videoDevices: [], audioDevices: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        videoDevices: devices.filter((d) => d.kind === 'videoinput'),
        audioDevices: devices.filter((d) => d.kind === 'audioinput'),
      };
    } catch (err) {
      console.warn('enumerateDevices error:', err);
      return { videoDevices: [], audioDevices: [] };
    }
  }

  public static getSupportedMimeType(): string {
    if (!this.isMediaRecorderSupported()) return '';

    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
    ];

    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  public static async getVideoStream(options: CameraStreamOptions): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('Câmera não suportada neste navegador ou ambiente.');
    }

    let widthConstraint: any = undefined;
    let heightConstraint: any = undefined;

    if (options.resolution === '4k') {
      widthConstraint = { ideal: 3840, min: 1920 };
      heightConstraint = { ideal: 2160, min: 1080 };
    } else if (options.resolution === '1080p') {
      widthConstraint = { ideal: 1920, min: 1280 };
      heightConstraint = { ideal: 1080, min: 720 };
    } else if (options.resolution === '720p') {
      widthConstraint = { ideal: 1280, min: 640 };
      heightConstraint = { ideal: 720, min: 480 };
    } else if (options.resolution === '480p') {
      widthConstraint = { ideal: 854 };
      heightConstraint = { ideal: 480 };
    }

    const videoConstraints: MediaTrackConstraints = {
      facingMode: options.deviceId ? undefined : options.facingMode,
      deviceId: options.deviceId ? { exact: options.deviceId } : undefined,
      width: widthConstraint,
      height: heightConstraint,
    };

    const audioConstraints: boolean | MediaTrackConstraints = options.audio
      ? {
          deviceId: options.audioDeviceId ? { exact: options.audioDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      : false;

    const constraints: MediaStreamConstraints = {
      video: videoConstraints,
      audio: audioConstraints,
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err: any) {
      // Fallback: If requested specific resolution or device failed, try basic facingMode
      console.warn('First getUserMedia attempt failed, trying fallback:', err);
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: options.facingMode },
          audio: options.audio
            ? {
                echoCancellation: true,
                noiseSuppression: true,
              }
            : false,
        });
      } catch (fallbackErr: any) {
        // Fallback to video only if audio failed (permission or device not found)
        if (options.audio) {
          console.warn('Trying video only fallback:', fallbackErr);
          return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
        throw fallbackErr;
      }
    }
  }

  public static stopStream(stream: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
}

export class AudioMeterManager {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;

  public start(stream: MediaStream, onLevel: (level: number) => void): void {
    this.stop();
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      onLevel(0);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;

      this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const loop = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Map 0..128 to 0..100%
        const normalized = Math.min(100, Math.round((avg / 120) * 100));
        onLevel(normalized);

        this.animFrameId = requestAnimationFrame(loop);
      };

      this.animFrameId = requestAnimationFrame(loop);
    } catch (err) {
      console.warn('AudioMeterManager error:', err);
    }
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
  }
}

