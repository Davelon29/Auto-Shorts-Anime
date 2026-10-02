import json
import os
import sys
import yt_dlp

ANIMES_FILE = "animes.json"
RAW_DIR = "footage_raw"


def load_animes():
    if not os.path.exists(ANIMES_FILE):
        return {}
    with open(ANIMES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def download_video(tag: str, url: str):
    target_dir = os.path.join(RAW_DIR, tag)
    os.makedirs(target_dir, exist_ok=True)

    print(f"\n📥 Descargando vídeo de máxima calidad para [{tag}]...")
    
    # Configuración de yt-dlp para priorizar mp4 a 1080p sin listas de reproducción
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': f'{target_dir}/%(title)s.%(ext)s',
        'noplaylist': True,
        'quiet': False,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print(f"\n✅ ¡Descarga completada con éxito en 'footage_raw/{tag}/'!")
    except Exception as e:
        print(f"\n❌ Error durante la descarga: {e}")


def main():
    animes = load_animes()
    if not animes:
        print("⚠️ No hay animes registrados en 'animes.json'.")
        sys.exit(1)

    print("\n" + "=" * 50)
    print("📥 DESCARGADOR AUTOMÁTICO DE METRAJE")
    print("=" * 50)
    
    # Mostrar opciones disponibles
    tags_disponibles = list(animes.keys())
    for i, tag in enumerate(tags_disponibles, 1):
        print(f" {i}. {animes[tag]['nombre']} [{tag}]")
    
    print(" 0. ❌ Cancelar y salir")
    
    seleccion = input("\nElige el número del anime (ej. 1): ").strip()
    
    if seleccion == "0":
        return
        
    try:
        idx = int(seleccion) - 1
        tag_elegido = tags_disponibles[idx]
    except (ValueError, IndexError):
        print("⚠️ Selección no válida.")
        return

    url = input(f"\nPega el link del vídeo para {animes[tag_elegido]['nombre']}:\n> ").strip()
    if not url:
        print("⚠️ No introdujiste ningún link.")
        return

    download_video(tag_elegido, url)


if __name__ == "__main__":
    main()