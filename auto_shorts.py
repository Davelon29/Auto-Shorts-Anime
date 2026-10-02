import asyncio
import json
import os
import random
import re
import subprocess
import sys
import time
import requests
import torch
import whisper
import edge_tts

# SEGURIDAD: API Key desde el entorno
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    sys.exit("❌ ERROR CRÍTICO: Falta la variable de entorno GEMINI_API_KEY.")

CLIPS_DIR = "clips"
OUTPUT_DIR = "output"
BGM_DIR = "bgm"
SCRIPTS_FILE = "guiones.json"
HISTORY_FILE = "historial_renders.json"
ANIMES_FILE = "animes.json"

CLIP_LEN = 2.0
MIN_CLIPS_REQUERIDOS = 30

FALLBACK_VOICE = "es-ES-AlvaroNeural" 
FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]

ANGULOS_TEMATICOS = [
    "Un error de continuidad gravísimo en el manga que el anime tuvo que tapar en secreto",
    "Una conexión perturbadora con crímenes o eventos históricos reales",
    "La regla biológica oculta que hace que sus poderes sean una maldición",
    "Un mensaje oculto en el opening o escenarios que nadie notó"
]

PROMPT_SISTEMA = """
Eres un ingeniero de retención y guionista de YouTube Shorts.
Tu objetivo es crear un guion de ritmo frenético (160-190 palabras).
REGLAS: Primera frase impactante, NO contar la trama, dejar la frase final cortada.
PROHIBIDO usar las palabras "secreto" u "oscuro" en el título. Título máximo 6 palabras.
Devuelve JSON puro: {"titulo": "...", "texto": "..."}
"""

def extract_clean_json(text: str) -> dict:
    match = re.search(r'\{[\s\S]*\}', text)
    if match: return json.loads(match.group(0))
    return json.loads(text)

def load_animes_config() -> dict:
    if os.path.exists(ANIMES_FILE):
        try:
            with open(ANIMES_FILE, "r", encoding="utf-8") as f: return json.load(f)
        except: pass
    return {}

def load_history() -> dict:
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f: return json.load(f)
        except: pass
    return {}

def detect_gpu_encoder() -> tuple[str, list[str]]:
    return "libx264", ["-preset", "ultrafast", "-crf", "22"]

def fetch_new_script(tag: str, anime_name: str) -> dict | None:
    # Función de fallback rápido (la validación pesada se hace en generate_scripts.py)
    angulo = random.choice(ANGULOS_TEMATICOS)
    payload = {
        "contents": [{"role": "user", "parts": [{"text": PROMPT_SISTEMA + "\n\nAnime: " + anime_name + ". Ángulo: " + angulo}]}],
        "generationConfig": {"temperature": 0.7, "responseMimeType": "application/json"}
    }
    for model in FALLBACK_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
        try:
            res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=6)
            if res.status_code == 200:
                raw = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                data = extract_clean_json(raw)
                return {
                    "id": f"{tag}_auto_{int(time.time())}", "tag": tag, "anime": anime_name,
                    "titulo": data["titulo"].strip().upper(), "voz": FALLBACK_VOICE, "texto": data["texto"],
                }
        except: continue
    return None

def get_media_duration(file_path: str) -> float:
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file_path]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

async def generate_voice(text: str, voice_name: str, output_audio: str):
    print(f"   🎙️ Sintetizando locución de alta velocidad ({voice_name})...")
    try:
        communicate = edge_tts.Communicate(text, voice_name, rate="+12%")
        await communicate.save(output_audio)
        if not os.path.exists(output_audio) or get_media_duration(output_audio) < 1.0:
            raise Exception("Audio vacío")
    except Exception as e:
        print(f"   ❌ Error fatal en la generación de voz: {e}")

def apply_bgm(voice_audio: str, mixed_audio: str):
    os.makedirs(BGM_DIR, exist_ok=True)
    bgms = [f for f in os.listdir(BGM_DIR) if f.lower().endswith(".mp3")]
    if not bgms:
        print("   🔇 No hay música en la carpeta 'bgm/'. El vídeo irá sin música de fondo.")
        import shutil
        shutil.copy(voice_audio, mixed_audio)
        return

    chosen_bgm = os.path.join(BGM_DIR, random.choice(bgms))
    print(f"   🎵 Aplicando música de fondo: {os.path.basename(chosen_bgm)}")
    cmd = [
        "ffmpeg", "-y", "-i", voice_audio, "-stream_loop", "-1", "-i", chosen_bgm,
        "-filter_complex", "[1:a]volume=0.08[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2",
        "-c:a", "libmp3lame", "-q:a", "2", mixed_audio
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

def format_ass_timestamp(seconds: float) -> str:
    h = int(seconds // 3600); m = int((seconds % 3600) // 60); s = int(seconds % 60)
    c = int(round((seconds - int(seconds)) * 100))
    if c >= 100: s += 1; c -= 100
    return f"{h}:{m:02d}:{s:02d}.{c:02d}"

def create_ass_subtitles(whisper_model, audio_path: str, ass_path: str, title_text: str, duration: float, use_cuda: bool):
    print(f"   📝 Generando subtítulos dinámicos (Whisper {'CUDA' if use_cuda else 'CPU'})...")
    result = whisper_model.transcribe(audio_path, language="es", task="transcribe", fp16=use_cuda, word_timestamps=True)
    
    ass_content = f"[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nScaledBorderAndShadow: yes\n"
    ass_content += "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
    ass_content += "Style: TitleTop,Arial Black,58,&H0000D7FF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,4,8,40,40,240,1\n"
    ass_content += "Style: SubsDynamic,Arial Black,65,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,3,5,60,60,750,1\n"
    ass_content += "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    ass_content += f"Dialogue: 0,0:00:00.00,{format_ass_timestamp(3.5)},TitleTop,,0,0,0,,{title_text.upper()}\n"
    
    for seg in result.get("segments", []):
        words = seg.get("words", [])
        if not words: continue
        chunk = []
        start_t = words[0]["start"]
        for i, w in enumerate(words):
            chunk.append(w["word"].strip().upper())
            if len(chunk) >= 2 or i == len(words) - 1:
                end_t = w["end"]
                text = " ".join(chunk)
                text = re.sub(r'[^\w\s¿?¡!]', '', text)
                ass_content += f"Dialogue: 1,{format_ass_timestamp(start_t)},{format_ass_timestamp(end_t)},SubsDynamic,,0,0,0,,{text}\n"
                chunk = []
                if i < len(words) - 1: start_t = words[i+1]["start"]
    with open(ass_path, "w", encoding="utf-8") as f: f.write(ass_content)

def get_clips_for_tag(clips_dir: str, tag: str) -> list:
    matching_clips = []
    target_folder = os.path.join(clips_dir, tag)
    if os.path.exists(target_folder) and os.path.isdir(target_folder):
        for fname in os.listdir(target_folder):
            if fname.lower().endswith((".mp4", ".mkv", ".webm")):
                matching_clips.append(os.path.join(target_folder, fname))
    return matching_clips

def get_next_video_filename(output_dir: str, tag: str) -> str:
    pattern = re.compile(rf"^video[ _]{re.escape(tag)}[ _](\d+)\.mp4$", re.IGNORECASE)
    existing_numbers = []
    if os.path.exists(output_dir):
        for fname in os.listdir(output_dir):
            match = pattern.match(fname)
            if match: existing_numbers.append(int(match.group(1)))
    next_num = max(existing_numbers) + 1 if existing_numbers else 1
    return os.path.join(output_dir, f"video {tag} {next_num}.mp4")

def export_video_metadata(txt_path: str, video_title: str, tag: str, script_text: str, animes_cfg: dict):
    hashtags = "#Anime #Shorts #CuriosidadesAnime"
    anime_name = tag
    if tag in animes_cfg:
        hashtags = animes_cfg[tag].get("hashtags", hashtags)
        anime_name = animes_cfg[tag].get("nombre", tag)

    sentences = [s.strip() for s in script_text.split(".") if s.strip()]
    cta = sentences[-1] if sentences else "¿Qué opinas? Déjamelo en los comentarios 👇"

    titulo_final = f"{video_title.strip().upper()} | {anime_name} #shorts"
    if len(titulo_final) > 95: titulo_final = titulo_final[:92] + "..."

    content = f"""▶ TÍTULO RECOMENDADO:
{titulo_final}

▶ DESCRIPCIÓN:
{script_text[:120]}...

{cta}

{hashtags}

▶ COMENTARIO FIJADO:
📌 "{cta}"
🔥 Juega gratis y llévate 50 tiradas con este enlace: [AQUI_TU_ENLACE_AFILIADO]
"""
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(content)

def assemble_short(script_data: dict, whisper_model, history: dict, encoder: str, encoder_args: list[str], animes_cfg: dict, use_cuda: bool):
    video_id = script_data.get("id", "short")
    tag = script_data.get("tag", "")
    anime_name_script = script_data.get("anime", "")
    
    if not tag and anime_name_script:
        for key, config in animes_cfg.items():
            if config.get("nombre") == anime_name_script:
                tag = key; break
                
    if not tag:
        print(f"⏭️️ SALTANDO: No se pudo identificar el tag para '{video_id}'.")
        return

    anime_name = animes_cfg.get(tag, {}).get("nombre", tag)
    available_clips = get_clips_for_tag(CLIPS_DIR, tag)
    
    if len(available_clips) < MIN_CLIPS_REQUERIDOS:
        print(f"\n⏭️ SALTANDO '{anime_name}': Quedan {len(available_clips)} clips (mínimo {MIN_CLIPS_REQUERIDOS}).")
        return

    if video_id in history and os.path.exists(os.path.join(OUTPUT_DIR, history[video_id])):
        nuevo = fetch_new_script(tag, anime_name)
        if nuevo: script_data = nuevo; video_id = nuevo["id"]
        else: return

    texto = script_data.get("texto", "")
    titulo = script_data.get("titulo", "DATO CURIOSO DE ANIME")
    temp_voice = f"temp_{video_id}_voice.mp3"
    temp_mixed = f"temp_{video_id}_mixed.mp3"
    temp_bg = f"temp_{video_id}_bg.mp4"
    temp_ass = f"temp_{video_id}.ass"; concat_list = f"concat_{video_id}.txt"

    print("\n" + "=" * 65 + f"\n🎬 EXPEDIENTE DESCLASIFICADO: {titulo}\n🏷️  Anime: {anime_name} | Tag: {tag}\n" + "-" * 65)

    try:
        print(f"▶ Montando: [{video_id}]")
        asyncio.run(generate_voice(texto, FALLBACK_VOICE, temp_voice))
        apply_bgm(temp_voice, temp_mixed)
        duration = get_media_duration(temp_mixed)

        needed_clips = int(duration // CLIP_LEN) + 2
        out_path = get_next_video_filename(OUTPUT_DIR, tag)
        out_name = os.path.basename(out_path)

        # Muestreo seguro sin eliminar recursos
        selected_clips = random.sample(available_clips, min(needed_clips, len(available_clips)))
        with open(concat_list, "w", encoding="utf-8") as f:
            for c in selected_clips: 
                f.write(f"file '{os.path.abspath(c).replace(chr(92), '/')}'\n")

        print(f"   🎬 Concatenando fondo visual frenético...")
        subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list, "-t", str(duration), "-c:v", "copy", "-an", temp_bg], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        create_ass_subtitles(whisper_model, temp_mixed, temp_ass, titulo, duration, use_cuda)

        print(f"   ⚡ Renderizando producto final (GPU {encoder})...")
        clean_ass = os.path.abspath(temp_ass).replace(chr(92), "/").replace(":", "\\:")
        subs_filter = f"subtitles='{clean_ass}'"
        
        # Ejecución controlada de FFmpeg con validación de retorno
        res = subprocess.run(["ffmpeg", "-y", "-i", temp_bg, "-i", temp_mixed, "-vf", subs_filter, "-c:v", encoder] + encoder_args + ["-c:a", "aac", "-b:a", "192k", "-shortest", out_path])
        
        if res.returncode != 0 or not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
            print("   ❌ Error: Fallo crítico en el renderizado de FFmpeg.")
            return

        print(f"   ✅ ¡EXPEDIENTE COMPLETADO! -> {out_name}")
        export_video_metadata(out_path.rsplit(".", 1)[0] + ".txt", titulo, tag, texto, animes_cfg)
        
        history[video_id] = out_name
        tmp_history = HISTORY_FILE + ".tmp"
        with open(tmp_history, "w", encoding="utf-8") as f: json.dump(history, f, ensure_ascii=False, indent=2)
        os.replace(tmp_history, HISTORY_FILE)

    finally:
        # Limpieza ESTRICTAMENTE de temporales (NUNCA os.remove(c) sobre la carpeta clips)
        for t in [temp_voice, temp_mixed, temp_bg, temp_ass, concat_list]:
            if os.path.exists(t):
                try: os.remove(t)
                except: pass

def main():
    if not os.path.exists(SCRIPTS_FILE): sys.exit(1)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    history = load_history()
    use_cuda = torch.cuda.is_available()
    print(f"🧠 Inicializando I.A. Visual y Auditiva (CUDA: {'SÍ' if use_cuda else 'NO'})")
    whisper_model = whisper.load_model("base", device="cuda" if use_cuda else "cpu")
    encoder, encoder_args = detect_gpu_encoder()

    with open(SCRIPTS_FILE, "r", encoding="utf-8") as f: scripts = json.load(f)
    for item in scripts:
        assemble_short(item, whisper_model, history, encoder, encoder_args, load_animes_config(), use_cuda)

if __name__ == "__main__": main()