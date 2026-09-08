import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Star,
  Clock,
  FileText,
  Play,
  Video,
  Copy,
  Trash2,
  Edit3,
  Tv,
  ArrowRight,
  FolderOpen,
  Sparkles,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { Script, ScriptCategory, TeleprompterSettings } from '../types';
import { formatDuration } from '../utils/textMetrics';
import { Modal } from '../components/common/Modal';

interface DashboardProps {
  scripts: Script[];
  lastOpenedScriptId: string | null;
  settings: TeleprompterSettings;
  onCreateScript: () => void;
  onOpenScript: (script: Script) => void;
  onStartPrompter: (script: Script) => void;
  onStartCamera: (script: Script) => void;
  onStartFloating: (script: Script) => void;
  onDuplicateScript: (id: string) => void;
  onDeleteScript: (id: string) => void;
  onToggleFavorite: (script: Script) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  scripts,
  lastOpenedScriptId,
  settings,
  onCreateScript,
  onOpenScript,
  onStartPrompter,
  onStartCamera,
  onStartFloating,
  onDuplicateScript,
  onDeleteScript,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ScriptCategory>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'duration'>('updated');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Available projects list
  const projects = useMemo(() => {
    const set = new Set<string>();
    scripts.forEach((s) => {
      if (s.project) set.add(s.project);
    });
    return Array.from(set);
  }, [scripts]);

  // Last opened script
  const lastScript = useMemo(() => {
    if (!lastOpenedScriptId) return scripts[0] || null;
    return scripts.find((s) => s.id === lastOpenedScriptId) || scripts[0] || null;
  }, [scripts, lastOpenedScriptId]);

  // Filtered & Sorted scripts
  const filteredScripts = useMemo(() => {
    let list = [...scripts];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
      );
    }

    // Category
    if (activeCategory === 'favorites') {
      list = list.filter((s) => s.isFavorite);
    } else if (activeCategory === 'recent') {
      list = list.slice(0, 5);
    } else if (activeCategory === 'project' && selectedProject) {
      list = list.filter((s) => s.project === selectedProject);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'duration') return b.estimatedSeconds - a.estimatedSeconds;
      return b.updatedAt - a.updatedAt;
    });

    return list;
  }, [scripts, searchQuery, activeCategory, selectedProject, sortBy]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <div id="dashboard-container" className="space-y-6 pb-20">
      {/* Hero: "Continuar último roteiro" Banner */}
      {lastScript && (
        <div
          id="banner-continue-last-script"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/20 p-5 sm:p-6 shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                  Continuar Último Roteiro
                </span>
                {lastScript.project && (
                  <span className="text-slate-400 text-xs">em {lastScript.project}</span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {lastScript.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">
                {lastScript.content.replace(/\[.*?\]/g, '').trim()}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span>{lastScript.wordCount} palavras</span>
                <span>•</span>
                <span className="text-cyan-400 font-mono">
                  ~{formatDuration(lastScript.estimatedSeconds)}
                </span>
                <span>•</span>
                <span>Editado em {formatDate(lastScript.updatedAt)}</span>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-continue-floating"
                onClick={() => onStartFloating(lastScript)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/20 active:scale-95 transition"
                title="Ativar Modo Flutuante (usar junto com a Câmera nativa do iPhone)"
              >
                <Layers className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>FLUTUAR</span>
              </button>

              <button
                id="btn-continue-prompter"
                onClick={() => onStartPrompter(lastScript)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 active:scale-95 transition"
              >
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>Teleprompter</span>
              </button>

              <button
                id="btn-continue-camera"
                onClick={() => onStartCamera(lastScript)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 active:scale-95 transition"
              >
                <Video className="w-4 h-4 text-cyan-400" />
                <span>Gravar no App</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Meus Roteiros</h1>
          <p className="text-xs text-slate-400">
            {scripts.length} {scripts.length === 1 ? 'roteiro disponível' : 'roteiros disponíveis'}
          </p>
        </div>

        <button
          id="btn-new-script"
          onClick={onCreateScript}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Roteiro</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'recent', label: 'Recentes' },
              { id: 'favorites', label: 'Favoritos' },
              { id: 'project', label: 'Projetos' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                if (cat.id === 'project' && projects.length > 0 && !selectedProject) {
                  setSelectedProject(projects[0]);
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input & Sort */}
        <div className="flex items-center gap-2">
          {activeCategory === 'project' && projects.length > 0 && (
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p} value={p}>
                  📁 {p}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="input-search-scripts"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar roteiros..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <select
            id="select-sort-scripts"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
          >
            <option value="updated">Data</option>
            <option value="title">Título</option>
            <option value="duration">Duração</option>
          </select>
        </div>
      </div>

      {/* Script Cards Grid */}
      {filteredScripts.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Nenhum roteiro encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Nenhum resultado para a sua pesquisa. Tente outros termos.'
              : 'Comece criando seu primeiro roteiro para o teleprompter!'}
          </p>
          <button
            onClick={onCreateScript}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            Criar Roteiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScripts.map((script) => (
            <div
              key={script.id}
              id={`card-script-${script.id}`}
              className="group flex flex-col justify-between rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md p-4 transition duration-200 space-y-3"
            >
              {/* Card Header */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    onClick={() => onOpenScript(script)}
                    className="font-bold text-white text-sm sm:text-base cursor-pointer hover:text-cyan-400 transition truncate"
                  >
                    {script.title}
                  </h3>

                  <button
                    onClick={() => onToggleFavorite(script)}
                    className="text-slate-500 hover:text-amber-400 transition"
                    title={script.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        script.isFavorite ? 'text-amber-400 fill-current' : ''
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {script.content.replace(/\[.*?\]/g, '').trim() || 'Roteiro vazio.'}
                </p>
              </div>

              {/* Card Metrics */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span>{script.wordCount} pal.</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-mono">
                    ~{formatDuration(script.estimatedSeconds)}
                  </span>
                </div>
                <span>{formatDate(script.updatedAt)}</span>
              </div>

              {/* Card Actions Footer */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                {/* Secondary tools */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenScript(script)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Editar Roteiro"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDuplicateScript(script.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Duplicar Roteiro"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onStartFloating(script)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                    title="Abrir Modo Flutuante"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(script.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                    title="Excluir Roteiro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Launch triggers */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onStartFloating(script)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold active:scale-95 transition"
                    title="Ativar Modo Flutuante para Câmera do iPhone"
                  >
                    <Layers className="w-3 h-3 text-cyan-400 stroke-[2.5]" />
                    <span>Flutuar</span>
                  </button>

                  <button
                    onClick={() => onStartPrompter(script)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    title="Iniciar Teleprompter"
                  >
                    <Play className="w-3 h-3 text-cyan-400 fill-current" />
                    <span>Ler</span>
                  </button>

                  <button
                    onClick={() => onStartCamera(script)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    title="Gravar no App"
                  >
                    <Video className="w-3 h-3 text-cyan-400" />
                    <span>Gravar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Excluir Roteiro"
      >
        <div className="space-y-4 text-sm text-slate-300">
          <p>Tem certeza de que deseja excluir este roteiro? Esta ação não poderá ser desfeita.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (deleteConfirmId) {
                  onDeleteScript(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
            >
              Excluir Definitivamente
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
