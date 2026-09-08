export type ScriptCategory = 'all' | 'recent' | 'favorites' | 'project';

export interface TeleprompterSettings {
  speed: number; // 0.1 to 5.0 (default 1.0)
  fontSize: number; // 16 to 120 (default 44)
  fontFamily: 'sans' | 'serif' | 'mono' | 'system';
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number; // 1.2 to 2.4 (default 1.5)
  letterSpacing: number; // -1 to 5 (default 0)
  textWidth: number; // 40 to 100 percent (default 85)
  textColor: string; // hex code
  backgroundColor: string; // hex or 'transparent'
  backgroundOpacity: number; // 0 to 100 percent
  mirrorHorizontal: boolean; // Teleprompter glass reflection
  mirrorVertical: boolean; // Inverted rig
  guideLine: boolean; // Central/focal horizontal line
  guideLinePosition: number; // 20 to 80 percent from top (default 40)
  focusMode: boolean; // Dims text outside reading line
  highlightCurrentLine: boolean;
  hideMarkers: boolean; // Hide [INTRO], [PAUSA], etc. during reading
  countdownDuration: number; // 0, 3, 5, 10 seconds
  initialDelay: number; // seconds
  wordsPerMinute: number; // 80 to 200 (default 120)
  wakeLockEnabled: boolean;
  vibrateOnAction: boolean;
  voiceControlEnabled: boolean;
  shortcuts: Record<string, string>;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  lastPosition: number; // in pixels or percent
  isFavorite: boolean;
  project?: string;
  wordCount: number;
  estimatedSeconds: number;
  customSettings?: Partial<TeleprompterSettings>;
}

export interface CameraSettings {
  facingMode: 'user' | 'environment';
  audioEnabled: boolean;
  resolution: 'auto' | '480p' | '720p' | '1080p' | '4k';
  aspectRatio: 'free' | '16:9' | '9:16' | '1:1' | '4:3';
  compositionGuide: 'none' | 'rule-of-thirds' | 'crosshair' | 'safe-margins';
  overlayOpacity: number; // 10 to 100
  overlayWidth: number; // 40 to 100
  overlayPosition: 'top' | 'center' | 'bottom';
  teleprompterSpeed: number;
  fontSize: number;
  mirrorText: boolean;
  showPrompter: boolean;
  countdownDuration: number;
}

export interface FloatingWindowState {
  isOpen: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  opacity: number;
}

export type FloatingWindowSizePreset = 'small' | 'medium' | 'large' | 'custom';

export interface FloatingModeState {
  active: boolean;
  scriptId: string;
  scriptTitle: string;
  text?: string;
  currentPosition: number;
  progressPercent?: number;
  scrollSpeed: number;
  fontSize: number;
  fontFamily?: string;
  textAlign?: string;
  opacity: number; // 20, 40, 60, 80, 100
  textOpacity?: number;
  windowPosition: { x: number; y: number };
  windowSize: FloatingWindowSizePreset;
  customWidth?: number;
  customHeight?: number;
  isPlaying: boolean;
  theme: string;
  mirrored: boolean;
  readingSettings?: TeleprompterSettings;
  timestamp: number;
}

export interface IPhoneEnvironmentCapabilities {
  isIPhone: boolean;
  isIOS: boolean;
  isSafari: boolean;
  isStandalonePWA: boolean;
  isNativeCapacitor: boolean;
  supportsPictureInPicture: boolean;
  supportsBackgroundExecution: boolean;
  supportsNativeOverlay: boolean;
  supportsCamera: boolean;
  supportsWakeLock: boolean;
}

export type AppRoute = 'dashboard' | 'editor' | 'teleprompter' | 'camera' | 'floating' | 'settings';

export interface RecordedVideo {
  id: string;
  scriptId: string;
  scriptTitle: string;
  blob: Blob;
  url: string;
  durationSeconds: number;
  createdAt: number;
  sizeBytes: number;
  resolution?: string;
  aspectRatio?: string;
  takeNumber?: number;
  mimeType?: string;
}
