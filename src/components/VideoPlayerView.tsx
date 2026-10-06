import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Film, 
  Sparkles, 
  Sliders, 
  Music, 
  Copy, 
  Check, 
  FileText, 
  Zap, 
  Activity, 
  Code,
  Flame,
  Download,
  ExternalLink
} from 'lucide-react';
import { ScriptItem, AnimeConfig } from '../types';

interface VideoPlayerViewProps {
  selectedScript: ScriptItem | null;
  animes: AnimeConfig[];
  onSelectScript: (script: ScriptItem) => void;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  selectedScript,
  animes,
  onSelectScript
}) => {
  const [currentScript, setCurrentScript] = useState<ScriptItem | null>(selectedScript);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(42);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [bgmDucking, setBgmDucking] = useState(true);

  // Pattern Interrupt configuration
  const [patternMode, setPatternMode] = useState<'cycle' | 'snap_zoom' | 'flash_invert' | 'camera_shake'>('cycle');
  const [cutPacing, setCutPacing] = useState<number>(1.8); // 1.8s per cut
  const [activeEffect, setActiveEffect] = useState<'normal' | 'snap_zoom' | 'flash_invert' | 'camera_shake'>('normal');

  // Subtitles and Visuals
  const [activeSubtitleChunk, setActiveSubtitleChunk] = useState<string>('');
  const [showTopTitle, setShowTopTitle] = useState(true);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [showFfmpegModal, setShowFfmpegModal] = useState(false);
  const [ffmpegCode, setFfmpegCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // State for renders gallery
  const [showRendersGallery, setShowRendersGallery] = useState(false);
  const [rendersList, setRendersList] = useState<any[]>([]);
  const [loadingRenders, setLoadingRenders] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderSuccessMessage, setRenderSuccessMessage] = useState<string | null>(null);

  const openRendersGallery = async () => {
    setShowRendersGallery(true);
    setLoadingRenders(true);
    try {
      const res = await fetch('/api/renders');
      const data = await res.json();
      setRendersList(data.renders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRenders(false);
    }
  };

  const intervalRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fallback default script
  useEffect(() => {
    if (selectedScript) {
      setCurrentScript(selectedScript);
    } else if (!currentScript) {
      fetch('/api/scripts?limit=1')
        .then(res => res.json())
        .then(data => {
          if (data.scripts && data.scripts.length > 0) {
            setCurrentScript(data.scripts[0]);
          }
        })
        .catch(console.error);
    }
  }, [selectedScript]);

  const words = currentScript?.texto ? currentScript.texto.trim().split(/\s+/) : [];
  const totalWords = words.length;
  const estimatedDuration = Math.max(35, Math.min(50, Math.ceil(totalWords / 3.4)));

  useEffect(() => {
    setDuration(estimatedDuration);
  }, [estimatedDuration]);

  // Audio synthesis: Web Audio API Sub-Bass Drop (Braam impact at 0.0s)
  const playSubBassDrop = () => {
    if (!sfxEnabled) return;
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Sub-bass sweep: starts at 75Hz and drops exponentially to 32Hz
      osc.frequency.setValueAtTime(75, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  };

  // Play Whoosh / Impact on cuts
  const playCutImpact = () => {
    if (!sfxEnabled) return;
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // ignore
    }
  };

  // Main playback loop
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            // Infinite Retention Loop
            playSubBassDrop();
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, duration, sfxEnabled]);

  // Synchronize subtitles, cuts and pattern interrupts
  useEffect(() => {
    if (!currentScript) return;

    setShowTopTitle(currentTime <= 3.2);

    // 2-word dynamic subtitles
    const wordProgress = Math.floor((currentTime / duration) * totalWords);
    const chunkStart = Math.max(0, Math.min(wordProgress - (wordProgress % 2), totalWords - 2));
    const chunk = words.slice(chunkStart, chunkStart + 2).join(' ').toUpperCase();
    setActiveSubtitleChunk(chunk);

    // Determine current clip index based on cutPacing (e.g. 1.8s)
    const clipIdx = Math.floor(currentTime / cutPacing);
    const timeWithinClip = currentTime % cutPacing;

    if (clipIdx !== currentClipIndex) {
      setCurrentClipIndex(clipIdx);
      playCutImpact();

      // Trigger pattern interrupt on new cut
      let nextEffect: 'normal' | 'snap_zoom' | 'flash_invert' | 'camera_shake' = 'normal';
      if (patternMode === 'cycle') {
        const effects: ('snap_zoom' | 'flash_invert' | 'camera_shake')[] = [
          'snap_zoom',
          'flash_invert',
          'camera_shake'
        ];
        nextEffect = effects[clipIdx % 3];
      } else {
        nextEffect = patternMode;
      }
      setActiveEffect(nextEffect);
    }

    // Reset effect after initial burst (first 0.35s of each clip)
    if (timeWithinClip > 0.4 && activeEffect !== 'normal') {
      setActiveEffect('normal');
    }
  }, [currentTime, duration, totalWords, currentScript, cutPacing, currentClipIndex, patternMode]);

  const togglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      playSubBassDrop();
      if (speechEnabled && 'speechSynthesis' in window && currentScript) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentScript.texto);
        utterance.rate = 1.18; // +18% fast viral cadence
        utterance.lang = 'es-ES';
        speechSynthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setIsPlaying(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleAssembleShort = async () => {
    if (!currentScript) return;
    setIsRendering(true);
    setRenderSuccessMessage(null);
    try {
      const res = await fetch('/api/renders/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: currentScript.id })
      });
      const data = await res.json();
      if (data.success) {
        setRenderSuccessMessage(`Short ensamblado con éxito: ${data.render.filename} (con Pattern Interrupts y Sidechain)`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRendering(false);
    }
  };

  const openFfmpegModal = async () => {
    try {
      const res = await fetch('/api/viral/ffmpeg-code');
      const data = await res.json();
      setFfmpegCode(data.code || '');
      setShowFfmpegModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const animeConfig = animes.find(a => a.tag === currentScript?.tag) || {
    nombre: currentScript?.anime || 'Anime',
    hashtags: '#Anime #Shorts #CuriosidadesAnime'
  };

  const sentences = currentScript?.texto.split('.').filter(s => s.trim()) || [];
  const cta = currentScript?.polarizingDebate || (sentences.length > 0 ? sentences[sentences.length - 1].trim() : '¿Qué opinas? Déjamelo abajo 👇');
  const metaTitle = `${currentScript?.titulo || 'TITULO'} | ${animeConfig.nombre} #shorts`;
  const metaDescription = `${currentScript?.texto.slice(0, 130)}...\n\n🔥 DEBATE: ${cta}\n\n${animeConfig.hashtags}`;
  const metaPinnedComment = `📌 "${cta}"\n🔥 Comenta tu bando abajo y suscríbete para el siguiente expediente.`;

  const fullMetadataExport = `▶ TÍTULO RECOMENDADO:\n${metaTitle}\n\n▶ DESCRIPCIÓN:\n${metaDescription}\n\n▶ COMENTARIO FIJADO (ENGAGEMENT CTA):\n${metaPinnedComment}`;

  const copyMetadata = () => {
    navigator.clipboard.writeText(fullMetadataExport);
    setCopiedMeta(true);
    setTimeout(() => setCopiedMeta(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(ffmpegCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const clipBackgrounds = [
    'from-rose-950 via-zinc-900 to-black',
    'from-blue-950 via-indigo-950 to-zinc-950',
    'from-amber-950 via-zinc-900 to-neutral-950',
    'from-purple-950 via-zinc-900 to-black',
    'from-emerald-950 via-teal-950 to-zinc-950',
    'from-red-950 via-zinc-900 to-stone-950'
  ];

  // Visual simulation classes for Pattern Interrupts
  const getInterruptClasses = () => {
    if (activeEffect === 'snap_zoom') {
      return 'scale-115 transition-transform duration-100 ease-out';
    }
    if (activeEffect === 'flash_invert') {
      return 'invert contrast-200 brightness-125 transition-all duration-75';
    }
    if (activeEffect === 'camera_shake') {
      return 'translate-x-1.5 translate-y-1 rotate-1 transition-transform duration-75';
    }
    return 'scale-100 transition-all duration-300';
  };

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-black text-white uppercase tracking-wider font-['Cinzel']">
              ENSAMBLADOR & SIMULADOR DE ALTA RETENCIÓN (9:16)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Simula las 3 mecánicas de interrupción ocular, sub-bass drop inicial y bucle circular para AVD &gt; 120%.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openFfmpegModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold transition cursor-pointer"
          >
            <Code className="w-4 h-4 text-amber-400" />
            <span>Código FFmpeg / Python</span>
          </button>

          <button
            disabled={!currentScript || isRendering}
            onClick={handleAssembleShort}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider transition shadow-xl shadow-rose-950 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRendering ? 'Ensamblando...' : 'Renderizar Short'}</span>
          </button>
        </div>
      </div>

      {renderSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{renderSuccessMessage}</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-500/20 px-2 py-0.5 rounded">
            Output / Listo
          </span>
        </div>
      )}

      {/* Main Studio Grid: Player on left, Controls & Metadata on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Phone / 9:16 Short Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-[310px] sm:w-[340px] h-[610px] rounded-[42px] p-3 bg-zinc-900 border-4 border-zinc-800 shadow-2xl shadow-rose-950/40 flex flex-col justify-between overflow-hidden">
            {/* Phone Speaker Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-950 rounded-full z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-zinc-800/80 mr-3"></div>
              <div className="w-8 h-1 bg-zinc-800/60 rounded-full"></div>
            </div>

            {/* Screen Content 9:16 */}
            <div className={`relative w-full h-full rounded-[32px] overflow-hidden bg-gradient-to-b ${clipBackgrounds[currentClipIndex % clipBackgrounds.length]} flex flex-col justify-between p-5 select-none transition-colors duration-700`}>
              {/* Real Video Footage Background */}
              <video
                src="/background.mp4"
                className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none mix-blend-luminosity"
                autoPlay
                muted
                loop
                playsInline
              />

              {/* Background ambient pattern */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Watermark/Anime Tag Pill */}
              <div className="z-10 mt-6 flex justify-between items-center">
                <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-zinc-300 border border-white/10">
                  {currentScript?.anime || 'ANIME SHORTS'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600/90 text-[9px] font-black uppercase text-white tracking-widest animate-pulse">
                  EXPEDIENTE ANIME
                </span>
              </div>

              {/* Dynamic Top Title Overlay (Active for first 3.2s per retention specs) */}
              {showTopTitle && (
                <div className="z-20 text-center px-1 animate-in fade-in duration-200">
                  <div className="inline-block px-3 py-1.5 rounded-lg bg-black/85 border border-yellow-400 backdrop-blur-md shadow-2xl shadow-black">
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-yellow-300 font-['Cinzel'] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                      {currentScript?.titulo || 'TITULO RECOMENDADO'}
                    </h4>
                  </div>
                </div>
              )}

              {/* Center Action Focus Frame (With Pattern Interrupt Visual Effects) */}
              <div className="z-10 my-auto flex flex-col items-center justify-center text-center px-1">
                <div className={`w-full aspect-video rounded-xl border border-white/15 bg-black/50 backdrop-blur-xs flex items-center justify-center relative overflow-hidden shadow-2xl ${getInterruptClasses()}`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl filter drop-shadow-md">
                      {currentClipIndex % 2 === 0 ? '⚔️' : '🔥'}
                    </span>
                  </div>
                  
                  {/* Pattern interrupt badge badge */}
                  <span className="absolute top-2 left-2 text-[9px] font-mono text-amber-300 bg-black/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                    {activeEffect !== 'normal' ? `⚡ ${activeEffect.toUpperCase()}` : `Corte #${(currentClipIndex % 30) + 1}`}
                  </span>
                  <span className="absolute bottom-2 right-2 text-[9px] font-mono text-zinc-400 bg-black/70 px-1.5 py-0.5 rounded">
                    {cutPacing}s ritmo
                  </span>
                </div>

                {/* Subtitle Display (Dynamic word-by-word karaoke style) */}
                <div className="mt-5 min-h-[54px] flex items-center justify-center">
                  {activeSubtitleChunk ? (
                    <span className="text-lg sm:text-xl font-black tracking-wider text-cyan-300 bg-black/90 px-3.5 py-1.5 rounded-xl border border-cyan-400/60 shadow-2xl uppercase font-['Cinzel'] animate-pulse">
                      {activeSubtitleChunk}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 font-mono">
                      (Inicia reproducción para probar retención)
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Progress Bar */}
              <div className="z-10 space-y-1.5">
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-rose-500 h-full transition-all duration-100"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                  <span>{currentTime.toFixed(1)}s</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    BUCLE CÍCLICO
                  </span>
                  <span>{duration.toFixed(0)}s</span>
                </div>
              </div>
            </div>

            {/* Bottom Playbar Controls Inside Frame */}
            <div className="pt-2 flex items-center justify-between px-2">
              <button
                onClick={handleReset}
                className="p-2 rounded-full bg-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                title="Reiniciar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={togglePlay}
                className="p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
              </button>

              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className={`p-2 rounded-full transition cursor-pointer ${
                  speechEnabled ? 'bg-zinc-800 text-rose-400' : 'bg-zinc-800 text-zinc-500'
                }`}
                title={speechEnabled ? 'Locución activada' : 'Locución silenciada'}
              >
                {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Controls to download and locate the video */}
          <div className="w-[310px] sm:w-[340px] mt-4 space-y-2">
            <a
              href="/output/video aot 1.mp4"
              download="short_anime.mp4"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-950/40"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Vídeo MP4 (Directo)</span>
            </a>

            <button
              onClick={openRendersGallery}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold transition cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-rose-400" />
              <span>Explorar Renders (/output/)</span>
            </button>

            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] font-mono text-zinc-400 text-center">
              📁 Carpeta en disco: <span className="text-zinc-200 font-bold">/output/</span> (y <span className="text-zinc-200 font-bold">/background.mp4</span>)
            </div>
          </div>
        </div>

        {/* Script Details, Viral Controls & Metadata (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Viral Engine Controls */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                  MECÁNICAS VISUALES & SONORAS VIRALES
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                KPI: AVD &gt; 120%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-zinc-400 block mb-1.5 font-bold">
                  1. Pattern Interrupt Visual (FFmpeg)
                </label>
                <select
                  value={patternMode}
                  onChange={(e) => setPatternMode(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="cycle">Ciclo Automático (Alternancia cada corte)</option>
                  <option value="snap_zoom">Snap-Zoom Cuadrático (1.25x en 10 frames)</option>
                  <option value="flash_invert">Subliminal Flash Invert (Negativo 2 frames)</option>
                  <option value="camera_shake">Camera Shake Cinemático (Sinusoidal)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1.5 font-bold">
                  2. Ritmo de Corte (Pacing)
                </label>
                <select
                  value={cutPacing}
                  onChange={(e) => setCutPacing(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-rose-500"
                >
                  <option value={1.4}>1.4s (Frenético - Cero Drop-off)</option>
                  <option value={1.8}>1.8s (Recomendado Viral)</option>
                  <option value={2.2}>2.2s (Estándar)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap gap-4 text-xs font-mono">
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sfxEnabled}
                  onChange={(e) => setSfxEnabled(e.target.checked)}
                  className="rounded border-zinc-700 text-rose-500 focus:ring-0"
                />
                <span>Sub-Bass Braam a 0.0s (35-70Hz)</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bgmDucking}
                  onChange={(e) => setBgmDucking(e.target.checked)}
                  className="rounded border-zinc-700 text-rose-500 focus:ring-0"
                />
                <span>Sidechain Ducking (-16dB en voz)</span>
              </label>
            </div>
          </div>

          {/* Current Script Card with Retention Analysis */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-mono font-bold text-xs border border-rose-500/20">
                {currentScript?.anime}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {totalWords} palabras | ~{estimatedDuration}s
              </span>
            </div>

            <h3 className="text-base font-extrabold text-white uppercase tracking-wide">
              {currentScript?.titulo}
            </h3>

            <p className="text-xs text-zinc-300 mt-3 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 max-h-40 overflow-y-auto font-sans">
              {currentScript?.texto}
            </p>

            {/* Retention Check Badge */}
            {currentScript?.bucleLoopCheck && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-start gap-2">
                <Activity className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Verificación de Bucle Cíclico:</span>
                  <span className="text-zinc-400">{currentScript.bucleLoopCheck}</span>
                </div>
              </div>
            )}
          </div>

          {/* YouTube Metadata Box (Export ready!) */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                  METADATOS OPTIMIZADOS PARA YOUTUBE STUDIO
                </h4>
              </div>
              <button
                onClick={copyMetadata}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
              >
                {copiedMeta ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMeta ? 'Copiado' : 'Copiar Todo'}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
              <div>
                <span className="text-zinc-500 block mb-1">▶ TÍTULO RECOMENDADO:</span>
                <span className="text-zinc-100 font-bold block">{metaTitle}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">▶ HASHTAGS & DESCRIPCIÓN:</span>
                <span className="text-zinc-400 block line-clamp-2">{metaDescription}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">▶ COMENTARIO FIJADO (ENGAGEMENT DEBATE):</span>
                <span className="text-amber-400 block">{metaPinnedComment}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FFmpeg Code Modal */}
      {showFfmpegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase">
                  Módulo Python / FFmpeg de Producción (Pattern Interrupts & Sidechain)
                </h3>
              </div>
              <button
                onClick={() => setShowFfmpegModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <pre className="flex-1 overflow-y-auto p-4 my-4 bg-zinc-900/80 rounded-xl text-xs font-mono text-zinc-300 border border-zinc-800 leading-relaxed">
              {ffmpegCode}
            </pre>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowFfmpegModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Cerrar
              </button>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copiado al Portapapeles' : 'Copiar Código Python'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renders Gallery Modal */}
      {showRendersGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="text-sm font-mono font-bold text-white uppercase">
                    Galería de Vídeos Renderizados (/output/)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Historial de vídeos generados registrados en <code className="text-zinc-300">historial_renders.json</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRendersGallery(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 my-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between">
              <span>📁 Ubicación en disco: <b>/output/</b></span>
              <a
                href="/output/video aot 1.mp4"
                download="video_aot_1.mp4"
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Muestra MP4</span>
              </a>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1">
              {loadingRenders ? (
                <div className="py-12 text-center text-zinc-400 text-xs font-mono">
                  Cargando vídeos renderizados...
                </div>
              ) : rendersList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                  No hay vídeos registrados en el historial de renders todavía.
                </div>
              ) : (
                rendersList.slice(0, 50).map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-rose-400 shrink-0 font-mono text-[10px] font-bold">
                        MP4
                      </div>
                      <div>
                        <span className="font-bold text-white block">{r.filename}</span>
                        <span className="text-[11px] text-zinc-400 line-clamp-1">{r.titulo} ({r.anime})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/output/${r.filename}`}
                        download={r.filename}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowRendersGallery(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
