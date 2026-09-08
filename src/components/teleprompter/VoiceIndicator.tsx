import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Check, AlertCircle } from 'lucide-react';
import { SpeechRecognitionService, VoiceCommand } from '../../services/speech';

interface VoiceIndicatorProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onCommandReceived: (cmd: VoiceCommand) => void;
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  enabled,
  onToggle,
  onCommandReceived,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSupported = SpeechRecognitionService.isSupported();

  useEffect(() => {
    if (!enabled || !isSupported) {
      SpeechRecognitionService.stop();
      setIsListening(false);
      return;
    }

    const unsubscribe = SpeechRecognitionService.subscribe({
      onCommand: (cmd, phrase) => {
        setLastCommand(`Comando: "${phrase}"`);
        onCommandReceived(cmd);
        setTimeout(() => setLastCommand(null), 3000);
      },
      onListeningChange: (listening) => {
        setIsListening(listening);
      },
      onError: (err) => {
        setError(err);
        setTimeout(() => setError(null), 4000);
      },
    });

    SpeechRecognitionService.start();

    return () => {
      unsubscribe();
    };
  }, [enabled, isSupported, onCommandReceived]);

  if (!isSupported) {
    return null; // Gracefully hidden when Web Speech API not supported on system
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        id="btn-toggle-voice"
        onClick={() => onToggle(!enabled)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
          enabled && isListening
            ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-sm shadow-cyan-500/20'
            : enabled
            ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
        }`}
        title={
          enabled
            ? 'Voz ativa (Diga "começar", "pausar", "mais rápido", "mais devagar")'
            : 'Ativar controle por voz'
        }
      >
        {enabled ? (
          <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-pulse text-cyan-400' : 'text-amber-400'}`} />
        ) : (
          <MicOff className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">
          {enabled ? (isListening ? 'Voz Ativa' : 'Ouvindo...') : 'Voz'}
        </span>
      </button>

      {/* Floating feedback message */}
      {lastCommand && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-cyan-950 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-90">
          <Check className="w-3 h-3 text-cyan-400" />
          <span>{lastCommand}</span>
        </div>
      )}

      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-red-950 border border-red-500/40 text-red-300 rounded-lg text-xs font-semibold shadow-xl flex items-center gap-1.5 animate-in fade-in">
          <AlertCircle className="w-3 h-3 text-red-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
