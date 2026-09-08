import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TeleprompterSettings, Script } from '../../types';
import { PrompterControls } from './PrompterControls';
import { WakeLockManager } from '../../services/wakeLock';
import { VoiceCommand } from '../../services/speech';
import { StorageService } from '../../services/storage';
import { countWords, calculateEstimatedSeconds, parseScriptContent } from '../../utils/textMetrics';

interface PrompterEngineProps {
  script: Script;
  settings: TeleprompterSettings;
  onUpdateSettings: (settings: Partial<TeleprompterSettings>) => void;
  onSavePosition?: (position: number) => void;
  onExit: () => void;
  onStartFloating?: (position: number, isPlaying: boolean) => void;
  isOverlayMode?: boolean;
}

export const PrompterEngine: React.FC<PrompterEngineProps> = ({
  script,
  settings,
  onUpdateSettings,
  onSavePosition,
  onExit,
  onStartFloating,
  isOverlayMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(script.estimatedSeconds || 60);

  // Refs for animation & touch
  const scrollPosRef = useRef(script.lastPosition || 0);
  const lastTimeRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const touchStartYRef = useRef(0);
  const touchStartPosRef = useRef(0);
  const lastTapTimeRef = useRef(0);
  const controlsTimeoutRef = useRef<any>(null);

  const parsedLines = parseScriptContent(script.content, settings.hideMarkers);

  // Update progress stats
  const updateProgress = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerH = containerRef.current.clientHeight;
    const contentH = contentRef.current.scrollHeight;
    const maxScroll = Math.max(1, contentH - containerH * 0.4);

    const currentPos = scrollPosRef.current;
    const percent = Math.min(100, Math.max(0, (currentPos / maxScroll) * 100));
    setProgressPercent(percent);

    const totalSeconds = calculateEstimatedSeconds(script.wordCount, settings.wordsPerMinute);
    const remSeconds = Math.max(0, Math.round(totalSeconds * (1 - percent / 100)));
    setRemainingSeconds(remSeconds);
  }, [script.wordCount, settings.wordsPerMinute]);

  // Request Animation Frame Smooth Scroller
  const tick = useCallback(
    (now: number) => {
      if (!isPlaying || isDraggingRef.current) {
        lastTimeRef.current = now;
        animFrameIdRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }

      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Base speed: 60px/s * speed multiplier
      const pxPerSecond = 55 * settings.speed;
      const step = (pxPerSecond * deltaMs) / 1000;

      scrollPosRef.current += step;

      if (containerRef.current && contentRef.current) {
        const containerH = containerRef.current.clientHeight;
        const contentH = contentRef.current.scrollHeight;
        const maxScroll = contentH + containerH * 0.5;

        // Check if finished
        if (scrollPosRef.current >= maxScroll) {
          scrollPosRef.current = maxScroll;
          setIsPlaying(false);
          setShowControls(true);
        }

        containerRef.current.scrollTop = scrollPosRef.current;
      }

      updateProgress();
      animFrameIdRef.current = requestAnimationFrame(tick);
    },
    [isPlaying, settings.speed, updateProgress]
  );

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [tick]);

  // Timer for elapsed seconds
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Wake lock
  useEffect(() => {
    if (settings.wakeLockEnabled) {
      WakeLockManager.request();
    }
    return () => {
      WakeLockManager.release();
    };
  }, [settings.wakeLockEnabled]);

  // Save position on pause or exit
  const persistCurrentPosition = useCallback(() => {
    if (onSavePosition) {
      onSavePosition(Math.round(scrollPosRef.current));
    }
  }, [onSavePosition]);

  useEffect(() => {
    if (!isPlaying) {
      persistCurrentPosition();
    }
  }, [isPlaying, persistCurrentPosition]);

  // Auto-hide controls after 4s when playing
  const resetControlsTimer = useCallback(() => {
    clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [isPlaying, resetControlsTimer]);

  // Play / Pause with optional countdown
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      setShowControls(true);
    } else {
      if (settings.countdownDuration > 0 && scrollPosRef.current < 50) {
        setCountdown(settings.countdownDuration);
        setShowControls(false);
      } else {
        setIsPlaying(true);
        resetControlsTimer();
      }
    }
  }, [isPlaying, settings.countdownDuration, resetControlsTimer]);

  // Countdown handler
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      setIsPlaying(true);
      resetControlsTimer();
    }
  }, [countdown, resetControlsTimer]);

  // Restart
  const handleRestart = () => {
    scrollPosRef.current = 0;
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    setElapsedSeconds(0);
    updateProgress();
    setIsPlaying(false);
    setShowControls(true);
  };

  // Jump
  const handleJump = (direction: 'forward' | 'backward') => {
    const jumpAmount = 250;
    if (direction === 'forward') {
      scrollPosRef.current += jumpAmount;
    } else {
      scrollPosRef.current = Math.max(0, scrollPosRef.current - jumpAmount);
    }
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollPosRef.current;
    }
    updateProgress();
  };

  // Fullscreen
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  // Voice Command Dispatcher
  const handleVoiceCommand = (cmd: VoiceCommand) => {
    switch (cmd) {
      case 'start':
      case 'resume':
        setIsPlaying(true);
        break;
      case 'pause':
      case 'stop':
        setIsPlaying(false);
        setShowControls(true);
        break;
      case 'faster':
        onUpdateSettings({ speed: Math.min(5.0, Number((settings.speed + 0.25).toFixed(2))) });
        break;
      case 'slower':
        onUpdateSettings({ speed: Math.max(0.1, Number((settings.speed - 0.25).toFixed(2))) });
        break;
      case 'restart':
        handleRestart();
        break;
    }
  };

  // Keyboard Shortcuts (Space, Up/Down, Left/Right, R, F, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        onUpdateSettings({ speed: Math.min(5.0, Number((settings.speed + 0.1).toFixed(1))) });
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        onUpdateSettings({ speed: Math.max(0.1, Number((settings.speed - 0.1).toFixed(1))) });
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleJump('backward');
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleJump('forward');
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleRestart();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        onUpdateSettings({ mirrorHorizontal: !settings.mirrorHorizontal });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, settings.speed, settings.mirrorHorizontal, onUpdateSettings]);

  // Touch Handling: single tap toggle controls, double tap play/pause, swipe manual drag
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartYRef.current = touch.clientY;
    touchStartPosRef.current = scrollPosRef.current;
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const diff = touchStartYRef.current - touch.clientY;

    if (Math.abs(diff) > 10) {
      isDraggingRef.current = true;
      scrollPosRef.current = Math.max(0, touchStartPosRef.current + diff);
      if (containerRef.current) {
        containerRef.current.scrollTop = scrollPosRef.current;
      }
      updateProgress();
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) {
      // Tap detected
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        // Double tap -> Play / Pause
        handleTogglePlay();
      } else {
        // Single tap -> Toggle controls
        setShowControls((prev) => !prev);
      }
      lastTapTimeRef.current = now;
    }
    isDraggingRef.current = false;
  };

  // Synchronize scroll on wheel for desktop
  const handleWheel = (e: React.WheelEvent) => {
    scrollPosRef.current = Math.max(0, scrollPosRef.current + e.deltaY);
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollPosRef.current;
    }
    updateProgress();
  };

  // Font family class helper
  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      case 'system':
        return 'font-sans';
      default:
        return 'font-sans';
    }
  };

  const getFontWeightClass = () => {
    switch (settings.fontWeight) {
      case 'bold':
        return 'font-bold';
      case 'semibold':
        return 'font-semibold';
      case 'normal':
        return 'font-normal';
      default:
        return 'font-medium';
    }
  };

  const getTextAlignClass = () => {
    switch (settings.textAlign) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      default:
        return 'text-center';
    }
  };

  // Dynamic transforms for mirror horizontal / vertical
  const transformStyle = {
    transform: `${settings.mirrorHorizontal ? 'scaleX(-1)' : ''} ${
      settings.mirrorVertical ? 'scaleY(-1)' : ''
    }`.trim(),
  };

  const handleActivateFloating = () => {
    const currentPos = Math.round(scrollPosRef.current);
    if (onSavePosition) {
      onSavePosition(currentPos);
    }
    // Persist FLOATING_MODE_ACTIVE in persistent storage
    StorageService.saveFloatingState({
      active: true,
      scriptId: script.id,
      scriptTitle: script.title,
      currentPosition: currentPos,
      scrollSpeed: settings.speed,
      fontSize: settings.fontSize,
      opacity: settings.backgroundOpacity,
      windowPosition: { x: 20, y: 60 },
      windowSize: 'medium',
      isPlaying,
      theme: 'dark',
      mirrored: settings.mirrorHorizontal,
      timestamp: Date.now(),
    });

    if (onStartFloating) {
      onStartFloating(currentPos, isPlaying);
    }
  };

  return (
    <div
      id="prompter-root-container"
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        backgroundColor:
          settings.backgroundColor === 'transparent'
            ? 'transparent'
            : `${settings.backgroundColor}${Math.round((settings.backgroundOpacity / 100) * 255)
                .toString(16)
                .padStart(2, '0')}`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onClick={resetControlsTimer}
    >
      {/* Visual Guide Line */}
      {settings.guideLine && (
        <div
          id="prompter-guide-line"
          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
          style={{ top: `${settings.guideLinePosition}%` }}
        >
          <div className="h-[2px] w-full bg-cyan-400/80 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
          <div className="absolute left-2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-cyan-400" />
          <div className="absolute right-2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[10px] border-r-cyan-400" />
        </div>
      )}

      {/* Focus Mode Spotlight Gradients (Dim upper and lower reading areas) */}
      {settings.focusMode && (
        <div
          id="prompter-focus-mask"
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(to bottom, 
              rgba(0,0,0,0.85) 0%, 
              rgba(0,0,0,0.2) ${settings.guideLinePosition - 15}%, 
              transparent ${settings.guideLinePosition - 5}%, 
              transparent ${settings.guideLinePosition + 15}%, 
              rgba(0,0,0,0.2) ${settings.guideLinePosition + 25}%, 
              rgba(0,0,0,0.85) 100%)`,
          }}
        />
      )}

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div
          id="prompter-countdown-overlay"
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none"
        >
          <div className="text-center animate-bounce">
            <span className="text-9xl font-black text-cyan-400 drop-shadow-[0_0_35px_rgba(56,189,248,0.8)]">
              {countdown === 0 ? 'GO!' : countdown}
            </span>
          </div>
        </div>
      )}

      {/* Scrolling Text Container */}
      <div
        ref={containerRef}
        id="prompter-scroll-viewport"
        className="w-full h-full overflow-y-scroll no-scrollbar scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div
          ref={contentRef}
          id="prompter-text-body"
          className="mx-auto transition-transform"
          style={{
            ...transformStyle,
            width: `${settings.textWidth}%`,
            paddingTop: `${settings.guideLinePosition}vh`,
            paddingBottom: '80vh',
          }}
        >
          <div
            className={`${getFontFamilyClass()} ${getFontWeightClass()} ${getTextAlignClass()}`}
            style={{
              color: settings.textColor,
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              letterSpacing: `${settings.letterSpacing}px`,
            }}
          >
            {parsedLines.map((lineObj) => {
              if (!lineObj.shouldRender) return null;

              if (lineObj.isMarker) {
                return (
                  <div
                    key={lineObj.id}
                    className="my-3 inline-block px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs uppercase tracking-wider select-none shadow-sm"
                  >
                    [{lineObj.markerType}]
                  </div>
                );
              }

              return (
                <p key={lineObj.id} className="my-3 transition-opacity">
                  {lineObj.raw || '\u00A0'}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <PrompterControls
          settings={settings}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onRestart={handleRestart}
          onSpeedChange={(speed) => onUpdateSettings({ speed })}
          onFontSizeChange={(fontSize) => onUpdateSettings({ fontSize })}
          onJump={handleJump}
          onUpdateSettings={onUpdateSettings}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          onExit={onExit}
          onVoiceCommand={handleVoiceCommand}
          onFloatingClick={handleActivateFloating}
          progressPercent={progressPercent}
          elapsedSeconds={elapsedSeconds}
          remainingSeconds={remainingSeconds}
          compact={isOverlayMode}
        />
      </div>
    </div>
  );
};
