import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, CheckCircle2, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Modal } from './Modal';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'ios' | 'android'>('ios');

  if (isInstalled) {
    return (
      <div
        id="badge-pwa-installed"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-medium"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>PWA Instalado</span>
      </div>
    );
  }

  const openGuide = (platform: 'ios' | 'android') => {
    setGuidePlatform(platform);
    setShowGuideModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isInstallable && (
          <button
            id="btn-pwa-install"
            onClick={install}
            className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-900/30 transition active:scale-95 ${
              compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Instalar App</span>
          </button>
        )}

        {/* Fallback button for iOS or whenever native prompt is not directly available */}
        {(!isInstallable || isIOS) && (
          <button
            id="btn-pwa-install-guide"
            onClick={() => openGuide(isIOS ? 'ios' : 'android')}
            className={`flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-medium transition active:scale-95 ${
              compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
            }`}
            title="Instalar no celular"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isIOS ? 'Instalar no iOS' : 'Como Instalar'}</span>
          </button>
        )}
      </div>

      {/* Installation Guide Modal */}
      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title={guidePlatform === 'ios' ? 'Instalar no iPhone / iPad' : 'Instalar no Android'}
      >
        <div className="space-y-4 text-slate-300 text-sm">
          {guidePlatform === 'ios' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex gap-3 items-start">
                <Share className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-100 mb-1">Passo 1: Menu Compartilhar</p>
                  <p className="text-xs text-slate-400">
                    Abra o aplicativo no <strong>Safari</strong> e toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima) na barra inferior do navegador.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex gap-3 items-start">
                <PlusSquare className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-100 mb-1">Passo 2: Adicionar à Tela de Início</p>
                  <p className="text-xs text-slate-400">
                    Role a lista de opções para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-100 mb-1">Passo 3: Concluir</p>
                  <p className="text-xs text-slate-400">
                    Toque em <strong>"Adicionar"</strong> no canto superior direito. O Teleprompter será instalado como um app independente, com tela cheia e acesso offline!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
                <p className="font-medium text-slate-100 mb-1">No Google Chrome ou Edge (Android):</p>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400 mt-2">
                  <li>Toque no menu de <strong>três pontos (⋮)</strong> no canto superior direito.</li>
                  <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  <li>Confirme tocando em <strong>"Instalar"</strong>.</li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 text-xs text-slate-400">
                O aplicativo passará a funcionar com inicialização instantânea, suporte a tela cheia e armazenamento offline dos seus roteiros.
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              id="btn-close-pwa-guide"
              onClick={() => setShowGuideModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
