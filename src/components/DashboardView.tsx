import React from 'react';
import { 
  Play, 
  Sparkles, 
  Scissors, 
  Upload, 
  Layers, 
  Flame, 
  Video, 
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { DashboardData } from '../types';

interface DashboardViewProps {
  data: DashboardData | null;
  loading: boolean;
  onRunStep: (stepNumber: number) => void;
  onOpenTerminal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  loading,
  onRunStep,
  onOpenTerminal,
  onNavigateTab
}) => {
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
        <p className="text-zinc-400 text-sm">Cargando métricas del sistema Auto Shorts Anime...</p>
      </div>
    );
  }

  const isRunning = data?.pipeline.isRunning || false;
  const activeStep = data?.pipeline.activeStep;
  const progress = data?.pipeline.progress || 0;

  const pipelineActions = [
    {
      step: 0,
      title: '0. Descargar Metraje',
      script: 'download_footage.py',
      desc: 'Obtiene metraje anime en 1080p sin marcas de agua desde enlaces.',
      icon: Layers,
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400 hover:border-blue-400'
    },
    {
      step: 1,
      title: '1. Trocear Metraje RAW',
      script: 'slice_footage.py',
      desc: 'Formatea a vertical 9:16 con fondo blur y corta micro-clips de 2.0s.',
      icon: Scissors,
      color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400 hover:border-violet-400'
    },
    {
      step: 2,
      title: '2. Generar Guiones IA',
      script: 'generate_scripts.py',
      desc: 'Redacta guiones "Deep Web" de alta retención usando Gemini 3.8 Flash.',
      icon: Sparkles,
      color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400 hover:border-rose-400'
    },
    {
      step: 3,
      title: '3. Ensamblar Vídeos',
      script: 'auto_shorts.py',
      desc: 'Locución ultra-rápida, subtítulos ASS dinámicos y música con ducking.',
      icon: Video,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400 hover:border-amber-400'
    },
    {
      step: 4,
      title: '4. MODO PRODUCCIÓN LOCAL',
      script: '1 -> 2 -> 3 en cadena',
      desc: 'Secuencia completa de fabricación local automatizada.',
      icon: Flame,
      color: 'from-rose-600/30 to-amber-600/20 border-rose-500/50 text-rose-400 hover:border-rose-400 font-bold',
      highlight: true
    },
    {
      step: 5,
      title: '5. Subir a YouTube',
      script: 'upload_youtube.py',
      desc: 'Programa automáticamente los vídeos listos en los slots horarios.',
      icon: Upload,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-400'
    },
    {
      step: 6,
      title: '6. CICLO TOTAL END-TO-END',
      script: '1 -> 2 -> 3 -> 5 automático',
      desc: 'Desde el metraje en bruto hasta la publicación programada en YouTube.',
      icon: TrendingUp,
      color: 'from-gradient-to-r from-red-600/30 via-rose-600/20 to-amber-600/20 border-rose-500/60 text-white hover:border-rose-300 font-black',
      superHighlight: true
    }
  ];

  return (
    <div className="space-y-8">
      {/* Running Banner */}
      {isRunning && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-zinc-900/80 to-zinc-950 p-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
                    EJECUTANDO PIPELINE EN SEGUNDO PLANO
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">{activeStep}</h3>
              </div>
            </div>
            <button
              onClick={onOpenTerminal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition cursor-pointer"
            >
              Ver Consola en Vivo
            </button>
          </div>
          <div className="mt-4 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Animes Monitoreados</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{data?.totalAnimes ?? 0}</span>
            <span className="text-xs text-zinc-500">categorías activas</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Guiones en Biblioteca</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{data?.totalScripts ?? 0}</span>
            <span className="text-xs text-emerald-400 font-medium">Deep Web IA</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Shorts Ensamblados</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{data?.totalRenders ?? 0}</span>
            <span className="text-xs text-amber-400">renderizados</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Publicados en YouTube</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Upload className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{data?.totalUploaded ?? 0}</span>
            <span className="text-xs text-zinc-500">
              +{data?.totalScheduled ?? 0} programados
            </span>
          </div>
        </div>
      </div>

      {/* Main Control Panel (pipeline.py menu replication) */}
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-['Cinzel']">
                PANEL DE CONTROL DEL PIPELINE
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Ejecución orquestada del ciclo de producción (emulación directa de pipeline.py)
            </p>
          </div>
          <button
            onClick={onOpenTerminal}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
          >
            <span>Ver Registro Histórico</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {pipelineActions.map(action => {
            const Icon = action.icon;
            return (
              <div
                key={action.step}
                className={`flex flex-col justify-between p-4 rounded-xl border bg-gradient-to-br transition-all duration-200 ${action.color} ${
                  action.superHighlight ? 'md:col-span-2 lg:col-span-1 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                      {action.title}
                    </span>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 block mb-1">
                    [{action.script}]
                  </span>
                  <p className="text-xs text-zinc-300 line-clamp-2">
                    {action.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-mono">Paso #{action.step}</span>
                  <button
                    disabled={isRunning}
                    onClick={() => onRunStep(action.step)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      action.highlight || action.superHighlight
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-950'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Ejecutar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anime Footage Matrix */}
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-['Cinzel']">
              📊 EXPEDIENTE ANIME: ESTADO DE METRAJE Y RETENCIÓN
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cada Short requiere mínimo 30 micro-clips (2.0s por corte) para garantizar ritmo frenético
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('footage')}
            className="flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer"
          >
            <span>Gestionar Metraje</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono">
                <th className="py-3 px-4 font-bold">Anime</th>
                <th className="py-3 px-4 font-bold">Tag</th>
                <th className="py-3 px-4 font-bold text-center">Clips 2.0s</th>
                <th className="py-3 px-4 font-bold text-center">Shorts Posibles</th>
                <th className="py-3 px-4 font-bold text-center">Metraje RAW</th>
                <th className="py-3 px-4 font-bold text-center">Guiones</th>
                <th className="py-3 px-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {(data?.animeStats || []).map(anime => (
                <tr key={anime.tag} className="hover:bg-zinc-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-zinc-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>{anime.nombre}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-400">
                    [{anime.tag}]
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-200">
                    {anime.clipsCount} clips
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20">
                      ⚡ {anime.potentialShorts} Shorts
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {anime.rawPending && anime.rawPending > 0 ? (
                      <span className="text-amber-400 font-medium">
                        {anime.rawPending} raw pendientes
                      </span>
                    ) : (
                      <span className="text-zinc-500">Al día</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-zinc-300">
                    {anime.scriptsCount}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onNavigateTab('scripts')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-[11px] transition cursor-pointer"
                    >
                      Generar Guion
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
