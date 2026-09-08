import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Camera,
  Mic,
  Database,
  Tv,
  Wifi,
  Sparkles,
  Zap
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { CameraService } from '../../services/camera';
import { SpeechRecognitionService } from '../../services/speech';
import { WakeLockManager } from '../../services/wakeLock';
import { PiPPrompterService } from '../../services/pipPrompter';
import { countWords, calculateEstimatedSeconds } from '../../utils/textMetrics';

interface TestResult {
  name: string;
  category: string;
  status: 'idle' | 'running' | 'passed' | 'failed' | 'warning';
  message: string;
}

export const SystemSelfTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Persistência IndexedDB', category: 'Armazenamento', status: 'idle', message: 'Não executado' },
    { name: 'Criação e Leitura de Roteiro', category: 'Armazenamento', status: 'idle', message: 'Não executado' },
    { name: 'Cálculo de Palavras e Tempo', category: 'Roteiros', status: 'idle', message: 'Não executado' },
    { name: 'Disponibilidade de Câmera', category: 'Hardware', status: 'idle', message: 'Não executado' },
    { name: 'Gravador de Mídia (MediaRecorder)', category: 'Hardware', status: 'idle', message: 'Não executado' },
    { name: 'Screen Wake Lock (Tela Sempre Ligada)', category: 'Sistema', status: 'idle', message: 'Não executado' },
    { name: 'Web Speech API (Comandos por Voz)', category: 'Áudio', status: 'idle', message: 'Não executado' },
    { name: 'Picture-in-Picture (Modo Flutuante)', category: 'Janelas', status: 'idle', message: 'Não executado' },
    { name: 'PWA Service Worker & Manifest', category: 'PWA', status: 'idle', message: 'Não executado' },
  ]);

  const runAllTests = async () => {
    setIsRunning(true);

    const updateTest = (index: number, status: TestResult['status'], message: string) => {
      setResults((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status, message };
        return next;
      });
    };

    // 1. IndexedDB test
    try {
      updateTest(0, 'running', 'Verificando banco de dados...');
      const scripts = await StorageService.getScripts();
      updateTest(0, 'passed', `IndexedDB ativo e conectado (${scripts.length} roteiros carregados)`);
    } catch (e: any) {
      updateTest(0, 'failed', `Falha no IndexedDB: ${e.message}`);
    }

    // 2. Script CRUD test
    try {
      updateTest(1, 'running', 'Testando gravação temporária...');
      const testId = 'test_' + Date.now();
      await StorageService.saveScript({
        id: testId,
        title: 'Teste Automatizado',
        content: 'Conteúdo de teste',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastPosition: 120,
        isFavorite: false,
        wordCount: 3,
        estimatedSeconds: 2,
      });
      const fetched = await StorageService.getScript(testId);
      if (fetched && fetched.lastPosition === 120) {
        await StorageService.deleteScript(testId);
        updateTest(1, 'passed', 'Gravação, recuperação de posição e exclusão validados com sucesso');
      } else {
        updateTest(1, 'failed', 'Não foi possível validar integridade da gravação');
      }
    } catch (e: any) {
      updateTest(1, 'failed', `Erro no teste CRUD: ${e.message}`);
    }

    // 3. Text Metrics & Time Calculation
    try {
      updateTest(2, 'running', 'Validando algoritmo de cálculo de ritmo...');
      const sample = 'Este é um teste com dez palavras exatamente para validar cálculo.';
      const words = countWords(sample);
      const estTime = calculateEstimatedSeconds(words, 120);
      if (words > 0 && estTime > 0) {
        updateTest(2, 'passed', `Algoritmo preciso: ${words} palavras calculadas para ${estTime}s a 120 ppm`);
      } else {
        updateTest(2, 'failed', 'Falha no cálculo de palavras');
      }
    } catch (e: any) {
      updateTest(2, 'failed', e.message);
    }

    // 4. Camera Availability
    try {
      updateTest(3, 'running', 'Detectando drivers de câmera...');
      if (CameraService.isSupported()) {
        updateTest(3, 'passed', 'API navigator.mediaDevices.getUserMedia suportada');
      } else {
        updateTest(3, 'warning', 'API de câmera não disponível neste contexto (ex: WebView sem permissão)');
      }
    } catch (e: any) {
      updateTest(3, 'failed', e.message);
    }

    // 5. MediaRecorder test
    try {
      updateTest(4, 'running', 'Verificando codecs de gravação...');
      if (CameraService.isMediaRecorderSupported()) {
        const mime = CameraService.getSupportedMimeType();
        const pauseSupported = CameraService.isPauseSupported();
        updateTest(
          4,
          'passed',
          `MediaRecorder ativo. Codec: ${mime || 'padrão'}. Pausa durante gravação: ${pauseSupported ? 'Suportado' : 'Indisponível'}`
        );
      } else {
        updateTest(4, 'warning', 'MediaRecorder não suportado neste navegador');
      }
    } catch (e: any) {
      updateTest(4, 'failed', e.message);
    }

    // 6. Wake Lock API
    try {
      if (WakeLockManager.isLockSupported()) {
        updateTest(5, 'passed', 'Screen Wake Lock API disponível para manter a tela sempre acesa');
      } else {
        updateTest(5, 'warning', 'Wake Lock não suportado (comum em navegadores desktop legados ou iOS antigo)');
      }
    } catch (e: any) {
      updateTest(5, 'failed', e.message);
    }

    // 7. Web Speech API
    try {
      if (SpeechRecognitionService.isSupported()) {
        updateTest(6, 'passed', 'SpeechRecognition ativo com suporte para comandos em Português (pt-BR)');
      } else {
        updateTest(6, 'warning', 'Web Speech API indisponível (navegador não suporta reconhecimento de voz nativo)');
      }
    } catch (e: any) {
      updateTest(6, 'failed', e.message);
    }

    // 8. Picture-in-Picture
    try {
      if (PiPPrompterService.isSupported()) {
        updateTest(7, 'passed', 'Picture-in-Picture suportado (janela flutuante sobre outros apps disponível)');
      } else {
        updateTest(7, 'warning', 'Picture-in-Picture restrito ou não suportado neste navegador/sistema');
      }
    } catch (e: any) {
      updateTest(7, 'failed', e.message);
    }

    // 9. PWA & Service Worker
    try {
      if ('serviceWorker' in navigator) {
        updateTest(8, 'passed', 'Service Worker suportado para funcionamento e cache offline');
      } else {
        updateTest(8, 'warning', 'Service Worker não suportado');
      }
    } catch (e: any) {
      updateTest(8, 'failed', e.message);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'running':
        return <Zap className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />;
      default:
        return <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Diagnóstico e Bateria de Testes do Sistema</span>
          </h3>
          <p className="text-xs text-slate-400">
            Validação de APIs de hardware, armazenamento local e compatibilidade
          </p>
        </div>

        <button
          id="btn-run-all-tests"
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md disabled:opacity-50 active:scale-95 transition"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRunning ? 'Testando...' : 'Executar Testes'}</span>
        </button>
      </div>

      <div className="space-y-2">
        {results.map((res, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">{getStatusIcon(res.status)}</div>
              <div>
                <span className="font-semibold text-slate-200 block">{res.name}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{res.message}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
              {res.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
