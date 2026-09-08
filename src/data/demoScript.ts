import { Script, TeleprompterSettings } from '../types';

export const DEFAULT_SETTINGS: TeleprompterSettings = {
  speed: 1.0,
  fontSize: 44,
  fontFamily: 'sans',
  fontWeight: 'medium',
  textAlign: 'center',
  lineHeight: 1.6,
  letterSpacing: 0,
  textWidth: 80,
  textColor: '#FFFFFF',
  backgroundColor: '#000000',
  backgroundOpacity: 90,
  mirrorHorizontal: false,
  mirrorVertical: false,
  guideLine: true,
  guideLinePosition: 40,
  focusMode: true,
  highlightCurrentLine: false,
  hideMarkers: false,
  countdownDuration: 3,
  initialDelay: 0,
  wordsPerMinute: 130,
  wakeLockEnabled: true,
  vibrateOnAction: true,
  voiceControlEnabled: false,
  shortcuts: {
    playPause: ' ',
    speedUp: 'ArrowUp',
    speedDown: 'ArrowDown',
    jumpBack: 'ArrowLeft',
    jumpForward: 'ArrowRight',
    restart: 'KeyR',
    fullscreen: 'KeyF',
    mirror: 'KeyM',
  },
};

export const DEMO_SCRIPT: Script = {
  id: 'demo-script-1',
  title: 'Meu primeiro vídeo',
  content: `[INTRO]
Olá! Seja muito bem-vindo ao Teleprompter Profissional.

Este é um roteiro de demonstração especialmente preparado para você testar todas as funcionalidades do aplicativo antes da sua gravação oficial.

[PAUSA]

Observe como a rolagem deste texto é extremamente suave, sem saltos e sem travamentos. O motor de rolagem foi desenvolvido com precisão sub-pixel para garantir que seu olhar permaneça natural em frente à lente da câmera.

[ÊNFASE]
Você tem controle total sobre esta leitura:
1. Ajuste a velocidade da rolagem através dos botões ou deslizando o controle na barra inferior.
2. Toque na tela para pausar ou continuar a qualquer instante.
3. Se estiver usando um espelho refletivo profissional, ative o Modo Espelho Horizontal.

[PAUSA]

Para gravar este conteúdo enquanto lê, basta abrir o Modo Câmera. O texto deslizará suavemente sobre a imagem do seu rosto, permitindo contato visual direto com o seu público.

Você também pode ativar o comando por voz falando "mais rápido", "mais devagar" ou "pausar".

[CTA]
Experimente agora mesmo: toque no botão de gravação ou personalize o tamanho da fonte e cores como desejar!

[FINAL]
Tenha uma excelente gravação e até o próximo vídeo!`,
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now(),
  lastPosition: 0,
  isFavorite: true,
  project: 'Demonstrações',
  wordCount: 184,
  estimatedSeconds: 85,
};
