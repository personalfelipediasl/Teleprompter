import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Play,
  Video,
  FileDown,
  Upload,
  ClipboardPaste,
  Clock,
  Sparkles,
  Check,
  Tag,
  Star,
  Layers
} from 'lucide-react';
import { Script, TeleprompterSettings } from '../../types';
import { countWords, calculateEstimatedSeconds, formatDuration, KNOWN_MARKERS } from '../../utils/textMetrics';

interface ScriptEditorProps {
  script: Script;
  settings: TeleprompterSettings;
  onSave: (updated: Script) => void;
  onStartPrompter: (script: Script) => void;
  onStartCamera: (script: Script) => void;
  onStartFloating?: (script: Script) => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  settings,
  onSave,
  onStartPrompter,
  onStartCamera,
  onStartFloating,
}) => {
  const [title, setTitle] = useState(script.title);
  const [content, setContent] = useState(script.content);
  const [project, setProject] = useState(script.project || '');
  const [isFavorite, setIsFavorite] = useState(script.isFavorite);
  const [wpm, setWpm] = useState(settings.wordsPerMinute || 130);
  const [isSaved, setIsSaved] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Salvo');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<any>(null);

  const wordCount = countWords(content);
  const estimatedSeconds = calculateEstimatedSeconds(wordCount, wpm);

  // Trigger auto-save on change
  useEffect(() => {
    setIsSaved(false);
    clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      const updated: Script = {
        ...script,
        title: title.trim() || 'Roteiro sem título',
        content,
        project: project.trim() || undefined,
        isFavorite,
        wordCount,
        estimatedSeconds,
        updatedAt: Date.now(),
      };
      onSave(updated);
      setIsSaved(true);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    return () => clearTimeout(autoSaveTimerRef.current);
  }, [title, content, project, isFavorite, wordCount, estimatedSeconds, onSave, script]);

  // Insert Marker at cursor
  const insertMarker = (marker: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const markerText = `\n[${marker}]\n`;

    const newContent = content.substring(0, start) + markerText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + markerText.length, start + markerText.length);
    }, 0);
  };

  // Import TXT
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        if (!title || title === 'Novo Roteiro' || title === 'Roteiro sem título') {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export TXT
  const handleExportTxt = () => {
    const blob = new Blob([`${title}\n\n${content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = (title || 'roteiro').toLowerCase().replace(/[^a-z0-9]/g, '-');
    a.download = `${cleanName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Paste clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContent((prev) => (prev ? `${prev}\n\n${text}` : text));
      }
    } catch (err) {
      alert('Permissão de colagem não concedida pelo navegador.');
    }
  };

  const currentScript: Script = {
    ...script,
    title,
    content,
    project,
    isFavorite,
    wordCount,
    estimatedSeconds,
  };

  return (
    <div id="script-editor-container" className="max-w-5xl mx-auto space-y-4 pb-20">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        {/* Title Input & Favorite Star */}
        <div className="flex items-center gap-2 flex-1">
          <button
            id="btn-toggle-favorite-editor"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-xl border transition ${
              isFavorite
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <input
            id="input-script-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do Roteiro..."
            className="flex-1 bg-transparent text-lg sm:text-xl font-bold text-white placeholder-slate-500 focus:outline-none border-b border-transparent focus:border-cyan-500 transition px-1 py-0.5"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onStartFloating && (
            <button
              id="btn-editor-start-floating"
              onClick={() => onStartFloating(currentScript)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/20 active:scale-95 transition"
              title="Ativar Modo Flutuante (usar junto com a Câmera nativa do iPhone)"
            >
              <Layers className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>FLUTUAR</span>
            </button>
          )}

          <button
            id="btn-editor-start-prompter"
            onClick={() => onStartPrompter(currentScript)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 active:scale-95 transition"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
            <span>Teleprompter</span>
          </button>

          <button
            id="btn-editor-start-camera"
            onClick={() => onStartCamera(currentScript)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 active:scale-95 transition"
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gravar no App</span>
          </button>
        </div>
      </div>

      {/* Stats and Formatting Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300">
        {/* Left: Auto-save & Word metrics */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400">
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400/90 font-medium">Salvo às {lastSavedTime}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[11px] text-amber-400 font-medium">Salvando...</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Palavras:</span>
            <strong className="text-white font-mono">{wordCount}</strong>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tempo estimado:</span>
            <strong className="font-mono font-bold">{formatDuration(estimatedSeconds)}</strong>
          </div>

          {/* WPM selector */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Ritmo:</span>
            <select
              value={wpm}
              onChange={(e) => setWpm(parseInt(e.target.value))}
              className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-xs focus:outline-none"
            >
              {[80, 100, 120, 130, 140, 160, 180, 200].map((rate) => (
                <option key={rate} value={rate}>
                  {rate} ppm
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Import / Export / Project Tag */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.md"
            className="hidden"
          />

          <button
            id="btn-import-txt"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Importar arquivo TXT"
          >
            <Upload className="w-4 h-4" />
          </button>

          <button
            id="btn-paste-clipboard"
            onClick={handlePasteClipboard}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Colar texto da área de transferência"
          >
            <ClipboardPaste className="w-4 h-4" />
          </button>

          <button
            id="btn-export-txt"
            onClick={handleExportTxt}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Exportar como TXT"
          >
            <FileDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Markers Quick Insertion Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Marcadores:
        </span>
        {KNOWN_MARKERS.map((m) => (
          <button
            key={m}
            onClick={() => insertMarker(m)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-mono text-xs whitespace-nowrap active:scale-95 transition"
          >
            + [{m}]
          </button>
        ))}
      </div>

      {/* Main Textarea */}
      <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <textarea
          ref={textareaRef}
          id="textarea-script-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Digite ou cole aqui o seu roteiro para o teleprompter... Insira marcadores como [PAUSA] ou [ÊNFASE] para guiar a fala."
          className="w-full min-h-[460px] p-6 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-base sm:text-lg leading-relaxed resize-y font-sans"
        />
      </div>
    </div>
  );
};
