import React from 'react';
import {
  Layers,
  Camera,
  CheckCircle2,
  Apple,
  Info,
  Play,
  Video,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { EnvironmentDetector } from '../../services/environmentDetector';

interface FloatingInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFloating: () => void;
  onStartInAppCamera: () => void;
  scriptTitle: string;
}

export const FloatingInstructionsModal: React.FC<FloatingInstructionsModalProps> = ({
  isOpen,
  onClose,
  onStartFloating,
  onStartInAppCamera,
  scriptTitle,
}) => {
  const caps = EnvironmentDetector.getCapabilities();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modo Flutuante"
      maxWidth="max-w-xl"
    >
      <div id="floating-instructions-content" className="space-y-4 text-slate-200 text-sm">
        {/* Subtitle / User Intention */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/50 to-blue-950/30 border border-cyan-500/30 space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-base">
            <Apple className="w-5 h-5 text-cyan-400" />
            <span>Use o teleprompter enquanto utiliza outros recursos do iPhone.</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Posicione o teleprompter próximo à câmera para gravar seus vídeos olhando diretamente para a lente.
          </p>
        </div>

        {/* Step by Step Flow for iPhone */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Como usar com a Câmera nativa do iPhone:
          </span>

          <div className="space-y-2">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold shrink-0">
                1
              </span>
              <div className="text-xs">
                <strong className="text-white block">Ative a Flutuação:</strong>
                O teleprompter abre uma janela persistente de Picture-in-Picture suportada pelas APIs públicas do iOS.
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold shrink-0">
                2
              </span>
              <div className="text-xs">
                <strong className="text-white block">Abra a Câmera Nativa do iPhone:</strong>
                Saia para a tela inicial do iPhone e abra o app Câmera. A janela flutuante continuará visível.
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold shrink-0">
                3
              </span>
              <div className="text-xs">
                <strong className="text-white block">Posicione Próximo à Câmera Frontal:</strong>
                Arraste a janela para o topo da tela, logo abaixo da lente, para manter contato visual natural com o espectador.
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold shrink-0">
                4
              </span>
              <div className="text-xs">
                <strong className="text-white block">Grave e Retorne com 1 Toque:</strong>
                Ao terminar o vídeo, volte ao app. Seu roteiro e posição estarão exatamente preservados.
              </div>
            </div>
          </div>
        </div>

        {/* Technical Transparency Note required by guidelines */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400/90 font-semibold">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Transparência de Sistema iOS</span>
          </div>
          <p className="leading-relaxed">
            Este recurso depende das permissões e recursos de multitarefa disponíveis no iOS. As políticas da Apple permitem janelas flutuantes sobre outros apps exclusivamente via <strong>Picture-in-Picture (PiP) oficial</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {/* Primary: Start Floating */}
          <button
            id="btn-confirm-start-floating"
            onClick={() => {
              onClose();
              onStartFloating();
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition"
          >
            <Layers className="w-4 h-4 text-slate-950" />
            <span>INICIAR FLUTUAÇÃO</span>
          </button>

          {/* Secondary: In-App Camera Studio */}
          <button
            id="btn-start-inapp-studio"
            onClick={() => {
              onClose();
              onStartInAppCamera();
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 active:scale-95 transition"
          >
            <Video className="w-4 h-4 text-cyan-400" />
            <span>GRAVAR NO APP (Câmera Integrada)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
