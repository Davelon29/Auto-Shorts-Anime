import React from 'react';
import { 
  Play, 
  Sparkles, 
  Film, 
  Layers, 
  Calendar, 
  Flame, 
  RefreshCw,
  Terminal
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isRunning: boolean;
  onOpenTerminal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isRunning,
  onOpenTerminal
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard & Pipeline', icon: Flame },
    { id: 'scripts', label: 'Guiones IA (Deep Web)', icon: Sparkles },
    { id: 'player', label: 'Ensamblador & Preview 9:16', icon: Film },
    { id: 'footage', label: 'Metraje & Clips', icon: Layers },
    { id: 'youtube', label: 'Planificador YouTube', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-lg shadow-rose-950/50">
            <Play className="w-5 h-5 text-white fill-white translate-x-0.5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRunning ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isRunning ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider uppercase text-zinc-100 font-['Cinzel']">
                Auto Shorts <span className="text-rose-500">Anime</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                PROD v2.0
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Fábrica Automatizada de YouTube Shorts de Alta Retención
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status indicator and Terminal trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTerminal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition cursor-pointer ${
              isRunning
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span>{isRunning ? 'Pipeline Activo' : 'Consola Pipeline'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
