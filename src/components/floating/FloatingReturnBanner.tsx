import React from 'react';
import { Layers, Play, X, RotateCcw, CheckCircle2, Clock } from 'lucide-react';
import { FloatingModeState } from '../../types';

interface FloatingReturnBannerProps {
  floatingState: FloatingModeState;
  onContinue: () => void;
  onDismiss: () => void;
}

export const FloatingReturnBanner: React.FC<FloatingReturnBannerProps> = ({
  floatingState,
  onContinue,
  onDismiss,
}) => {
  return (
    <div
      id="banner-floating-mode-active"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-3xl bg-slate-900/95 border border-cyan-400/40 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                Teleprompter ativo
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <h4 className="text-sm font-bold text-white truncate max-w-[220px]">
              {floatingState.scriptTitle}
            </h4>

            <p className="text-[11px] text-slate-400">
              Posição: <span className="font-mono text-cyan-300">{floatingState.currentPosition}px</span> • Velocidade:{' '}
              <span className="font-mono text-cyan-300">{floatingState.scrollSpeed}x</span>
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white"
          title="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
        <button
          id="btn-floating-return-continue"
          onClick={onContinue}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs active:scale-95 transition shadow-md shadow-cyan-500/20"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>CONTINUAR</span>
        </button>

        <button
          id="btn-floating-return-dismiss"
          onClick={onDismiss}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 active:scale-95 transition"
        >
          <X className="w-3.5 h-3.5" />
          <span>ENCERRAR FLUTUAÇÃO</span>
        </button>
      </div>
    </div>
  );
};
