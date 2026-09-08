import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface CameraAudioVuMeterProps {
  audioEnabled: boolean;
  audioLevel: number; // 0 to 100
  onToggleAudio: () => void;
  isRecording: boolean;
}

export const CameraAudioVuMeter: React.FC<CameraAudioVuMeterProps> = ({
  audioEnabled,
  audioLevel,
  onToggleAudio,
  isRecording,
}) => {
  // Determine segment colors based on level (0-60 green, 60-85 yellow, 85-100 red)
  const segments = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-xs">
      <button
        onClick={onToggleAudio}
        className={`p-1 rounded-lg transition ${
          audioEnabled
            ? 'text-cyan-400 hover:bg-white/10'
            : 'text-red-400 bg-red-950/40 border border-red-500/20'
        }`}
        title={audioEnabled ? 'Microfone Ativo (Clique para silenciar)' : 'Microfone Mudo (Clique para ativar)'}
      >
        {audioEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
      </button>

      {audioEnabled ? (
        <div className="flex items-center gap-1.5" title={`Nível de entrada de áudio: ${audioLevel}%`}>
          {/* Audio VU Meter Bars */}
          <div className="flex items-end gap-[2px] h-3 w-16">
            {segments.map((thresh) => {
              const isActive = audioLevel >= thresh;
              let barColor = 'bg-emerald-500';
              if (thresh > 80) {
                barColor = 'bg-red-500';
              } else if (thresh > 60) {
                barColor = 'bg-amber-400';
              }

              return (
                <div
                  key={thresh}
                  className={`w-1 rounded-sm transition-all duration-75 ${
                    isActive ? `${barColor} h-3 shadow-[0_0_6px_currentColor]` : 'bg-slate-800 h-1'
                  }`}
                />
              );
            })}
          </div>
          <span className="font-mono text-[9px] text-slate-400 select-none">
            {audioLevel > 85 ? 'CLIP' : `${audioLevel}%`}
          </span>
        </div>
      ) : (
        <span className="font-mono text-[10px] text-red-400 font-semibold uppercase">MUDO</span>
      )}
    </div>
  );
};
