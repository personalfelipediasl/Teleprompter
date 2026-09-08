import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  Video,
  Mic,
  MicOff,
  RotateCw,
  Play,
  Pause,
  Square,
  Download,
  RotateCcw,
  Sliders,
  Settings2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Share2,
  Film,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Clock,
  FlipHorizontal,
  X,
} from 'lucide-react';
import { Script, TeleprompterSettings, RecordedVideo } from '../../types';
import {
  CameraService,
  AudioMeterManager,
  CameraResolution,
  CameraAspectRatio,
  CompositionGuide,
} from '../../services/camera';
import { parseScriptContent } from '../../utils/textMetrics';
import { CameraSettingsPanel } from './CameraSettingsPanel';
import { CameraTakeReviewModal } from './CameraTakeReviewModal';
import { CameraViewfinderGuides } from './CameraViewfinderGuides';
import { CameraAudioVuMeter } from './CameraAudioVuMeter';

interface CameraRecorderProps {
  script: Script;
  settings: TeleprompterSettings;
  onUpdateSettings: (settings: Partial<TeleprompterSettings>) => void;
  onExit: () => void;
}

export const CameraRecorder: React.FC<CameraRecorderProps> = ({
  script,
  settings,
  onUpdateSettings,
  onExit,
}) => {
  // Video & Stream refs
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioMeterRef = useRef<AudioMeterManager | null>(null);

  // Device & Stream States
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [resolution, setResolution] = useState<CameraResolution>('1080p');
  const [aspectRatio, setAspectRatio] = useState<CameraAspectRatio>('free');
  const [compositionGuide, setCompositionGuide] = useState<CompositionGuide>('rule-of-thirds');
  const [mirrorPreview, setMirrorPreview] = useState(true);
  const [streamResolutionInfo, setStreamResolutionInfo] = useState<string>('1080p');

  // Available Devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');

  // Recorder States
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [preRecordCountdown, setPreRecordCountdown] = useState<number>(3);
  const [isPauseSupported, setIsPauseSupported] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(true);

  // Takes & Output Review
  const [takes, setTakes] = useState<RecordedVideo[]>([]);
  const [selectedTakeIndex, setSelectedTakeIndex] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Settings Panel Drawer
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Prompter Overlay in Viewfinder States
  const [showPrompter, setShowPrompter] = useState(true);
  const [overlayWidth, setOverlayWidth] = useState(settings.textWidth || 80);
  const [overlayOpacity, setOverlayOpacity] = useState(60);
  const [overlayPosition, setOverlayPosition] = useState<'top' | 'center' | 'bottom'>('top');
  const [prompterFontSize, setPrompterFontSize] = useState(settings.fontSize || 36);
  const [prompterSpeed, setPrompterSpeed] = useState(settings.speed || 1.0);
  const [isPrompterPlaying, setIsPrompterPlaying] = useState(false);
  const [autoScrollOnRecord, setAutoScrollOnRecord] = useState(true);

  // Prompter Scroll Engine Refs
  const prompterContainerRef = useRef<HTMLDivElement>(null);
  const prompterScrollPosRef = useRef(0);
  const lastTickTimeRef = useRef<number | null>(null);
  const prompterAnimIdRef = useRef<number | null>(null);

  const parsedLines = parseScriptContent(script.content, settings.hideMarkers);

  // Check pause capability on mount
  useEffect(() => {
    setIsPauseSupported(CameraService.isPauseSupported());
  }, []);

  // Enumerate devices
  const refreshDevices = useCallback(async () => {
    const devs = await CameraService.getAvailableDevices();
    setVideoDevices(devs.videoDevices);
    setAudioDevices(devs.audioDevices);
  }, []);

  // Initialize Camera Stream
  const initCamera = useCallback(async () => {
    setIsLoadingStream(true);
    setCameraError(null);

    // Stop previous audio meter & stream
    if (audioMeterRef.current) {
      audioMeterRef.current.stop();
    }
    CameraService.stopStream(mediaStreamRef.current);

    try {
      const stream = await CameraService.getVideoStream({
        facingMode,
        audio: audioEnabled,
        resolution,
        deviceId: selectedVideoDeviceId || undefined,
        audioDeviceId: selectedAudioDeviceId || undefined,
      });

      mediaStreamRef.current = stream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      // Check stream video track dimensions
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setStreamResolutionInfo(`${settings.width}x${settings.height}`);
        }
      }

      // Initialize Audio Meter
      if (audioEnabled) {
        if (!audioMeterRef.current) {
          audioMeterRef.current = new AudioMeterManager();
        }
        audioMeterRef.current.start(stream, (level) => {
          setAudioLevel(level);
        });
      } else {
        setAudioLevel(0);
      }

      await refreshDevices();
    } catch (err: any) {
      console.error('Camera init error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permissão para acessar a câmera/microfone foi negada pelo navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Nenhum dispositivo de câmera ou microfone foi encontrado no aparelho.');
      } else {
        setCameraError(`Erro ao inicializar câmera: ${err.message || 'Falha de hardware/permissão'}`);
      }
    } finally {
      setIsLoadingStream(false);
    }
  }, [facingMode, audioEnabled, resolution, selectedVideoDeviceId, selectedAudioDeviceId, refreshDevices]);

  // Restart camera when config changes
  useEffect(() => {
    initCamera();
    return () => {
      if (audioMeterRef.current) {
        audioMeterRef.current.stop();
      }
      CameraService.stopStream(mediaStreamRef.current);
    };
  }, [initCamera]);

  // Prompter Request Animation Frame Scroller
  const prompterTick = useCallback(
    (now: number) => {
      if (!isPrompterPlaying) {
        lastTickTimeRef.current = now;
        prompterAnimIdRef.current = requestAnimationFrame(prompterTick);
        return;
      }

      if (lastTickTimeRef.current === null) {
        lastTickTimeRef.current = now;
      }

      const deltaMs = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;

      // Calculate step
      const pxPerSecond = 50 * prompterSpeed;
      const step = (pxPerSecond * deltaMs) / 1000;
      prompterScrollPosRef.current += step;

      if (prompterContainerRef.current) {
        prompterContainerRef.current.scrollTop = prompterScrollPosRef.current;

        // Check if finished
        const maxScroll = prompterContainerRef.current.scrollHeight;
        if (prompterScrollPosRef.current >= maxScroll) {
          setIsPrompterPlaying(false);
        }
      }

      prompterAnimIdRef.current = requestAnimationFrame(prompterTick);
    },
    [isPrompterPlaying, prompterSpeed]
  );

  useEffect(() => {
    prompterAnimIdRef.current = requestAnimationFrame(prompterTick);
    return () => {
      if (prompterAnimIdRef.current) cancelAnimationFrame(prompterAnimIdRef.current);
    };
  }, [prompterTick]);

  // Recording Timer
  useEffect(() => {
    let interval: any;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Start Recording sequence with optional countdown
  const handleStartRecordingClick = () => {
    if (preRecordCountdown > 0) {
      setCountdown(preRecordCountdown);
    } else {
      executeStartRecording();
    }
  };

  // Countdown timer watcher
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      executeStartRecording();
    }
  }, [countdown]);

  const executeStartRecording = () => {
    if (!mediaStreamRef.current || !CameraService.isMediaRecorderSupported()) {
      setCameraError('Gravador de mídia não suportado neste navegador.');
      return;
    }

    recordedChunksRef.current = [];
    const mimeType = CameraService.getSupportedMimeType();

    try {
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(mediaStreamRef.current, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);

        const takeNum = takes.length + 1;
        const newVideo: RecordedVideo = {
          id: `take_${Date.now()}`,
          scriptId: script.id,
          scriptTitle: script.title,
          blob,
          url,
          durationSeconds: recordTimer,
          createdAt: Date.now(),
          sizeBytes: blob.size,
          resolution: streamResolutionInfo,
          aspectRatio,
          takeNumber: takeNum,
          mimeType: mime,
        };

        setTakes((prev) => [...prev, newVideo]);
        setSelectedTakeIndex(takes.length);
        setShowReviewModal(true);
        setIsRecording(false);
        setIsPaused(false);
        setIsPrompterPlaying(false);
      };

      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecordTimer(0);

      // Auto-start prompter scroll if enabled
      if (autoScrollOnRecord && showPrompter) {
        setIsPrompterPlaying(true);
      }
    } catch (err: any) {
      console.error('MediaRecorder start error:', err);
      setCameraError(`Falha ao iniciar gravação: ${err.message}`);
    }
  };

  // Pause / Resume Recording
  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      try {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        if (autoScrollOnRecord && showPrompter) {
          setIsPrompterPlaying(true);
        }
      } catch (err) {
        console.warn('Resume failed:', err);
      }
    } else {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (autoScrollOnRecord) {
          setIsPrompterPlaying(false);
        }
      } catch (err) {
        console.warn('Pause failed:', err);
      }
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Flip Camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Toggle Audio Mute
  const toggleAudio = () => {
    setAudioEnabled((prev) => !prev);
  };

  // Reset Prompter Scroll to start
  const resetPrompterScroll = () => {
    prompterScrollPosRef.current = 0;
    if (prompterContainerRef.current) {
      prompterContainerRef.current.scrollTop = 0;
    }
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
        .toString()
        .padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Overlay vertical placement
  const getOverlayPositionStyle = () => {
    switch (overlayPosition) {
      case 'top':
        return 'top-16';
      case 'bottom':
        return 'bottom-28';
      default:
        return 'top-1/2 -translate-y-1/2';
    }
  };

  return (
    <div id="camera-studio-root" className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* Background Live Camera Preview */}
      <video
        ref={videoPreviewRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-transform ${
          facingMode === 'user' && mirrorPreview ? 'scale-x-[-1]' : ''
        }`}
      />

      {/* Composition & Aspect Ratio Framing Guides */}
      <CameraViewfinderGuides aspectRatio={aspectRatio} compositionGuide={compositionGuide} />

      {/* Big Animated Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none">
          <div className="text-center animate-bounce">
            <span className="text-9xl sm:text-[14rem] font-black text-red-500 drop-shadow-[0_0_50px_rgba(239,68,68,0.9)]">
              {countdown === 0 ? 'REC' : countdown}
            </span>
          </div>
        </div>
      )}

      {/* Teleprompter Floating Overlay over Live Camera */}
      {showPrompter && (
        <div
          id="camera-prompter-overlay-wrapper"
          className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all ${getOverlayPositionStyle()}`}
          style={{
            width: `${overlayWidth}%`,
            height: '48vh',
            maxWidth: '900px',
          }}
        >
          <div
            className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col backdrop-blur-sm transition-all"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})`,
            }}
          >
            {/* Prompter Top Mini-Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide truncate max-w-[180px]">
                  {script.title}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  {prompterSpeed.toFixed(1)}x
                </span>
              </div>

              {/* Quick Prompter Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPrompterPlaying(!isPrompterPlaying)}
                  className={`p-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition ${
                    isPrompterPlaying
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                  }`}
                  title={isPrompterPlaying ? 'Pausar Rolagem' : 'Iniciar Rolagem'}
                >
                  {isPrompterPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPrompterPlaying ? 'Pausar' : 'Rolar'}</span>
                </button>

                <button
                  onClick={resetPrompterScroll}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
                  title="Voltar ao início do texto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setShowPrompter(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
                  title="Ocultar Prompter"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Reading Line Indicator */}
            <div className="relative w-full">
              <div className="absolute top-10 left-0 right-0 h-[2px] bg-cyan-400/80 shadow-[0_0_10px_rgba(56,189,248,0.8)] pointer-events-none z-10" />
            </div>

            {/* Prompter Scrolling Text Viewport */}
            <div
              ref={prompterContainerRef}
              className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 select-none scroll-smooth"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div
                className="font-sans font-medium text-center text-white transition-all"
                style={{
                  fontSize: `${prompterFontSize}px`,
                  lineHeight: 1.5,
                  paddingTop: '20px',
                  paddingBottom: '30vh',
                }}
              >
                {parsedLines.map((lineObj) => {
                  if (!lineObj.shouldRender) return null;
                  if (lineObj.isMarker) {
                    return (
                      <div
                        key={lineObj.id}
                        className="my-2 inline-block px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs uppercase"
                      >
                        [{lineObj.markerType}]
                      </div>
                    );
                  }
                  return (
                    <p key={lineObj.id} className="my-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {lineObj.raw || '\u00A0'}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP HUD BAR: Recording Status, Resolution Badge, Audio VU Meter, Tools */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        {/* Left: REC Indicator and Timer */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-lg">
            {isRecording ? (
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isPaused ? 'bg-amber-400' : 'bg-red-500 animate-ping'
                  }`}
                />
                <span
                  className={`font-mono font-bold text-sm tracking-wider ${
                    isPaused ? 'text-amber-400' : 'text-red-400'
                  }`}
                >
                  {isPaused ? 'PAUSADO' : 'REC'} {formatTimer(recordTimer)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">Estúdio Pronto</span>
              </div>
            )}
          </div>

          {/* Resolution Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 text-xs font-mono text-cyan-300">
            <span>{resolution === 'auto' ? streamResolutionInfo : resolution.toUpperCase()}</span>
            <span className="opacity-40">•</span>
            <span className="text-[10px] text-slate-400">30 FPS</span>
          </div>

          {/* Audio VU Meter */}
          <CameraAudioVuMeter
            audioEnabled={audioEnabled}
            audioLevel={audioLevel}
            onToggleAudio={toggleAudio}
            isRecording={isRecording}
          />
        </div>

        {/* Right: Quick Action Buttons & Settings Drawer Toggle */}
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
          {/* Prompter Visibility Toggle */}
          <button
            onClick={() => setShowPrompter(!showPrompter)}
            className={`p-2.5 rounded-xl transition ${
              showPrompter ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
            title={showPrompter ? 'Ocultar Prompter' : 'Exibir Prompter'}
          >
            {showPrompter ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Flip Camera */}
          <button
            onClick={toggleCameraFacing}
            disabled={isRecording}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition"
            title="Trocar Câmera (Frontal / Traseira)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Mirror Selfie Toggle */}
          {facingMode === 'user' && (
            <button
              onClick={() => setMirrorPreview(!mirrorPreview)}
              className={`p-2.5 rounded-xl transition ${
                mirrorPreview ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400 hover:text-white'
              }`}
              title={mirrorPreview ? 'Espelhamento Selfie Ativo' : 'Espelhamento Desativado'}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}

          {/* Settings Drawer Button */}
          <button
            id="btn-open-camera-settings"
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`p-2.5 rounded-xl transition ${
              showSettingsDrawer ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-white/10'
            }`}
            title="Configurações de Câmera, Resolução e Enquadramento"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Exit Studio Button */}
          <button
            onClick={onExit}
            disabled={isRecording}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition ml-1"
            title="Voltar aos Roteiros"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Drawer Panel */}
      <CameraSettingsPanel
        isOpen={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        resolution={resolution}
        onResolutionChange={setResolution}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        compositionGuide={compositionGuide}
        onCompositionGuideChange={setCompositionGuide}
        videoDevices={videoDevices}
        selectedVideoDeviceId={selectedVideoDeviceId}
        onVideoDeviceChange={setSelectedVideoDeviceId}
        audioDevices={audioDevices}
        selectedAudioDeviceId={selectedAudioDeviceId}
        onAudioDeviceChange={setSelectedAudioDeviceId}
        showPrompter={showPrompter}
        onToggleShowPrompter={() => setShowPrompter(!showPrompter)}
        overlayOpacity={overlayOpacity}
        onOverlayOpacityChange={setOverlayOpacity}
        overlayWidth={overlayWidth}
        onOverlayWidthChange={setOverlayWidth}
        overlayPosition={overlayPosition}
        onOverlayPositionChange={setOverlayPosition}
        fontSize={prompterFontSize}
        onFontSizeChange={setPrompterFontSize}
        speed={prompterSpeed}
        onSpeedChange={setPrompterSpeed}
        autoScrollOnRecord={autoScrollOnRecord}
        onToggleAutoScrollOnRecord={() => setAutoScrollOnRecord(!autoScrollOnRecord)}
        countdownSeconds={preRecordCountdown}
        onCountdownSecondsChange={setPreRecordCountdown}
        isRecording={isRecording}
      />

      {/* BOTTOM CONTROLS BAR: Shutter / Record, Pause/Resume, Stop, Takes history button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-slate-950/85 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
        {/* If Not Recording: Record Shutter Button */}
        {!isRecording ? (
          <div className="flex items-center gap-3">
            <button
              id="btn-start-recording"
              onClick={handleStartRecordingClick}
              disabled={isLoadingStream || !!cameraError}
              className="flex items-center gap-3 px-7 py-3.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/40 active:scale-95 transition disabled:opacity-40"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
              <span>GRAVAR VÍDEO</span>
            </button>

            {/* If there are already recorded takes in this session, show shortcut to review them */}
            {takes.length > 0 && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                title="Ver takes gravados nesta sessão"
              >
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                <span>Takes ({takes.length})</span>
              </button>
            )}
          </div>
        ) : (
          /* When Recording: Pause, Resume and Stop Controls */
          <div className="flex items-center gap-3">
            {isPauseSupported && (
              <button
                id="btn-pause-recording"
                onClick={togglePauseRecording}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-xs active:scale-95 transition ${
                  isPaused
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                <span>{isPaused ? 'RETOMAR' : 'PAUSAR'}</span>
              </button>
            )}

            <button
              id="btn-stop-recording"
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-900/40 active:scale-95 transition"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>ENCERRAR GRAVAÇÃO</span>
            </button>
          </div>
        )}
      </div>

      {/* Camera Error Modal */}
      {cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 p-6 rounded-3xl shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Acesso à Câmera Necessário</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={initCamera}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
              >
                Tentar Novamente
              </button>
              <button
                onClick={onExit}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                Voltar aos Roteiros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Review, Playback, Take Switcher & Download Modal */}
      <CameraTakeReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        takes={takes}
        selectedTakeIndex={selectedTakeIndex}
        onSelectTake={(idx) => setSelectedTakeIndex(idx)}
        onDeleteTake={(idx) => {
          const updated = takes.filter((_, i) => i !== idx);
          setTakes(updated);
          if (selectedTakeIndex >= updated.length) {
            setSelectedTakeIndex(Math.max(0, updated.length - 1));
          }
          if (updated.length === 0) {
            setShowReviewModal(false);
          }
        }}
        onRecordNewTake={() => {
          setShowReviewModal(false);
          setRecordTimer(0);
          resetPrompterScroll();
        }}
      />
    </div>
  );
};
