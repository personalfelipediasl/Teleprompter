import React from 'react';
import { AlertCircle, Camera, Smartphone, ArrowRight, X } from 'lucide-react';
import { Modal } from '../common/Modal';

interface PiPUnavailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseCameraStudio: () => void;
  reason?: string;
  isSafariPWA?: boolean;
}

export const PiPUnavailableModal: React.FC<PiPUnavailableModalProps> = ({
  isOpen,
  onClose,
  onUseCameraStudio,
  reason,
  isSafariPWA,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Picture-in-Picture Indisponível"
      maxWidth="max-w-md"
    >
      <div id="pip-unavailable-dialog" className="space-y-5 text-slate-200">
        <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-300 text-sm">
              Picture-in-Picture não está disponível neste dispositivo ou neste ambiente.
            </h4>
            <p className="text-slate-300 leading-relaxed">
              {reason ||
                'O recurso de sobreposição de janela nativa requer o aplicativo compilado para iOS ou suporte a Picture-in-Picture no navegador.'}
            </p>
          </div>
        </div>

        {isSafariPWA && (
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Smartphone className="w-4 h-4" />
              <span>Instalação do Aplicativo para iPhone</span>
            </div>
            <p className="text-slate-300">
              Para utilizar o teleprompter flutuante sobre outros aplicativos, instale a versão do aplicativo para iPhone.
            </p>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Alternativa recomendada:
          </span>
          <p className="text-xs text-slate-300">
            Você pode gravar seu vídeo diretamente dentro do aplicativo utilizando a <strong>Câmera Interna com Teleprompter</strong>, mantendo o roteiro perfeitamente visível e configurável.
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            id="btn-use-camera-studio-fallback"
            onClick={() => {
              onClose();
              onUseCameraStudio();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition"
          >
            <Camera className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>USAR MODO CÂMERA DO APLICATIVO</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold active:scale-95 transition"
          >
            Continuar no aplicativo
          </button>
        </div>
      </div>
    </Modal>
  );
};
