import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  FlipVertical,
  Type,
  Eye,
  Sliders,
  X,
  Plus,
  Minus,
  Layers
} from 'lucide-react';
import { TeleprompterSettings } from '../../types';
import { VoiceIndicator } from './VoiceIndicator';
import { VoiceCommand } from '../../services/speech';

interface PrompterControlsProps {
  settings: TeleprompterSettings;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSpeedChange: (speed: number) => void;
  onFontSizeChange: (size: number) => void;
  onJump: (direction: 'forward' | 'backward') => void;
  onUpdateSettings: (partial: Partial<TeleprompterSettings>) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onExit: () => void;
  onVoiceCommand: (cmd: VoiceCommand) => void;
  onFloatingClick?: () => void;
  progressPercent: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  compact?: boolean;
}

export const PrompterControls: React.FC<PrompterControlsProps> = ({
  settings,
  isPlaying,
  onTogglePlay,
  onRestart,
  onSpeedChange,
  onFontSizeChange,
  onJump,
  onUpdateSettings,
  onToggleFullscreen,
  isFullscreen,
  onExit,
  onVoiceCommand,
  onFloatingClick,
  progressPercent,
  elapsedSeconds,
  remainingSeconds,
  compact = false,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const speedPresets = [0.5, 1.0, 1.5, 2.0, 3.0];

  return (
    <div
      id="prompter-controls-overlay"
      className="flex flex-col justify-between px-3 sm:px-4 pb-4 pointer-events-none w-full h-full"
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 48px) + 8px)',
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 pointer-events-auto bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xl max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <button
            id="btn-prompter-exit"
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
            title="Sair do Teleprompter"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Time & Progress */}
          <div className="flex items-center gap-3 text-xs pl-1">
            <span className="text-slate-400 font-mono">
              {formatTime(elapsedSeconds)} / <strong className="text-cyan-400">{formatTime(remainingSeconds)}</strong>
            </span>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
              <span className="text-slate-400 font-mono text-[11px]">{Math.round(progressPercent)}%</span>
            </div>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Prominent FLUTUAR Button for iPhone */}
          {onFloatingClick && (
            <button
              id="btn-prompter-float"
              onClick={onFloatingClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/30 active:scale-95 transition"
              title="Ativar Modo Flutuante para usar com a Câmera nativa do iPhone"
            >
              <Layers className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span className="tracking-wide font-black">FLUTUAR</span>
            </button>
          )}

          <VoiceIndicator
            enabled={settings.voiceControlEnabled}
            onToggle={(enabled) => onUpdateSettings({ voiceControlEnabled: enabled })}
            onCommandReceived={onVoiceCommand}
          />

          <button
            id="btn-prompter-mirror-h"
            onClick={() => onUpdateSettings({ mirrorHorizontal: !settings.mirrorHorizontal })}
            className={`p-2 rounded-xl border transition active:scale-95 ${
              settings.mirrorHorizontal
                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Espelhar Horizontalmente (Vidro/Refletor)"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          <button
            id="btn-prompter-guide"
            onClick={() => onUpdateSettings({ guideLine: !settings.guideLine })}
            className={`p-2 rounded-xl border transition active:scale-95 ${
              settings.guideLine
                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Linha Guia Central"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            id="btn-prompter-fullscreen"
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition active:scale-95"
            title="Tela Cheia (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Main Navigation & Speed Controller */}
      <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md p-3 sm:p-4 rounded-3xl border border-slate-800 shadow-2xl max-w-2xl mx-auto w-full space-y-3">
        {/* Playback Controls Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Restart */}
          <button
            id="btn-prompter-restart"
            onClick={onRestart}
            className="p-2.5 sm:p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-90"
            title="Reiniciar (R)"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Jump Back */}
          <button
            id="btn-prompter-jump-back"
            onClick={() => onJump('backward')}
            className="p-2.5 sm:p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-90"
            title="Retroceder"
          >
            <Rewind className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Main Play/Pause Button (Extra large for recording touch) */}
          <button
            id="btn-prompter-play-pause"
            onClick={onTogglePlay}
            className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 px-6 rounded-2xl font-bold shadow-lg transition active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                <span className="text-sm sm:text-base">PAUSAR</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                <span className="text-sm sm:text-base">INICIAR</span>
              </>
            )}
          </button>

          {/* Jump Forward */}
          <button
            id="btn-prompter-jump-forward"
            onClick={() => onJump('forward')}
            className="p-2.5 sm:p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-90"
            title="Avançar"
          >
            <FastForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Font Size Adjust */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1">
            <button
              id="btn-font-smaller"
              onClick={() => onFontSizeChange(Math.max(16, settings.fontSize - 4))}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90"
              title="Diminuir Fonte"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono px-1 font-semibold text-slate-200">
              {settings.fontSize}
            </span>
            <button
              id="btn-font-larger"
              onClick={() => onFontSizeChange(Math.min(120, settings.fontSize + 4))}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90"
              title="Aumentar Fonte"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Speed Adjustment Bar */}
        <div className="flex items-center gap-3 pt-1 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
            Velocidade: <strong className="text-cyan-400 font-mono">{settings.speed.toFixed(1)}x</strong>
          </span>

          {/* Fine tune minus */}
          <button
            id="btn-speed-minus-fine"
            onClick={() => onSpeedChange(Math.max(0.1, Number((settings.speed - 0.1).toFixed(1))))}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono"
            title="-0.1x"
          >
            -0.1
          </button>

          {/* Slider */}
          <input
            id="slider-prompter-speed"
            type="range"
            min="0.1"
            max="4.0"
            step="0.05"
            value={settings.speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          {/* Fine tune plus */}
          <button
            id="btn-speed-plus-fine"
            onClick={() => onSpeedChange(Math.min(5.0, Number((settings.speed + 0.1).toFixed(1))))}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono"
            title="+0.1x"
          >
            +0.1
          </button>

          {/* Presets */}
          <div className="hidden sm:flex items-center gap-1">
            {speedPresets.map((sp) => (
              <button
                key={sp}
                onClick={() => onSpeedChange(sp)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition ${
                  Math.abs(settings.speed - sp) < 0.05
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
