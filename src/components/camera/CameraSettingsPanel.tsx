import React from 'react';
import {
  Camera,
  Mic,
  Sliders,
  Grid3X3,
  Focus,
  Maximize2,
  Smartphone,
  Monitor,
  Square as SquareIcon,
  X,
  Type,
  Gauge,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CameraResolution, CameraAspectRatio, CompositionGuide } from '../../services/camera';

interface CameraSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Video settings
  resolution: CameraResolution;
  onResolutionChange: (res: CameraResolution) => void;
  aspectRatio: CameraAspectRatio;
  onAspectRatioChange: (ratio: CameraAspectRatio) => void;
  compositionGuide: CompositionGuide;
  onCompositionGuideChange: (guide: CompositionGuide) => void;
  // Device selections
  videoDevices: MediaDeviceInfo[];
  selectedVideoDeviceId: string;
  onVideoDeviceChange: (deviceId: string) => void;
  audioDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string;
  onAudioDeviceChange: (deviceId: string) => void;
  // Prompter overlay settings
  showPrompter: boolean;
  onToggleShowPrompter: () => void;
  overlayOpacity: number;
  onOverlayOpacityChange: (opacity: number) => void;
  overlayWidth: number;
  onOverlayWidthChange: (width: number) => void;
  overlayPosition: 'top' | 'center' | 'bottom';
  onOverlayPositionChange: (pos: 'top' | 'center' | 'bottom') => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  autoScrollOnRecord: boolean;
  onToggleAutoScrollOnRecord: () => void;
  countdownSeconds: number;
  onCountdownSecondsChange: (seconds: number) => void;
  isRecording: boolean;
}

export const CameraSettingsPanel: React.FC<CameraSettingsPanelProps> = ({
  isOpen,
  onClose,
  resolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  compositionGuide,
  onCompositionGuideChange,
  videoDevices,
  selectedVideoDeviceId,
  onVideoDeviceChange,
  audioDevices,
  selectedAudioDeviceId,
  onAudioDeviceChange,
  showPrompter,
  onToggleShowPrompter,
  overlayOpacity,
  onOverlayOpacityChange,
  overlayWidth,
  onOverlayWidthChange,
  overlayPosition,
  onOverlayPositionChange,
  fontSize,
  onFontSizeChange,
  speed,
  onSpeedChange,
  autoScrollOnRecord,
  onToggleAutoScrollOnRecord,
  countdownSeconds,
  onCountdownSecondsChange,
  isRecording,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="camera-settings-drawer"
      className="absolute top-16 right-4 z-50 w-84 max-w-[calc(100vw-32px)] max-h-[82vh] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl p-4 rounded-3xl border border-slate-800 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Controles da Câmera
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* Aspect Ratio / Formato de Orientação */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Formato & Orientação
          </label>
          <div className="grid grid-cols-5 gap-1">
            {[
              { id: 'free', label: 'Cheia', icon: Maximize2 },
              { id: '16:9', label: '16:9', icon: Monitor },
              { id: '9:16', label: '9:16', icon: Smartphone },
              { id: '1:1', label: '1:1', icon: SquareIcon },
              { id: '4:3', label: '4:3', icon: Layers },
            ].map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = aspectRatio === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => onAspectRatioChange(fmt.id as CameraAspectRatio)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl font-medium transition ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-900/90 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{fmt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resolução de Captura */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Resolução de Captura
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'auto', label: 'Auto' },
              { id: '720p', label: '720p HD' },
              { id: '1080p', label: '1080p FHD' },
              { id: '4k', label: '4K UHD' },
            ].map((res) => (
              <button
                key={res.id}
                disabled={isRecording}
                onClick={() => onResolutionChange(res.id as CameraResolution)}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-semibold uppercase transition disabled:opacity-40 ${
                  resolution === res.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {res.label}
              </button>
            ))}
          </div>
          {isRecording && (
            <p className="text-[10px] text-amber-400/80 mt-1">
              * A resolução não pode ser alterada durante a gravação ativa.
            </p>
          )}
        </div>

        {/* Guias de Composição */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Guias de Composição & Olhar
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'none', label: 'Desativado' },
              { id: 'rule-of-thirds', label: 'Terços (3x3)' },
              { id: 'crosshair', label: 'Foco Central' },
              { id: 'safe-margins', label: 'Margem Segura' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => onCompositionGuideChange(g.id as CompositionGuide)}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-medium transition text-center ${
                  compositionGuide === g.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dispositivos de Câmera e Áudio (Se múltiplos existirem) */}
        {videoDevices.length > 1 && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Selecionar Lente / Câmera
            </label>
            <select
              value={selectedVideoDeviceId}
              onChange={(e) => onVideoDeviceChange(e.target.value)}
              disabled={isRecording}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-xl text-xs focus:outline-none focus:border-cyan-400"
            >
              {videoDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `Câmera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {audioDevices.length > 1 && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Microfone de Entrada
            </label>
            <select
              value={selectedAudioDeviceId}
              onChange={(e) => onAudioDeviceChange(e.target.value)}
              disabled={isRecording}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-xl text-xs focus:outline-none focus:border-cyan-400"
            >
              {audioDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `Microfone ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Contagem regressiva antes de gravar */}
        <div className="border-t border-slate-800/80 pt-3">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Contagem Regressiva Pré-Gravação
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { sec: 0, label: 'Desativada' },
              { sec: 3, label: '3 seg' },
              { sec: 5, label: '5 seg' },
              { sec: 10, label: '10 seg' },
            ].map((c) => (
              <button
                key={c.sec}
                onClick={() => onCountdownSecondsChange(c.sec)}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-medium transition ${
                  countdownSeconds === c.sec
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seção de Ajustes do Teleprompter Sobreposto */}
        <div className="border-t border-slate-800/80 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Teleprompter em Camada
            </span>
            <button
              onClick={onToggleShowPrompter}
              className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition ${
                showPrompter
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {showPrompter ? 'Visível' : 'Oculto'}
            </button>
          </div>

          {showPrompter && (
            <>
              {/* Posição vertical */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Posição na Tela (Alinhamento do Olhar):
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => onOverlayPositionChange(pos)}
                      className={`py-1 text-[10px] rounded-lg uppercase font-bold transition ${
                        overlayPosition === pos
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {pos === 'top' ? 'Topo (Lente)' : pos === 'center' ? 'Centro' : 'Base'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacidade do Fundo */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Transparência do Fundo</span>
                  <span className="text-cyan-400 font-bold">{overlayOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="95"
                  value={overlayOpacity}
                  onChange={(e) => onOverlayOpacityChange(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Largura do Texto */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Largura da Faixa</span>
                  <span className="text-cyan-400 font-bold">{overlayWidth}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="98"
                  value={overlayWidth}
                  onChange={(e) => onOverlayWidthChange(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Tamanho da Fonte & Velocidade */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Tamanho</span>
                    <span className="text-cyan-400 font-bold">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="64"
                    value={fontSize}
                    onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Velocidade</span>
                    <span className="text-cyan-400 font-bold">{speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.1"
                    value={speed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Auto Scroll ao Iniciar Gravação */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-300">
                  Rolar texto ao iniciar gravação
                </span>
                <input
                  type="checkbox"
                  checked={autoScrollOnRecord}
                  onChange={onToggleAutoScrollOnRecord}
                  className="rounded accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
