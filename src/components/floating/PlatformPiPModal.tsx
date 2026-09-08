import React, { useState } from 'react';
import {
  Layers,
  Smartphone,
  Apple,
  Cpu,
  MonitorPlay,
  CheckCircle2,
  AlertTriangle,
  Info,
  Code2,
  Play
} from 'lucide-react';
import { Script, TeleprompterSettings } from '../../types';
import { PiPPrompterService } from '../../services/pipPrompter';
import { usePlatform } from '../../hooks/usePlatform';
import { Modal } from '../common/Modal';

interface PlatformPiPModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: Script;
  settings: TeleprompterSettings;
}

export const PlatformPiPModal: React.FC<PlatformPiPModalProps> = ({
  isOpen,
  onClose,
  script,
  settings,
}) => {
  const platform = usePlatform();
  const [activeTab, setActiveTab] = useState<'pip' | 'android' | 'ios'>('pip');
  const [pipActive, setPipActive] = useState(false);
  const [pipError, setPipError] = useState<string | null>(null);

  const startPictureInPicture = async () => {
    setPipError(null);
    try {
      const lines = script.content.split('\n').filter((l) => l.trim().length > 0);
      await PiPPrompterService.startPiP(lines, {
        speed: settings.speed,
        fontSize: settings.fontSize,
        textColor: settings.textColor,
        bgColor: settings.backgroundColor,
        onExit: () => setPipActive(false),
      });
      setPipActive(true);
    } catch (err: any) {
      console.warn('PiP error:', err);
      setPipError(err.message || 'Picture-in-Picture não disponível neste navegador.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Teleprompter Flutuante & Arquitetura Multiplataforma"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-sm text-slate-300">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('pip')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'pip' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span>Picture-in-Picture (PiP)</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'android' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Overlay</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'ios' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>Limitações iOS</span>
          </button>
        </div>

        {/* Tab 1: Picture-in-Picture Web API */}
        {activeTab === 'pip' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Janela Flutuante Real via Picture-in-Picture API</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Utilizamos a tecnologia de renderização em <strong>Canvas Off-screen + MediaStream + Picture-in-Picture</strong>.
                Isso projeta uma janela flutuante com o texto rolando que permanece visível sobre qualquer outra aba ou aplicativo compatível do sistema operacional.
              </p>
            </div>

            {pipError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{pipError}</span>
              </div>
            )}

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-xs">Roteiro Ativo: {script.title}</p>
                <p className="text-[11px] text-slate-400">Velocidade: {settings.speed}x | Fonte: {settings.fontSize}px</p>
              </div>

              <button
                id="btn-launch-pip-prompter"
                onClick={startPictureInPicture}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg active:scale-95 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{pipActive ? 'Reiniciar Janela PiP' : 'Abrir Janela Flutuante PiP'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Android Platform Analysis */}
        {activeTab === 'android' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Smartphone className="w-4 h-4" />
                <span>Análise Técnica para Dispositivos Android</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Em navegadores Chromium no Android, a Web API padrão de segurança restringe uma PWA web pura de desenhar livremente sobre outros aplicativos nativos (ex: sobre o aplicativo nativo de Câmera da Samsung ou Motorola) sem o uso da API Picture-in-Picture.
              </p>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                <strong className="text-slate-200 block mb-1">Arquitetura Preparada para Capacitor / TWA Nativo:</strong>
                Esta aplicação foi desenvolvida com arquitetura modular desacoplada. Para empacotar na Google Play Store com overlay total sobre qualquer aplicativo de terceiros, adicione o plugin de permissão:
                <code className="block mt-1.5 p-2 rounded bg-black/60 font-mono text-[11px] text-cyan-300">
                  android.permission.SYSTEM_ALERT_WINDOW
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: iOS Platform Analysis */}
        {activeTab === 'ios' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Info className="w-4 h-4" />
                <span>Transparência Técnica — Restrições do iOS Safari / WebKit</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A Apple restringe estritamente o sandbox do iOS: nenhuma aplicação web (mesmo PWA instalada) tem permissão do sistema para sobrepor pixels sobre a Câmera nativa do iOS enquanto ela grava em outro aplicativo.
              </p>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-200">Alternativas Reais Implementadas no App:</p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                  <li><strong>Modo Câmera Integrada:</strong> Gravação de vídeo profissional e teleprompter renderizados no mesmo canvas com acesso à câmera do iPhone.</li>
                  <li><strong>Modo Espelho / Refletor:</strong> Tela cheia com inversão horizontal para uso com suporte de vidro teleprompter e segundo celular.</li>
                  <li><strong>Janela Flutuante In-App:</strong> Painel flutuante arrastável para posicionar exatamente onde desejar.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
