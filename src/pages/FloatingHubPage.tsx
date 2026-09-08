import React, { useState } from 'react';
import {
  Layers,
  Apple,
  Camera,
  Play,
  Video,
  Info,
  Sliders,
  CheckCircle2,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { Script, TeleprompterSettings } from '../types';
import { EnvironmentDetector } from '../services/environmentDetector';
import { FloatingInstructionsModal } from '../components/floating/FloatingInstructionsModal';

interface FloatingHubPageProps {
  scripts: Script[];
  settings: TeleprompterSettings;
  onStartInAppFloating: (script: Script) => void;
  onStartInAppCamera?: (script: Script) => void;
}

export const FloatingHubPage: React.FC<FloatingHubPageProps> = ({
  scripts,
  settings,
  onStartInAppFloating,
  onStartInAppCamera,
}) => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>(scripts[0]?.id || '');
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);

  const selectedScript = scripts.find((s) => s.id === selectedScriptId) || scripts[0];
  const deviceStatus = EnvironmentDetector.getDeviceStatusSummary();

  return (
    <div id="floating-hub-container" className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Apple className="w-4 h-4" />
          <span>Focado em iPhone & iOS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Layers className="w-7 h-7 text-cyan-400" />
          <span>Modo Teleprompter Flutuante</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl">
          Grave seus vídeos utilizando a <strong>Câmera Nativa do iPhone</strong> enquanto lê seu roteiro em uma janela persistente posicionada junto à lente.
        </p>
      </div>

      {/* iPhone Device Capability Badge */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{deviceStatus}</span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold shrink-0">
          iOS Ready
        </span>
      </div>

      {/* Script Selector Card */}
      {selectedScript && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                Roteiro Selecionado
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">{selectedScript.title}</h2>
            </div>

            <select
              value={selectedScriptId}
              onChange={(e) => setSelectedScriptId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
            >
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.wordCount} palavras)
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 line-clamp-3 leading-relaxed">
            {selectedScript.content.replace(/\[.*?\]/g, '').trim()}
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* 1. Main Floating Mode for iPhone Camera */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-blue-950/40 border border-cyan-500/40 flex flex-col justify-between space-y-3 shadow-lg">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-sm mb-1">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Modo Flutuante iPhone</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Permite sair do app e abrir a Câmera nativa do iPhone, mantendo o teleprompter visível próximo à lente para manter contato visual perfeito.
                </p>
              </div>

              <button
                id="btn-hub-start-floating"
                onClick={() => onStartInAppFloating(selectedScript)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/30 transition active:scale-95"
              >
                <Layers className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>ATIVAR MODO FLUTUAR</span>
              </button>

              <button
                onClick={() => setShowInstructionsModal(true)}
                className="w-full text-center text-[11px] text-slate-400 hover:text-cyan-300 transition py-1"
              >
                Ver instruções do Picture-in-Picture
              </button>
            </div>

            {/* 2. In-App Camera Studio Fallback */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-slate-200 font-bold text-sm mb-1">
                  <Video className="w-4 h-4 text-cyan-400" />
                  <span>Gravar no App (Câmera Integrada)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Grave vídeos diretamente dentro do aplicativo com preview da câmera frontal do iPhone em tela cheia e teleprompter sobreposto.
                </p>
              </div>

              <button
                id="btn-hub-start-camera-studio"
                onClick={() => {
                  if (onStartInAppCamera) {
                    onStartInAppCamera(selectedScript);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition active:scale-95 border border-slate-600"
              >
                <Camera className="w-4 h-4 text-cyan-300" />
                <span>GRAVAR NO APP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Instructions Modal */}
      {selectedScript && (
        <FloatingInstructionsModal
          isOpen={showInstructionsModal}
          onClose={() => setShowInstructionsModal(false)}
          onStartFloating={() => onStartInAppFloating(selectedScript)}
          onStartInAppCamera={() => {
            if (onStartInAppCamera) {
              onStartInAppCamera(selectedScript);
            }
          }}
          scriptTitle={selectedScript.title}
        />
      )}
    </div>
  );
};
