import React from 'react';
import { 
  FileText, 
  Video, 
  Tv, 
  Layers, 
  Settings, 
  Compass,
  ArrowLeft
} from 'lucide-react';
import { AppRoute } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onRouteChange,
  title,
  showBack = false,
  onBack,
}) => {
  return (
    <header
      id="app-main-header"
      className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 py-3"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left branding or back button */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              id="btn-nav-back"
              onClick={onBack || (() => onRouteChange('dashboard'))}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div 
            onClick={() => onRouteChange('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 p-0.5 shadow-md shadow-cyan-950/40">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Tv className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block leading-tight">
                {title || 'Teleprompter Pro'}
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase text-cyan-400/90 block">
                Estúdio de Gravação
              </span>
            </div>
          </div>
        </div>

        {/* Center / Navigation pill */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 p-1 rounded-2xl">
          <button
            id="nav-tab-dashboard"
            onClick={() => onRouteChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              currentRoute === 'dashboard'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Roteiros</span>
          </button>

          <button
            id="nav-tab-teleprompter"
            onClick={() => onRouteChange('teleprompter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              currentRoute === 'teleprompter'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Prompter</span>
          </button>

          <button
            id="nav-tab-camera"
            onClick={() => onRouteChange('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              currentRoute === 'camera'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Gravar</span>
          </button>

          <button
            id="nav-tab-floating"
            onClick={() => onRouteChange('floating')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              currentRoute === 'floating'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flutuante</span>
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => onRouteChange('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              currentRoute === 'settings'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustes</span>
          </button>
        </nav>

        {/* Right action items & PWA install */}
        <div className="flex items-center gap-2">
          <PWAInstallButton compact />

          <button
            id="btn-header-quick-settings"
            onClick={() => onRouteChange('settings')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition md:hidden"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
