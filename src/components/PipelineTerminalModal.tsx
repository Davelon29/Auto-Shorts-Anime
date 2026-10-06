import React from 'react';
import { Terminal, RefreshCw, X, Play, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { PipelineLog } from '../types';

interface PipelineTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: PipelineLog[];
  isRunning: boolean;
  activeStep: string | null;
  progress: number;
  onRunStep: (stepNumber: number) => void;
}

export const PipelineTerminalModal: React.FC<PipelineTerminalModalProps> = ({
  isOpen,
  onClose,
  logs,
  isRunning,
  activeStep,
  progress,
  onRunStep
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col h-[640px] overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-mono font-bold text-zinc-200">
                pipeline.py — AI Studio Console
              </span>
            </div>
            {isRunning && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>{activeStep || 'Ejecutando'} ({progress}%)</span>
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Launch Buttons Row */}
        <div className="px-5 py-2.5 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] font-mono text-zinc-500 uppercase shrink-0">Acceso Rápido:</span>
          <button
            disabled={isRunning}
            onClick={() => onRunStep(1)}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            ✂️ 1. Trocear
          </button>
          <button
            disabled={isRunning}
            onClick={() => onRunStep(2)}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            🤖 2. Guiones IA
          </button>
          <button
            disabled={isRunning}
            onClick={() => onRunStep(3)}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            ⚡ 3. Ensamblar
          </button>
          <button
            disabled={isRunning}
            onClick={() => onRunStep(4)}
            className="px-2.5 py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 font-mono text-[11px] font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            🔥 4. Modo Local (1+2+3)
          </button>
          <button
            disabled={isRunning}
            onClick={() => onRunStep(6)}
            className="px-2.5 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 font-mono text-[11px] font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            🚀 6. Ciclo End-to-End
          </button>
        </div>

        {/* Logs Output Area */}
        <div className="flex-1 p-5 overflow-y-auto font-mono text-xs space-y-2 bg-black/50 select-text">
          {logs.length === 0 ? (
            <p className="text-zinc-600">No hay registros de ejecución.</p>
          ) : (
            logs.map((log, index) => {
              const isError = log.level === 'error';
              const isSuccess = log.level === 'success';
              const isWarn = log.level === 'warn';

              return (
                <div key={index} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-zinc-600 shrink-0 text-[11px]">
                    [{log.timestamp}]
                  </span>
                  <span className={`shrink-0 ${
                    isError ? 'text-rose-400' : isSuccess ? 'text-emerald-400' : isWarn ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {isError ? '✖' : isSuccess ? '✔' : isWarn ? '▲' : '●'}
                  </span>
                  <span className={`${
                    isError ? 'text-rose-300' : isSuccess ? 'text-emerald-300' : isWarn ? 'text-amber-200' : 'text-zinc-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Terminal Footer */}
        <div className="px-5 py-2.5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>Auto Shorts Anime Orquestador — linux-x64 Node 22</span>
          <span>{logs.length} eventos registrados</span>
        </div>
      </div>
    </div>
  );
};
