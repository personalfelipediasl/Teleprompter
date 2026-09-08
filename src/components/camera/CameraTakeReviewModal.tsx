import React, { useState, useRef } from 'react';
import {
  Download,
  Play,
  Pause,
  RotateCcw,
  Film,
  CheckCircle2,
  Trash2,
  Maximize2,
  Volume2,
  VolumeX,
  Clock,
  HardDrive,
  Video,
  X,
} from 'lucide-react';
import { RecordedVideo } from '../../types';
import { Modal } from '../common/Modal';

interface CameraTakeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  takes: RecordedVideo[];
  selectedTakeIndex: number;
  onSelectTake: (index: number) => void;
  onDeleteTake: (index: number) => void;
  onRecordNewTake: () => void;
}

export const CameraTakeReviewModal: React.FC<CameraTakeReviewModalProps> = ({
  isOpen,
  onClose,
  takes,
  selectedTakeIndex,
  onSelectTake,
  onDeleteTake,
  onRecordNewTake,
}) => {
  const currentTake = takes[selectedTakeIndex] || takes[0];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  if (!isOpen || !currentTake) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || currentTake.durationSeconds);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const downloadTake = (take: RecordedVideo) => {
    const a = document.createElement('a');
    a.href = take.url;
    const cleanTitle = (take.scriptTitle || 'roteiro')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    const extension = take.mimeType?.includes('mp4') ? 'mp4' : 'webm';
    const takeNum = take.takeNumber ? `take-${take.takeNumber}` : 'take';
    a.download = `${takeNum}_${cleanTitle}_${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Revisão de Gravação & Download</h3>
            <p className="text-[11px] text-slate-400">
              Take {currentTake.takeNumber || selectedTakeIndex + 1} de {takes.length} • {currentTake.scriptTitle}
            </p>
          </div>
        </div>
      }
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Video Player Box */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl aspect-video flex items-center justify-center group">
          <video
            ref={videoRef}
            src={currentTake.url}
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain"
          />

          {/* Custom Overlay Controls */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-95 group-hover:opacity-100 transition">
            {/* Scrubber progress */}
            <input
              type="range"
              min={0}
              max={duration || currentTake.durationSeconds || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-cyan-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between text-xs text-slate-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      setCurrentTime(0);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
                  title="Reiniciar vídeo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
                  title={isMuted ? 'Ativar som' : 'Silenciar'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="font-mono text-[11px] text-slate-300">
                  {formatTime(currentTime)} / {formatTime(duration || currentTake.durationSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-cyan-300 uppercase">
                  {currentTake.mimeType?.includes('mp4') ? 'MP4' : 'WEBM'}
                </span>
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
                  title="Tela Cheia"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Metadata Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Duração</span>
              <strong className="text-white font-mono">{formatTime(currentTake.durationSeconds)}</strong>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Tamanho</span>
              <strong className="text-white font-mono">
                {(currentTake.sizeBytes / (1024 * 1024)).toFixed(2)} MB
              </strong>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Resolução / Take</span>
              <strong className="text-white font-mono">
                {currentTake.resolution || 'Auto'} (Take {currentTake.takeNumber || selectedTakeIndex + 1})
              </strong>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
            <Video className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Data de Gravação</span>
              <strong className="text-white text-[11px]">
                {new Date(currentTake.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>
          </div>
        </div>

        {/* Multi-Take Browser Bar (If more than 1 take recorded) */}
        {takes.length > 1 && (
          <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Histórico de Takes Desta Sessão ({takes.length})
              </span>
              <span className="text-[11px] text-slate-400">Clique para alternar entre as tomadas</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {takes.map((take, idx) => (
                <div
                  key={take.id || idx}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs cursor-pointer border transition shrink-0 ${
                    idx === selectedTakeIndex
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  onClick={() => onSelectTake(idx)}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Take {take.takeNumber || idx + 1}</span>
                  <span className="text-[10px] opacity-75">({formatTime(take.durationSeconds)})</span>
                  {takes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTake(idx);
                      }}
                      className="ml-1 text-slate-400 hover:text-red-400 p-0.5 rounded"
                      title="Excluir este take"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={onRecordNewTake}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Gravar Novo Take
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
            >
              Voltar ao Estúdio
            </button>

            <button
              id="btn-download-active-take"
              onClick={() => downloadTake(currentTake)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-950/40 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Vídeo (Take {currentTake.takeNumber || selectedTakeIndex + 1})</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
