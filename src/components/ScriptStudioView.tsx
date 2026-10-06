import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Flame, 
  Plus, 
  Film, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle,
  RefreshCw,
  Sliders,
  Volume2
} from 'lucide-react';
import { ScriptItem, AnimeConfig } from '../types';

interface ScriptStudioViewProps {
  animes: AnimeConfig[];
  onSelectScriptForAssemble: (script: ScriptItem) => void;
  onNavigateTab: (tab: string) => void;
}

export const ScriptStudioView: React.FC<ScriptStudioViewProps> = ({
  animes,
  onSelectScriptForAssemble,
  onNavigateTab
}) => {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generator form
  const [targetAnime, setTargetAnime] = useState<string>('Jujutsu Kaisen');
  const [targetTag, setTargetTag] = useState<string>('jjk');
  const [selectedAngulo, setSelectedAngulo] = useState<string>(
    'Un error de continuidad gravísimo en el manga que el anime tuvo que tapar en secreto'
  );
  const [customAngulo, setCustomAngulo] = useState('');
  const [generateBatchCount, setGenerateBatchCount] = useState<number>(1);
  const [showNewScriptModal, setShowNewScriptModal] = useState(false);

  // Script editor modal
  const [editingScript, setEditingScript] = useState<Partial<ScriptItem> | null>(null);

  const ANGULOS_PRESET = [
    'Un error de continuidad gravísimo en el manga que el anime tuvo que tapar en secreto',
    'Una conexión perturbadora con crímenes o eventos históricos reales',
    'El borrador original de la obra donde el protagonista era el villano o moría trágicamente',
    'Un subtexto psicológico retorcido sobre el trauma de un personaje secundario',
    'La regla biológica o física oculta que hace que sus poderes sean una maldición',
    'Un mensaje oculto en el opening, ending o escenarios que nadie notó'
  ];

  const fetchScripts = async () => {
    setLoading(true);
    try {
      let url = `/api/scripts?limit=60`;
      if (selectedTag !== 'all') {
        url += `&tag=${encodeURIComponent(selectedTag)}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setScripts(data.scripts || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Error fetching scripts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, [selectedTag, searchQuery]);

  const handleGenerateScript = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: targetTag,
          anime: targetAnime,
          anguloCustom: customAngulo.trim() || selectedAngulo,
          count: generateBatchCount
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchScripts();
      }
    } catch (err) {
      console.error('Error generating script:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScript || !editingScript.titulo || !editingScript.texto) return;

    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingScript)
      });
      if (res.ok) {
        setEditingScript(null);
        setShowNewScriptModal(false);
        await fetchScripts();
      }
    } catch (err) {
      console.error('Error saving script:', err);
    }
  };

  const handleDeleteScript = async (id: string) => {
    if (!confirm('¿Eliminar este guion de la base de datos?')) return;
    try {
      await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
      setScripts(prev => prev.filter(s => s.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error deleting script:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const hasBannedWords = (title: string) => {
    return /\b(secreto|oscuro|secretos|oscuros)\b/i.test(title);
  };

  return (
    <div className="space-y-8">
      {/* Header and Generator Box */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-['Cinzel']">
                GENERADOR DE GUIONES IA "DEEP WEB" (GEMINI 3.8 FLASH)
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Guiones con 100%+ de retención: Gancho de ruptura inicial, lore perturbador, pregunta divisiva y bucle de audio perfecto.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingScript({
                tag: 'jjk',
                anime: 'Jujutsu Kaisen',
                titulo: '',
                texto: '',
                voz: 'es-MX-JorgeNeural'
              });
              setShowNewScriptModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-400" />
            <span>Escribir Guion Manual</span>
          </button>
        </div>

        {/* Generator Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
          <div>
            <label className="text-xs font-mono font-bold text-zinc-300 uppercase block mb-1.5">
              1. Anime Objetivo
            </label>
            <select
              value={targetTag}
              onChange={(e) => {
                const tag = e.target.value;
                setTargetTag(tag);
                const found = animes.find(a => a.tag === tag);
                if (found) setTargetAnime(found.nombre);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
            >
              {animes.map(a => (
                <option key={a.tag} value={a.tag}>{a.nombre} [{a.tag}]</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-zinc-300 uppercase block mb-1.5">
              2. Ángulo Temático de Alta Retención
            </label>
            <select
              value={selectedAngulo}
              onChange={(e) => setSelectedAngulo(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
            >
              {ANGULOS_PRESET.map((ang, i) => (
                <option key={i} value={ang}>{ang.slice(0, 48)}...</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-zinc-300 uppercase block mb-1.5">
              3. Cantidad de Guiones
            </label>
            <div className="flex gap-2">
              <select
                value={generateBatchCount}
                onChange={(e) => setGenerateBatchCount(Number(e.target.value))}
                className="w-24 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
              >
                <option value={1}>1 Guion</option>
                <option value={2}>2 Guiones</option>
                <option value={3}>3 Guiones</option>
              </select>

              <button
                disabled={generating}
                onClick={handleGenerateScript}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-rose-950 cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generando IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar con Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Script Library Explorer */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-zinc-100 font-mono">
              BIBLIOTECA ({totalCount} guiones registrados)
            </span>
            <div className="h-4 w-px bg-zinc-800 hidden sm:block"></div>
            {/* Tag Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedTag === 'all'
                    ? 'bg-rose-500 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos
              </button>
              {animes.map(a => (
                <button
                  key={a.tag}
                  onClick={() => setSelectedTag(a.tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    selectedTag === a.tag
                      ? 'bg-rose-500 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {a.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por título, texto o anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Script Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
          </div>
        ) : scripts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <p className="text-zinc-400 text-sm">No se encontraron guiones con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scripts.map(script => {
              const words = getWordCount(script.texto);
              const titleBanned = hasBannedWords(script.titulo);
              return (
                <div 
                  key={script.id}
                  className="flex flex-col justify-between p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition space-y-4"
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
                          {script.anime || script.tag}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          ID: {script.id.slice(0, 16)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {titleBanned && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3" />
                            Palabra Prohibida
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-zinc-400">
                          {words} palabras
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wide leading-snug">
                      {script.titulo}
                    </h3>

                    {/* Script Body */}
                    <p className="text-xs text-zinc-300 mt-2.5 line-clamp-3 leading-relaxed font-sans">
                      {script.texto}
                    </p>

                    {/* Viral Retention Badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        ⚡ Retención {script.viralScore || 95}%
                      </span>
                      {script.polarizingDebate && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 line-clamp-1 max-w-[280px]">
                          💬 Debate: {script.polarizingDebate}
                        </span>
                      )}
                      {script.bucleLoopCheck && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          🔁 Bucle Circular Verificado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => copyToClipboard(script.texto, script.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition cursor-pointer"
                        title="Copiar texto del guion"
                      >
                        {copiedId === script.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingScript(script);
                          setShowNewScriptModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteScript(script.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 text-xs transition cursor-pointer"
                        title="Eliminar guion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        onSelectScriptForAssemble(script);
                        onNavigateTab('player');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Ensamblar Short</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Script Modal */}
      {showNewScriptModal && editingScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase font-['Cinzel']">
                {editingScript.id ? 'Editar Guion' : 'Crear Nuevo Guion'}
              </h3>
              <button
                onClick={() => {
                  setShowNewScriptModal(false);
                  setEditingScript(null);
                }}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveScript} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase block mb-1">
                    Anime
                  </label>
                  <input
                    type="text"
                    value={editingScript.anime || ''}
                    onChange={(e) => setEditingScript({ ...editingScript, anime: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="Ej. Attack on Titan"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase block mb-1">
                    Voz Sintética
                  </label>
                  <select
                    value={editingScript.voz || 'es-MX-JorgeNeural'}
                    onChange={(e) => setEditingScript({ ...editingScript, voz: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="es-MX-JorgeNeural">es-MX-JorgeNeural (Voz Impacto México)</option>
                    <option value="es-ES-AlvaroNeural">es-ES-AlvaroNeural (Voz Retención España)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                    Título Viral (Máx 8 palabras, sin "secreto" ni "oscuro")
                  </label>
                  {hasBannedWords(editingScript.titulo || '') && (
                    <span className="text-[10px] text-rose-400 font-bold">
                      ⚠️ Contiene palabras prohibidas ("secreto" / "oscuro")
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={editingScript.titulo || ''}
                  onChange={(e) => setEditingScript({ ...editingScript, titulo: e.target.value.toUpperCase() })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white uppercase font-bold"
                  placeholder="Ej. EL COSTO OCULTO DEL INFINITO"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                    Texto del Guion (Rango óptimo: 120 - 190 palabras)
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {getWordCount(editingScript.texto || '')} palabras
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={editingScript.texto || ''}
                  onChange={(e) => setEditingScript({ ...editingScript, texto: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 leading-relaxed font-sans"
                  placeholder="Escribe el guion aquí. Recuerda que la última frase debe quedar incompleta para encajar con la primera frase en un bucle perfecto..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewScriptModal(false);
                    setEditingScript(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Guardar Guion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
