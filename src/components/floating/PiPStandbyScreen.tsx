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
  ExternalLink
} from 'lucide-react';
import { Script, TeleprompterSettings } from '../../types';
import { PiPPrompterService } from '../../services/pipPrompter';

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
  const [currentScroll, setCurrentScroll] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Check if PiP was closed externally by the user on iOS
      if (!PiPPrompterService.isPiPActive()) {
        // PiP closed
      } else {
        setCurrentScroll(PiPPrompterService.getCurrentScroll());
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleTogglePlay = () => {
    const nextPlaying = PiPPrompterService.togglePlay();
    setIsPlaying(nextPlaying);
  };

  const handleRestart = () => {
    // restart scroll
    PiPPrompterService.startPiP(
      script.content.split('\n').filter((l) => l.trim().length > 0),
      {
        title: script.title,
        speed: settings.speed,
        fontSize: settings.fontSize,
        textColor: settings.textColor,
        bgColor: settings.backgroundColor,
        initialScroll: 0,
        onExit: onExitStandby,
        onTogglePlay: (p) => setIsPlaying(p),
      }
    ).catch(console.warn);
  };

  return (
    <div
      id="pip-standby-screen"
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 text-center select-none"
    >
      {/* Top Bar / Status */}
      <div className="w-full max-w-md pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
            PiP Nativo iOS Ativo
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
      <div className="w-full max-w-sm space-y-6 my-auto">
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
          <Layers className="w-12 h-12 text-cyan-400 animate-pulse" />
          <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-slate-900 border border-cyan-500/50">
            <Camera className="w-5 h-5 text-cyan-300" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Roteiro Flutuando no iPhone
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            A tela do roteiro está ativa e continuará funcionando. Saia para a tela de início e abra o aplicativo <strong>Câmera</strong> do seu iPhone para gravar.
          </p>
        </div>

        {/* Tip Box matching user's photo behavior */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-2.5 shadow-xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Dicas do Modo Flutuante:</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li>
              <strong>2 Toques no PiP:</strong> Pausa ou retoma a rolagem.
            </li>
            <li>
              <strong>Posicionamento:</strong> Arraste a janela para perto da lente da câmera frontal do iPhone.
            </li>
            <li>
              <strong>Ao finalizar:</strong> Feche a janela flutuante ou toque em Voltar para revisar seu roteiro.
            </li>
          </ul>
        </div>

        {/* Remote PiP Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold active:scale-95 transition"
            title="Reiniciar roteiro do início"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reiniciar</span>
          </button>

          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg active:scale-95 transition ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSAR ROLAGEM</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>CONTINUAR ROLAGEM</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="w-full max-w-sm pb-8 space-y-3">
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
            className="text-[11px] text-slate-500 hover:text-cyan-400 transition"
          >
            Prefere gravar dentro deste app? Toque aqui
          </button>
        )}
      </div>
    </div>
  );
};
