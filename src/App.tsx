import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppRoute, Script, TeleprompterSettings, FloatingModeState } from './types';
import { StorageService } from './services/storage';
import { DEMO_SCRIPT, DEFAULT_SETTINGS } from './data/demoScript';
import { Header } from './components/common/Header';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { Dashboard } from './pages/Dashboard';
import { ScriptEditor } from './components/editor/ScriptEditor';
import { PrompterEngine } from './components/teleprompter/PrompterEngine';
import { CameraRecorder } from './components/camera/CameraRecorder';
import { FloatingHubPage } from './pages/FloatingHubPage';
import { SettingsPage } from './pages/SettingsPage';
import { FloatingPrompterWindow } from './components/floating/FloatingPrompterWindow';
import { FloatingReturnBanner } from './components/floating/FloatingReturnBanner';
import { FloatingInstructionsModal } from './components/floating/FloatingInstructionsModal';
import { NativeIOSBridge } from './services/nativeIosBridge';
import { EnvironmentDetector } from './services/environmentDetector';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [settings, setSettings] = useState<TeleprompterSettings>(DEFAULT_SETTINGS);
  const [lastOpenedScriptId, setLastOpenedScriptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Floating Mode States
  const [inAppFloatingScript, setInAppFloatingScript] = useState<Script | null>(null);
  const [floatingInitialPosition, setFloatingInitialPosition] = useState<number>(0);
  const [floatingInitialPlaying, setFloatingInitialPlaying] = useState<boolean>(false);
  const [persistedFloatingState, setPersistedFloatingState] = useState<FloatingModeState | null>(null);
  const [showReturnBanner, setShowReturnBanner] = useState<boolean>(false);
  const [instructionsModalScript, setInstructionsModalScript] = useState<Script | null>(null);

  // Load initial DB data & restore floating state
  useEffect(() => {
    async function loadData() {
      try {
        const [savedScripts, savedSettings, savedFloating] = await Promise.all([
          StorageService.getScripts(),
          StorageService.getSettings(),
          StorageService.getFloatingState(),
        ]);

        let currentScripts = savedScripts;
        if (savedScripts.length > 0) {
          setScripts(savedScripts);
          setActiveScript(savedScripts[0]);
          setLastOpenedScriptId(savedScripts[0].id);
        } else {
          // Initialize with demo script
          await StorageService.saveScript(DEMO_SCRIPT);
          currentScripts = [DEMO_SCRIPT];
          setScripts([DEMO_SCRIPT]);
          setActiveScript(DEMO_SCRIPT);
          setLastOpenedScriptId(DEMO_SCRIPT.id);
        }

        if (savedSettings) {
          setSettings(savedSettings);
        }

        // Restore floating state if active
        if (savedFloating && savedFloating.active) {
          setPersistedFloatingState(savedFloating);
          setShowReturnBanner(true);
          const target = currentScripts.find((s) => s.id === savedFloating.scriptId);
          if (target) {
            setActiveScript(target);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setScripts([DEMO_SCRIPT]);
        setActiveScript(DEMO_SCRIPT);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Listen for user returning to app (e.g. after using native iPhone Camera app)
  useEffect(() => {
    const checkFloatingReturn = async () => {
      const saved = await StorageService.getFloatingState();
      if (saved && saved.active) {
        setPersistedFloatingState(saved);
        setShowReturnBanner(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkFloatingReturn();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkFloatingReturn);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkFloatingReturn);
    };
  }, []);

  // Update Settings
  const handleUpdateSettings = useCallback(async (partial: Partial<TeleprompterSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      StorageService.saveSettings(updated).catch(console.error);
      return updated;
    });
  }, []);

  const handleResetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await StorageService.saveSettings(DEFAULT_SETTINGS);
  }, []);

  // Create new script
  const handleCreateScript = useCallback(async () => {
    const newScript: Script = {
      id: 'script_' + Date.now(),
      title: 'Novo Roteiro',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastPosition: 0,
      isFavorite: false,
      wordCount: 0,
      estimatedSeconds: 0,
    };

    await StorageService.saveScript(newScript);
    setScripts((prev) => [newScript, ...prev]);
    setActiveScript(newScript);
    setLastOpenedScriptId(newScript.id);
    setCurrentRoute('editor');
  }, []);

  // Save edited script
  const handleSaveScript = useCallback(async (updated: Script) => {
    await StorageService.saveScript(updated);
    setScripts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setActiveScript(updated);
    setLastOpenedScriptId(updated.id);
  }, []);

  // Duplicate script
  const handleDuplicateScript = useCallback(
    async (id: string) => {
      const source = scripts.find((s) => s.id === id);
      if (!source) return;

      const duplicated: Script = {
        ...source,
        id: 'script_' + Date.now(),
        title: `${source.title} (Cópia)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await StorageService.saveScript(duplicated);
      setScripts((prev) => [duplicated, ...prev]);
    },
    [scripts]
  );

  // Delete script
  const handleDeleteScript = useCallback(async (id: string) => {
    await StorageService.deleteScript(id);
    setScripts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Toggle favorite
  const handleToggleFavorite = useCallback(async (target: Script) => {
    const updated: Script = {
      ...target,
      isFavorite: !target.isFavorite,
      updatedAt: Date.now(),
    };
    await StorageService.saveScript(updated);
    setScripts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  // Navigation handlers
  const handleOpenScript = (script: Script) => {
    setActiveScript(script);
    setLastOpenedScriptId(script.id);
    setCurrentRoute('editor');
  };

  const handleStartPrompter = (script: Script, customPosition?: number) => {
    const targetScript =
      customPosition !== undefined ? { ...script, lastPosition: customPosition } : script;
    setActiveScript(targetScript);
    setLastOpenedScriptId(script.id);
    setCurrentRoute('teleprompter');
  };

  const handleStartCamera = (script: Script) => {
    setActiveScript(script);
    setLastOpenedScriptId(script.id);
    setCurrentRoute('camera');
  };

  // Launch Floating Mode
  const handleStartFloating = (
    script: Script,
    initialPos: number = 0,
    initialPlay: boolean = false
  ) => {
    const targetPos = initialPos || script.lastPosition || 0;

    // Persist active state in Storage
    const newState: FloatingModeState = {
      active: true,
      scriptId: script.id,
      scriptTitle: script.title,
      currentPosition: targetPos,
      scrollSpeed: settings.speed,
      fontSize: settings.fontSize,
      opacity: settings.backgroundOpacity,
      windowPosition: { x: 20, y: 55 },
      windowSize: 'medium',
      isPlaying: initialPlay,
      theme: 'dark',
      mirrored: settings.mirrorHorizontal,
      timestamp: Date.now(),
    };

    StorageService.saveFloatingState(newState);
    setPersistedFloatingState(newState);

    // Set active script & launch window
    setActiveScript(script);
    setFloatingInitialPosition(targetPos);
    setFloatingInitialPlaying(initialPlay);
    setInAppFloatingScript(script);

    // Attempt native PiP bridge on iOS if requested
    const caps = EnvironmentDetector.getCapabilities();
    if (caps.supportsPictureInPicture) {
      NativeIOSBridge.requestFloatingPrompter(script, settings, {
        onExit: () => {
          setShowReturnBanner(true);
        },
        onPlayPause: (playing) => {
          setFloatingInitialPlaying(playing);
        },
      }).catch(console.warn);
    }
  };

  // User requests Floating from Prompter Engine
  const handleEngineFloating = (pos: number, isPlaying: boolean) => {
    if (activeScript) {
      handleStartFloating(activeScript, pos, isPlaying);
      setCurrentRoute('dashboard');
    }
  };

  // Continue from return banner (restores previous state)
  const handleContinueFromReturn = () => {
    if (!persistedFloatingState) return;
    const targetScript = scripts.find((s) => s.id === persistedFloatingState.scriptId) || activeScript;
    if (targetScript) {
      const restored = {
        ...targetScript,
        lastPosition: persistedFloatingState.currentPosition,
      };
      setActiveScript(restored);
      setSettings((prev) => ({
        ...prev,
        speed: persistedFloatingState.scrollSpeed || prev.speed,
        fontSize: persistedFloatingState.fontSize || prev.fontSize,
      }));
      setShowReturnBanner(false);
      setCurrentRoute('teleprompter');
    }
  };

  // Dismiss / End floating mode
  const handleDismissReturn = async () => {
    setShowReturnBanner(false);
    NativeIOSBridge.stopFloatingPrompter();
    if (persistedFloatingState && activeScript) {
      const updated = {
        ...activeScript,
        lastPosition: persistedFloatingState.currentPosition,
        updatedAt: Date.now(),
      };
      await handleSaveScript(updated);
    }
    await StorageService.clearFloatingState();
    setPersistedFloatingState(null);
    setInAppFloatingScript(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-cyan-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Carregando Estúdio de Teleprompter...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Floating Return Banner (appears when returning to app) */}
      {showReturnBanner && persistedFloatingState && (
        <FloatingReturnBanner
          floatingState={persistedFloatingState}
          onContinue={handleContinueFromReturn}
          onDismiss={handleDismissReturn}
        />
      )}

      {/* Interactive Floating Prompter Window */}
      {inAppFloatingScript && (
        <FloatingPrompterWindow
          script={inAppFloatingScript}
          settings={settings}
          initialPosition={floatingInitialPosition}
          initialPlaying={floatingInitialPlaying}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => {
            setInAppFloatingScript(null);
            setShowReturnBanner(true);
          }}
          onReturnToApp={() => {
            setInAppFloatingScript(null);
            if (activeScript) {
              setCurrentRoute('teleprompter');
            }
          }}
          onPositionChange={(pos) => {
            if (persistedFloatingState) {
              setPersistedFloatingState((prev) => (prev ? { ...prev, currentPosition: pos } : null));
            }
          }}
        />
      )}

      {/* Instructions Modal */}
      {instructionsModalScript && (
        <FloatingInstructionsModal
          isOpen={!!instructionsModalScript}
          onClose={() => setInstructionsModalScript(null)}
          onStartFloating={() => {
            const s = instructionsModalScript;
            setInstructionsModalScript(null);
            handleStartFloating(s);
          }}
          onStartInAppCamera={() => {
            const s = instructionsModalScript;
            setInstructionsModalScript(null);
            handleStartCamera(s);
          }}
          scriptTitle={instructionsModalScript.title}
        />
      )}

      {/* Main Routing Layout */}
      {currentRoute === 'teleprompter' && activeScript ? (
        // Fullscreen Teleprompter Engine
        <div className="fixed inset-0 z-50 bg-black">
          <PrompterEngine
            script={activeScript}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onSavePosition={(pos) => {
              const updated = { ...activeScript, lastPosition: pos, updatedAt: Date.now() };
              handleSaveScript(updated);
            }}
            onExit={() => setCurrentRoute('dashboard')}
            onStartFloating={handleEngineFloating}
          />
        </div>
      ) : currentRoute === 'camera' && activeScript ? (
        // Fullscreen Camera Recorder Studio
        <div className="fixed inset-0 z-50 bg-black">
          <CameraRecorder
            script={activeScript}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onExit={() => setCurrentRoute('dashboard')}
          />
        </div>
      ) : (
        // Standard App Shell Layout with Header
        <>
          <Header
            currentRoute={currentRoute}
            onRouteChange={setCurrentRoute}
            showBack={currentRoute !== 'dashboard'}
            onBack={() => setCurrentRoute('dashboard')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
            {currentRoute === 'dashboard' && (
              <Dashboard
                scripts={scripts}
                lastOpenedScriptId={lastOpenedScriptId}
                settings={settings}
                onCreateScript={handleCreateScript}
                onOpenScript={handleOpenScript}
                onStartPrompter={handleStartPrompter}
                onStartCamera={handleStartCamera}
                onStartFloating={(s) => setInstructionsModalScript(s)}
                onDuplicateScript={handleDuplicateScript}
                onDeleteScript={handleDeleteScript}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {currentRoute === 'editor' && activeScript && (
              <ScriptEditor
                script={activeScript}
                settings={settings}
                onSave={handleSaveScript}
                onStartPrompter={handleStartPrompter}
                onStartCamera={handleStartCamera}
                onStartFloating={(s) => setInstructionsModalScript(s)}
              />
            )}

            {currentRoute === 'floating' && (
              <FloatingHubPage
                scripts={scripts}
                settings={settings}
                onStartInAppFloating={(s) => handleStartFloating(s)}
                onStartInAppCamera={(s) => handleStartCamera(s)}
              />
            )}

            {currentRoute === 'settings' && (
              <SettingsPage
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onResetSettings={handleResetSettings}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
