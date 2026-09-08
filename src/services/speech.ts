export type VoiceCommand =
  | 'start'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'faster'
  | 'slower'
  | 'restart';

export interface SpeechServiceListener {
  onCommand: (cmd: VoiceCommand, phrase: string) => void;
  onListeningChange: (isListening: boolean) => void;
  onError: (error: string) => void;
}

export class SpeechRecognitionService {
  private static recognition: any = null;
  private static isListening = false;
  private static listeners: Set<SpeechServiceListener> = new Set();
  private static restartTimer: any = null;
  private static continuousMode = true;

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public static subscribe(listener: SpeechServiceListener): () => void {
    this.listeners.add(listener);
    listener.onListeningChange(this.isListening);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  public static start(): boolean {
    if (!this.isSupported()) {
      this.notifyError('Comando por voz não suportado neste navegador.');
      return false;
    }

    if (this.isListening && this.recognition) {
      return true;
    }

    try {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      const rec = new SpeechRecognitionConstructor();
      rec.lang = 'pt-BR';
      rec.continuous = true;
      rec.interimResults = false;
      rec.maxAlternatives = 2;

      rec.onstart = () => {
        this.isListening = true;
        this.notifyListening(true);
      };

      rec.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            this.processTranscript(transcript);
          }
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition warning:', event.error);
        }
        if (event.error === 'not-allowed') {
          this.notifyError('Permissão de microfone negada para comandos de voz.');
          this.stop();
        }
      };

      rec.onend = () => {
        this.isListening = false;
        this.notifyListening(false);
        // Auto restart if still desired
        if (this.continuousMode && this.listeners.size > 0) {
          clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.continuousMode && this.listeners.size > 0) {
              try {
                rec.start();
              } catch (e) {
                // Ignore transient restarts
              }
            }
          }, 300);
        }
      };

      rec.start();
      this.recognition = rec;
      return true;
    } catch (err: any) {
      console.warn('Could not start speech recognition:', err);
      this.notifyError('Falha ao iniciar reconhecimento de voz.');
      return false;
    }
  }

  public static stop(): void {
    this.continuousMode = false;
    clearTimeout(this.restartTimer);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Safe ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
    this.notifyListening(false);
  }

  private static processTranscript(text: string) {
    let command: VoiceCommand | null = null;

    if (text.includes('começar') || text.includes('iniciar')) {
      command = 'start';
    } else if (text.includes('pausar') || text.includes('pausa')) {
      command = 'pause';
    } else if (text.includes('continuar') || text.includes('prosseguir') || text.includes('retomar')) {
      command = 'resume';
    } else if (text.includes('parar') || text.includes('pare')) {
      command = 'stop';
    } else if (text.includes('mais rápido') || text.includes('acelerar') || text.includes('rápido')) {
      command = 'faster';
    } else if (text.includes('mais devagar') || text.includes('desacelerar') || text.includes('devagar')) {
      command = 'slower';
    } else if (text.includes('reiniciar') || text.includes('recomeçar') || text.includes('voltar ao início')) {
      command = 'restart';
    }

    if (command) {
      this.listeners.forEach((l) => l.onCommand(command as VoiceCommand, text));
    }
  }

  private static notifyListening(isListening: boolean) {
    this.listeners.forEach((l) => l.onListeningChange(isListening));
  }

  private static notifyError(err: string) {
    this.listeners.forEach((l) => l.onError(err));
  }
}
