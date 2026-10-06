import React, { useState } from 'react';
import { 
  Layers, 
  Download, 
  Scissors, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle,
  FolderOpen,
  Film,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { AnimeConfig } from '../types';

interface FootageManagerViewProps {
  animes: AnimeConfig[];
  onRefresh: () => void;
  onRunStep: (stepNumber: number) => void;
}

export const FootageManagerView: React.FC<FootageManagerViewProps> = ({
  animes,
  onRefresh,
  onRunStep
}) => {
  const [downloadUrl, setDownloadUrl] = useState('');
  const [selectedTag, setSelectedTag] = useState(animes[0]?.tag || 'jjk');
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  // New Anime form
  const [newTag, setNewTag] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newHashtags, setNewHashtags] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSimulateDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadUrl.trim()) return;

    setDownloading(true);
    setDownloadMessage(null);
    try {
      // Trigger pipeline step 0 (download footage)
      await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 0 })
      });
      setDownloadMessage(`Metraje descargado con éxito para [${selectedTag}]. Archivo colocado en footage_raw/${selectedTag}/`);
      setDownloadUrl('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCreateAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !newNombre.trim()) return;

    try {
      const res = await fetch('/api/animes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: newTag.toLowerCase().trim(),
          nombre: newNombre.trim(),
          hashtags: newHashtags.trim()
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewTag('');
        setNewNombre('');
        setNewHashtags('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAnime = async (tag: string) => {
    if (!confirm(`¿Eliminar la categoría de anime [${tag}]?`)) return;
    try {
      await fetch(`/api/animes/${tag}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-black text-white uppercase tracking-wider font-['Cinzel']">
              METRAJE & CLIPS AUTOMÁTICOS
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Descarga de material en 1080p, procesado vertical con fondo desenfocado y partición a micro-clips de 2.0s.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onRunStep(1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            <span>Trocear Todo (slice_footage.py)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-400" />
            <span>Añadir Anime</span>
          </button>
        </div>
      </div>

      {/* Downloader Form */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-rose-500" />
          <span>Descargador de Metraje (download_footage.py)</span>
        </h3>

        <form onSubmit={handleSimulateDownload} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase block mb-1.5">
              Categoría Anime Destino
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {animes.map(a => (
                <option key={a.tag} value={a.tag}>{a.nombre} [{a.tag}]</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase block mb-1.5">
              URL del Vídeo / Metraje Sin Marcas de Agua (YouTube / Raw)
            </label>
            <input
              type="text"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... o nombre del corte"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {downloading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloading ? 'Descargando...' : 'Descargar'}</span>
            </button>
          </div>
        </form>

        {downloadMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{downloadMessage}</span>
          </div>
        )}
      </div>

      {/* Slicing Formula Specs Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs font-mono text-zinc-400 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <span className="text-zinc-200 font-bold block mb-1">Canvas Vertical 9:16</span>
          <span className="text-zinc-500">1080x1920 con fondo desenfocado gblur=sigma=30</span>
        </div>
        <div>
          <span className="text-zinc-200 font-bold block mb-1">Cortes de Alta Retención</span>
          <span className="text-zinc-500">Duración exacta: 2.0s por corte (CLIP_DURATION = 2.0)</span>
        </div>
        <div>
          <span className="text-zinc-200 font-bold block mb-1">Umbral de Fabricación</span>
          <span className="text-zinc-500">Mínimo 30 clips = 1 Short listo para ensamblar</span>
        </div>
      </div>

      {/* Anime Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {animes.map(anime => (
          <div 
            key={anime.tag}
            className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 font-mono text-[10px] font-bold text-zinc-400">
                  [{anime.tag}]
                </span>
                <button
                  onClick={() => handleDeleteAnime(anime.tag)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                  title="Eliminar anime"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-base font-extrabold text-white mt-2">
                {anime.nombre}
              </h3>

              <p className="text-[11px] font-mono text-zinc-400 mt-1 line-clamp-1">
                {anime.hashtags}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-zinc-800/80">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-mono">Clips 2.0s disponibles:</span>
                <span className="font-bold text-white font-mono">{anime.clipsCount} clips</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-mono">Shorts ensamblables:</span>
                <span className="font-bold text-emerald-400 font-mono">{anime.potentialShorts} listos</span>
              </div>
              {anime.rawPending && anime.rawPending > 0 ? (
                <div className="text-[11px] text-amber-400 font-medium">
                  ⚠️ {anime.rawPending} archivos raw pendientes de trocear
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Add Anime Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white uppercase font-['Cinzel']">
              Registrar Nuevo Anime en animes.json
            </h3>
            <form onSubmit={handleCreateAnime} className="space-y-3">
              <div>
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase block mb-1">
                  Tag único (minúsculas, ej. naruto, bleack)
                </label>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="naruto"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase block mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Naruto Shippuden"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase block mb-1">
                  Hashtags Recomendados
                </label>
                <input
                  type="text"
                  value={newHashtags}
                  onChange={(e) => setNewHashtags(e.target.value)}
                  placeholder="#Naruto #Sasuke #Anime #Shorts"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Registrar Anime
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
