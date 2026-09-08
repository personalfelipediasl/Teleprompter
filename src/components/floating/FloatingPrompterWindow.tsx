import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Move,
  ArrowLeft,
  Eye,
  Sliders,
  Sparkles,
  Camera
} from 'lucide-react';
import { Script, TeleprompterSettings, FloatingWindowSizePreset } from '../../types';
import { StorageService } from '../../services/storage';

interface FloatingPrompterWindowProps {
  script: Script;
  settings: TeleprompterSettings;
  initialPosition?: number;
  initialPlaying?: boolean;
  onUpdateSettings: (settings: Partial<TeleprompterSettings>) => void;
  onClose: () => void;
  onReturnToApp?: () => void;
  onPositionChange?: (position: number) => void;
}

const SIZE_PRESETS: Record<
  FloatingWindowSizePreset,
  { width: number; height: number; label: string; fontSizeMultiplier: number }
> = {
  small: { width: 300, height: 190, label: 'Pequeno', fontSizeMultiplier: 0.5 },
  medium: { width: 360, height: 260, label: 'Médio', fontSizeMultiplier: 0.65 },
  large: { width: 440, height: 340, label: 'Grande', fontSizeMultiplier: 0.8 },
  custom: { width: 360, height: 280, label: 'Personalizado', fontSizeMultiplier: 0.65 },
};

const OPACITY_PRESETS = [100, 80, 60, 40, 20];

export const FloatingPrompterWindow: React.FC<FloatingPrompterWindowProps> = ({
  script,
  settings,
  initialPosition = 0,
  initialPlaying = false,
  onUpdateSettings,
  onClose,
  onReturnToApp,
  onPositionChange,
}) => {
  // Window position & size states
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 68 });
  const [sizePreset, setSizePreset] = useState<FloatingWindowSizePreset>('medium');
  const [customSize, setCustomSize] = useState<{ width: number; height: number }>({
    width: 360,
    height: 260,
  });
  const [bgOpacity, setBgOpacity] = useState<number>(80);
  const [textOpacity, setTextOpacity] = useState<number>(100);

  // Prompter states
  const [isPlaying, setIsPlaying] = useState<boolean>(initialPlaying);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(settings.fontSize || 38);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(initialPosition || script.lastPosition || 0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const autoHideTimeoutRef = useRef<any>(null);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 16, posY: 68 });

  // Load saved window position & size from storage
  useEffect(() => {
    async function loadSavedState() {
      const saved = await StorageService.getFloatingState();
      if (saved) {
        if (saved.windowPosition) {
          // Clamp inside viewport respecting top safe area (at least 54px from top for iPhone notch)
          const x = Math.max(10, Math.min(window.innerWidth - 300, saved.windowPosition.x));
          const y = Math.max(54, Math.min(window.innerHeight - 150, saved.windowPosition.y));
          setPosition({ x, y });
        }
        if (saved.windowSize) {
          setSizePreset(saved.windowSize);
        }
        if (saved.opacity) {
          setBgOpacity(saved.opacity);
        }
        if (saved.textOpacity) {
          setTextOpacity(saved.textOpacity);
        }
        if (saved.currentPosition && initialPosition === 0) {
          scrollPosRef.current = saved.currentPosition;
        }
      }
    }
    loadSavedState();
  }, [initialPosition]);

  // Current active dimensions
  const activeDimensions =
    sizePreset === 'custom'
      ? customSize
      : { width: SIZE_PRESETS[sizePreset].width, height: SIZE_PRESETS[sizePreset].height };

  // Auto-hide controls after 3.5 seconds of inactivity when playing
  const resetAutoHideControls = useCallback(() => {
    setShowControls(true);
    clearTimeout(autoHideTimeoutRef.current);
    if (isPlaying) {
      autoHideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetAutoHideControls();
    return () => clearTimeout(autoHideTimeoutRef.current);
  }, [isPlaying, resetAutoHideControls]);

  // High performance smooth scroll loop (rAF)
  useEffect(() => {
    const tick = (now: number) => {
      if (isPlaying) {
        if (lastTimeRef.current !== null) {
          const delta = (now - lastTimeRef.current) / 1000;
          // Smooth scroll step based on settings.speed
          scrollPosRef.current += 55 * settings.speed * delta;

          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollPosRef.current;
          }

          if (onPositionChange) {
            onPositionChange(Math.round(scrollPosRef.current));
          }
        }
        lastTimeRef.current = now;
      } else {
        lastTimeRef.current = null;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, settings.speed, onPositionChange]);

  // Save state to StorageService on changes
  const persistFloatingState = useCallback(() => {
    StorageService.saveFloatingState({
      active: true,
      scriptId: script.id,
      scriptTitle: script.title,
      currentPosition: Math.round(scrollPosRef.current),
      scrollSpeed: settings.speed,
      fontSize,
      opacity: bgOpacity,
      textOpacity,
      windowPosition: position,
      windowSize: sizePreset,
      customWidth: customSize.width,
      customHeight: customSize.height,
      isPlaying,
      theme: 'dark',
      mirrored: settings.mirrorHorizontal,
      timestamp: Date.now(),
    });
  }, [
    script.id,
    script.title,
    settings.speed,
    settings.mirrorHorizontal,
    fontSize,
    bgOpacity,
    textOpacity,
    position,
    sizePreset,
    customSize,
    isPlaying,
  ]);

  useEffect(() => {
    persistFloatingState();
  }, [persistFloatingState]);

  // Touch & Pointer dragging logic
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resetAutoHideControls();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    const maxX = Math.max(10, window.innerWidth - activeDimensions.width - 10);
    const maxY = Math.max(10, window.innerHeight - activeDimensions.height - 20);

    const newX = Math.max(10, Math.min(maxX, dragStartRef.current.posX + dx));
    const newY = Math.max(54, Math.min(maxY, dragStartRef.current.posY + dy));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      persistFloatingState();
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
    resetAutoHideControls();
  };

  const handleRestart = () => {
    scrollPosRef.current = 0;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    resetAutoHideControls();
  };

  const handleClose = () => {
    persistFloatingState();
    onClose();
  };

  const handleReturn = () => {
    persistFloatingState();
    if (onReturnToApp) {
      onReturnToApp();
    } else {
      onClose();
    }
  };

  return (
    <div
      id="native-floating-prompter-window"
      onClick={resetAutoHideControls}
      className="fixed z-50 rounded-3xl border border-cyan-400/30 shadow-[0_12px_45px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col select-none transition-[width,height] duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${activeDimensions.width}px`,
        height: `${activeDimensions.height}px`,
        backgroundColor: `rgba(9, 13, 22, ${bgOpacity / 100})`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Draggable Header with Camera Alignment Indicator */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="px-3 py-2 bg-slate-900/90 border-b border-cyan-500/20 flex items-center justify-between cursor-move active:bg-slate-800 touch-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-bold text-white tracking-wide truncate max-w-[170px]">
            {script.title}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
            {settings.speed.toFixed(1)}x
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Return to full app button */}
          <button
            onClick={handleReturn}
            className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1 border border-cyan-500/40 transition active:scale-95"
            title="Retornar à tela principal do aplicativo"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">App</span>
          </button>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 active:scale-90"
            title="Fechar Modo Flutuante"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Prompter Scrolling Text Area */}
      <div
        ref={scrollRef}
        id="floating-scroll-viewport"
        className="flex-1 p-3.5 overflow-y-auto no-scrollbar relative"
        style={{
          fontSize: `${Math.round(fontSize * SIZE_PRESETS[sizePreset].fontSizeMultiplier)}px`,
          color: settings.textColor || '#ffffff',
          opacity: textOpacity / 100,
          lineHeight: 1.55,
          textAlign: settings.textAlign,
        }}
      >
        {/* Optical Lens Focus Guide */}
        <div className="sticky top-2 left-0 right-0 pointer-events-none mb-2 z-10 flex items-center justify-between text-[10px] text-cyan-400/80 font-semibold px-2 py-0.5 bg-cyan-950/40 rounded border border-cyan-500/20">
          <span>● Olhe para a lente</span>
          <span>{isPlaying ? '▶ Rolando' : '⏸ Pausado'}</span>
        </div>

        <div className="pt-6 pb-28 space-y-2">
          {script.content.split('\n').map((line, idx) => (
            <p key={idx} className="my-1.5 transition-colors">
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      </div>

      {/* Floating Minimum Controls Bar (with auto-hide on inactivity) */}
      <div
        className={`p-2 bg-slate-950/95 border-t border-slate-800 flex flex-col gap-2 transition-opacity duration-200 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Main Minimal Controls: Restart, Play/Pause, Speed +/- */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Restart */}
          <button
            onClick={handleRestart}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-90"
            title="Reiniciar roteiro"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Minus */}
          <button
            onClick={() => {
              const nextSpeed = Math.max(0.2, Number((settings.speed - 0.2).toFixed(1)));
              onUpdateSettings({ speed: nextSpeed });
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold active:scale-90"
            title="Diminuir velocidade"
          >
            -
          </button>

          {/* Large Main Play/Pause */}
          <button
            onClick={handleTogglePlay}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl font-bold text-xs transition active:scale-95 shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSAR</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>ROLAR</span>
              </>
            )}
          </button>

          {/* Speed Plus */}
          <button
            onClick={() => {
              const nextSpeed = Math.min(5.0, Number((settings.speed + 0.2).toFixed(1)));
              onUpdateSettings({ speed: nextSpeed });
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold active:scale-90"
            title="Aumentar velocidade"
          >
            +
          </button>

          {/* Font Size Smaller */}
          <button
            onClick={() => setFontSize((prev) => Math.max(20, prev - 4))}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:scale-90"
            title="Diminuir texto"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Font Size Larger */}
          <button
            onClick={() => setFontSize((prev) => Math.min(100, prev + 4))}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:scale-90"
            title="Aumentar texto"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Secondary controls: Size Presets & Transparency */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[10px]">
          {/* Size presets */}
          <div className="flex items-center gap-1">
            {(['small', 'medium', 'large'] as FloatingWindowSizePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setSizePreset(preset)}
                className={`px-2 py-0.5 rounded-lg uppercase tracking-wider font-bold transition ${
                  sizePreset === preset
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {preset === 'small' ? 'P' : preset === 'medium' ? 'M' : 'G'}
              </button>
            ))}
          </div>

          {/* Opacity presets: 100%, 80%, 60%, 40%, 20% */}
          <div className="flex items-center gap-1 text-slate-400">
            <span>Opacidade:</span>
            {OPACITY_PRESETS.map((op) => (
              <button
                key={op}
                onClick={() => {
                  setBgOpacity(op);
                  setTextOpacity(op < 40 ? 80 : 100);
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition ${
                  bgOpacity === op
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {op}%
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
