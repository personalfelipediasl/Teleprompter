import React, { useEffect, useState } from 'react';
import {
  Layers,
  Camera,
  ArrowLeft,
  Smartphone,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Plus,
  Minus,
  ExternalLink
} from 'lucide-react';
import { Script, TeleprompterSettings } from '../../types';
import { PiPPrompterService } from '../../services/pipPrompter';
import { NativeIOSBridge } from '../../services/nativeIosBridge';

interface PiPStandbyScreenProps {
  script: Script;
  settings: TeleprompterSettings;
  onExitStandby: () => void;
  onOpenInAppCamera?: () => void;
}

export const PiPStandbyScreen: React.FC<PiPStandbyScreenProps> = ({
  script,
  settings,
  onExitStandby,
  onOpenInAppCamera,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentSpeed, setCurrentSpeed] = useState<number>(settings.speed);
  const [currentScroll, setCurrentScroll] = useState<number>(0);

  useEffect(() => {
    const unsubPause = NativeIOSBridge.addListener('pipPaused', () => setIsPlaying(false));
    const unsubResume = NativeIOSBridge.addListener('pipResumed', () => setIsPlaying(true));
    const unsubStop = NativeIOSBridge.addListener('pipDidStop', (data) => {
      if (typeof data?.position === 'number') {
        setCurrentScroll(data.position);
      }
    });
    const unsubPos = NativeIOSBridge.addListener('pipPositionUpdate', (data) => {
      if (typeof data?.position === 'number') {
        setCurrentScroll(data.position);
      }
    });

    const interval = setInterval(() => {
      if (PiPPrompterService.isPiPActive()) {
        setCurrentScroll(PiPPrompterService.getCurrentScroll());
      }
    }, 500);

    return () => {
      unsubPause();
      unsubResume();
      unsubStop();
      unsubPos();
      clearInterval(interval);
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      NativeIOSBridge.pause();
      setIsPlaying(false);
    } else {
      NativeIOSBridge.resume();
      setIsPlaying(true);
    }
  };

  const handleSpeedDelta = (delta: number) => {
    const nextSpeed = Math.round(Math.max(0.2, Math.min(5.0, currentSpeed + delta)) * 10) / 10;
    setCurrentSpeed(nextSpeed);
    NativeIOSBridge.setSpeed(nextSpeed);
  };

  const handleRestart = () => {
    NativeIOSBridge.start(script, { ...settings, speed: currentSpeed }, 0, {
      onExit: onExitStandby,
      onPlayPause: (p) => setIsPlaying(p),
      onPositionChange: (pos) => setCurrentScroll(pos),
    }).catch(console.warn);
  };

  return (
    <div
      id="pip-standby-screen"
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 text-center select-none overflow-y-auto"
    >
      {/* Top Bar / Status */}
      <div className="w-full max-w-md pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
            Picture-in-Picture Ativo
          </span>
        </div>

        <button
          onClick={onExitStandby}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold active:scale-95 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao App</span>
        </button>
      </div>

      {/* Center Guidance Content */}
      <div className="w-full max-w-sm space-y-5 my-auto py-4">
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
          <Layers className="w-10 h-10 text-cyan-400 animate-pulse" />
          <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-slate-900 border border-cyan-500/50">
            <Camera className="w-4 h-4 text-cyan-300" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-white tracking-tight">
            Roteiro Flutuando no iPhone
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            A janela do teleprompter está ativa. Saia para a tela de início do iPhone e abra a <strong>Câmera Nativa</strong> para gravar seu vídeo.
          </p>
        </div>

        {/* Tip Box matching user's photo behavior */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-2.5 shadow-xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Instruções da Janela PiP:</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li>
              <strong>Posicionamento:</strong> Arraste a janela PiP para posicioná-la próxima à câmera frontal do iPhone.
            </li>
            <li>
              <strong>2 Toques no PiP:</strong> Pausa ou retoma a rolagem do texto instantaneamente.
            </li>
            <li>
              <strong>Ao concluir a gravação:</strong> Feche a janela flutuante ou toque em Voltar para restaurar o estado exato da leitura.
            </li>
          </ul>
        </div>

        {/* Speed and Play/Pause Controls */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 font-medium">Velocidade da Rolagem:</span>
            <span className="font-mono font-bold text-cyan-400">{currentSpeed.toFixed(1)}x</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleSpeedDelta(-0.2)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition"
              title="Mais devagar"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold active:scale-95 transition"
              title="Reiniciar roteiro do início"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reiniciar</span>
            </button>

            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-md active:scale-95 transition ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
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
                  <span>CONTINUAR</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleSpeedDelta(0.2)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition"
              title="Mais rápido"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="w-full max-w-sm pb-6 space-y-2.5">
        <button
          onClick={onExitStandby}
          className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs active:scale-95 transition flex items-center justify-center gap-2"
        >
          <span>ENCERRAR MODO FLUTUANTE</span>
        </button>

        {onOpenInAppCamera && (
          <button
            onClick={() => {
              onExitStandby();
              onOpenInAppCamera();
            }}
            className="text-[11px] text-slate-500 hover:text-cyan-400 transition block mx-auto py-1"
          >
            Prefere gravar dentro deste app? Toque aqui
          </button>
        )}
      </div>
    </div>
  );
};
