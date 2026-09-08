import React, { useState } from 'react';
import {
  Sliders,
  Type,
  Palette,
  Eye,
  RotateCcw,
  Sparkles,
  Smartphone,
  Mic,
  Monitor,
  Check,
  CheckCircle2
} from 'lucide-react';
import { TeleprompterSettings } from '../types';
import { DEFAULT_SETTINGS } from '../data/demoScript';
import { SystemSelfTest } from '../components/diagnostics/SystemSelfTest';

interface SettingsPageProps {
  settings: TeleprompterSettings;
  onUpdateSettings: (settings: Partial<TeleprompterSettings>) => void;
  onResetSettings: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'prompter' | 'diagnostics'>('visual');
  const [saveToast, setSaveToast] = useState(false);

  const triggerToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleSettingChange = (partial: Partial<TeleprompterSettings>) => {
    onUpdateSettings(partial);
    triggerToast();
  };

  const textColors = [
    { label: 'Branco Studio', hex: '#FFFFFF' },
    { label: 'Amarelo Cinema', hex: '#FDE047' },
    { label: 'Ciano Foco', hex: '#38BDF8' },
    { label: 'Verde Prompter', hex: '#4ADE80' },
    { label: 'Laranja Alto Contraste', hex: '#FB923C' },
  ];

  const bgColors = [
    { label: 'Preto Total', hex: '#000000' },
    { label: 'Ardósia Escura', hex: '#0F172A' },
    { label: 'Cinza Carvão', hex: '#18181B' },
  ];

  return (
    <div id="settings-page-container" className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ajustes & Personalização</h1>
          <p className="text-xs text-slate-400">
            Configure a tipografia, cores, velocidade e comportamento do teleprompter
          </p>
        </div>

        <button
          id="btn-reset-default-settings"
          onClick={() => {
            if (confirm('Restaurar todas as configurações para o padrão de estúdio?')) {
              onResetSettings();
              triggerToast();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Padrões</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-slate-900/90 p-1 border border-slate-800">
        <button
          id="tab-settings-visual"
          onClick={() => setActiveTab('visual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'visual'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Tipografia & Cores</span>
        </button>

        <button
          id="tab-settings-prompter"
          onClick={() => setActiveTab('prompter')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'prompter'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Comportamento & Leitura</span>
        </button>

        <button
          id="tab-settings-diagnostics"
          onClick={() => setActiveTab('diagnostics')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'diagnostics'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Bateria de Testes</span>
        </button>
      </div>

      {/* Tab 1: Visual Settings */}
      {activeTab === 'visual' && (
        <div className="space-y-4">
          {/* Live Preview Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 overflow-hidden shadow-xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Pré-visualização em Tempo Real
            </span>
            <div
              className="py-6 px-4 rounded-xl mx-auto transition-all"
              style={{
                backgroundColor: `${settings.backgroundColor}${Math.round((settings.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
                color: settings.textColor,
                fontSize: `${Math.min(48, settings.fontSize)}px`,
                lineHeight: settings.lineHeight,
                letterSpacing: `${settings.letterSpacing}px`,
                width: `${settings.textWidth}%`,
                textAlign: settings.textAlign,
                fontWeight: settings.fontWeight === 'bold' ? 700 : settings.fontWeight === 'semibold' ? 600 : 400,
                transform: `${settings.mirrorHorizontal ? 'scaleX(-1)' : ''} ${settings.mirrorVertical ? 'scaleY(-1)' : ''}`.trim(),
              }}
            >
              Exemplo de texto do Teleprompter Profissional. O olhar permanece conectado à câmera com total fluidez.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Font Size & Weight */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-300 font-semibold">Tamanho da Fonte:</span>
                  <strong className="text-cyan-400 font-mono text-sm">{settings.fontSize}px</strong>
                </div>
                <input
                  type="range"
                  min="16"
                  max="100"
                  value={settings.fontSize}
                  onChange={(e) => handleSettingChange({ fontSize: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Família da Fonte:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['sans', 'serif', 'mono', 'system'] as const).map((font) => (
                    <button
                      key={font}
                      onClick={() => handleSettingChange({ fontFamily: font })}
                      className={`py-1.5 text-xs rounded-xl capitalize font-medium transition ${
                        settings.fontFamily === font
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Peso da Fonte:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['normal', 'medium', 'semibold', 'bold'] as const).map((weight) => (
                    <button
                      key={weight}
                      onClick={() => handleSettingChange({ fontWeight: weight })}
                      className={`py-1.5 text-xs rounded-xl capitalize font-medium transition ${
                        settings.fontWeight === weight
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {weight}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Cor do Texto:</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {textColors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleSettingChange({ textColor: c.hex })}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border transition"
                      style={{
                        borderColor: settings.textColor === c.hex ? c.hex : 'rgba(255,255,255,0.1)',
                        backgroundColor: settings.textColor === c.hex ? `${c.hex}20` : 'transparent',
                        color: c.hex,
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Fundo:</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {bgColors.map((bg) => (
                    <button
                      key={bg.hex}
                      onClick={() => handleSettingChange({ backgroundColor: bg.hex })}
                      className={`px-3 py-1.5 rounded-xl text-xs border font-medium transition ${
                        settings.backgroundColor === bg.hex
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-300 font-semibold">Opacidade do Fundo:</span>
                  <strong className="text-cyan-400 font-mono text-sm">{settings.backgroundOpacity}%</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.backgroundOpacity}
                  onChange={(e) => handleSettingChange({ backgroundOpacity: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Prompter Behavior Settings */}
      {activeTab === 'prompter' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mirroring & Guides */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Espelhamento & Vidro</h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60">
              <div>
                <p className="text-xs font-semibold text-slate-200">Espelho Horizontal</p>
                <p className="text-[11px] text-slate-400">Inverte texto para refletor / beam splitter</p>
              </div>
              <input
                type="checkbox"
                checked={settings.mirrorHorizontal}
                onChange={(e) => handleSettingChange({ mirrorHorizontal: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60">
              <div>
                <p className="text-xs font-semibold text-slate-200">Linha Guia Central</p>
                <p className="text-[11px] text-slate-400">Exibe indicador da linha atual de leitura</p>
              </div>
              <input
                type="checkbox"
                checked={settings.guideLine}
                onChange={(e) => handleSettingChange({ guideLine: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60">
              <div>
                <p className="text-xs font-semibold text-slate-200">Modo Foco / Spotlight</p>
                <p className="text-[11px] text-slate-400">Escurece texto acima e abaixo da linha de leitura</p>
              </div>
              <input
                type="checkbox"
                checked={settings.focusMode}
                onChange={(e) => handleSettingChange({ focusMode: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Reading Pace & Audio */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ritmo & Automações</h3>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-300 font-semibold">Largura do Bloco de Leitura:</span>
                <strong className="text-cyan-400 font-mono text-sm">{settings.textWidth}%</strong>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={settings.textWidth}
                onChange={(e) => handleSettingChange({ textWidth: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60">
              <div>
                <p className="text-xs font-semibold text-slate-200">Manter Tela Acesa (Wake Lock)</p>
                <p className="text-[11px] text-slate-400">Impede que o dispositivo apague a tela durante a gravação</p>
              </div>
              <input
                type="checkbox"
                checked={settings.wakeLockEnabled}
                onChange={(e) => handleSettingChange({ wakeLockEnabled: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60">
              <div>
                <p className="text-xs font-semibold text-slate-200">Comandos por Voz</p>
                <p className="text-[11px] text-slate-400">Controle "começar", "pausar", "mais rápido" com a fala</p>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceControlEnabled}
                onChange={(e) => handleSettingChange({ voiceControlEnabled: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60">
              <div>
                <p className="text-xs font-semibold text-slate-200">Ocultar Marcadores de Direção</p>
                <p className="text-[11px] text-slate-400">Esconde tags como [PAUSA] durante a rolagem</p>
              </div>
              <input
                type="checkbox"
                checked={settings.hideMarkers}
                onChange={(e) => handleSettingChange({ hideMarkers: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <SystemSelfTest />
        </div>
      )}

      {/* Save indicator toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configurações salvas automaticamente</span>
        </div>
      )}
    </div>
  );
};
