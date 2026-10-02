import json
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ANIMES_FILE = os.path.join(BASE_DIR, "animes.json")
CLIPS_DIR = os.path.join(BASE_DIR, "clips")
RAW_DIR = os.path.join(BASE_DIR, "footage_raw")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
BGM_DIR = os.path.join(BASE_DIR, "bgm")
LOCK_FILE = os.path.join(BASE_DIR, "pipeline.lock")

def check_lock():
    if os.path.exists(LOCK_FILE):
        print("⚠️ Advertencia: Existe un pipeline en ejecución o hubo un cierre abrupto anterior.")
        print("Elimina manualmente 'pipeline.lock' si estás seguro de continuar.")
        sys.exit(1)
    with open(LOCK_FILE, "w") as f:
        f.write("LOCKED")

def release_lock():
    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)

def load_animes() -> dict:
    if not os.path.exists(ANIMES_FILE): return {}
    try:
        with open(ANIMES_FILE, "r", encoding="utf-8") as f: return json.load(f)
    except: return {}

def count_clips(tag: str) -> int:
    target_folder = os.path.join(CLIPS_DIR, tag)
    if not os.path.exists(target_folder) or not os.path.isdir(target_folder): return 0
    return len([f for f in os.listdir(target_folder) if f.lower().endswith(".mp4")])

def count_raw(tag: str) -> int:
    path = os.path.join(RAW_DIR, tag)
    if not os.path.exists(path): return 0
    return len([f for f in os.listdir(path) if f.lower().endswith((".mp4", ".mkv", ".avi", ".mov", ".webm"))])

def count_pending_uploads() -> int:
    if not os.path.exists(OUTPUT_DIR): return 0
    pending = 0
    for f in os.listdir(OUTPUT_DIR):
        if f.lower().endswith(".mp4") and not f.startswith("temp_"):
            if os.path.exists(os.path.join(OUTPUT_DIR, f"{f.rsplit('.', 1)[0]}.txt")): pending += 1
    return pending

def show_dashboard():
    animes = load_animes()
    print("\n" + "=" * 70)
    print("📊 DASHBOARD GENERAL - EXPEDIENTE ANIME (VERSIÓN ALTA RETENCIÓN)")
    print("=" * 70)
    if not animes:
        print("⚠️ No hay animes registrados en 'animes.json'.")
    else:
        for tag, data in animes.items():
            raw_count = count_raw(tag)
            clips_count = count_clips(tag)
            shorts_posibles = clips_count // 30 
            raw_str = f"({raw_count} raw pendientes)" if raw_count > 0 else ""
            print(f" • {data.get('nombre', tag):<20} [{tag}]: {clips_count:>4} clips -> {shorts_posibles:>2} Shorts listos {raw_str}")
    print("-" * 70)
    print(f"📦 Vídeos en 'output/' listos para subir a YouTube: {count_pending_uploads()}")
    print("=" * 70)

def run_step(script_name: str, title: str) -> bool:
    target_script = os.path.join(BASE_DIR, script_name)
    if not os.path.exists(target_script):
        print(f"\n❌ Error: No se encontró '{script_name}'.")
        return False
    print(f"\n🚀 === {title} ===")
    res = subprocess.run([sys.executable, target_script])
    if res.returncode != 0:
        print(f"\n❌ Error Crítico: La fase '{title}' abortó inesperadamente.")
        return False
    return True

def main():
    check_lock()
    try:
        while True:
            show_dashboard()
            print("\n🎛️  PANEL DE CONTROL:")
            print("  0. 📥 Descargar metraje desde URL (download_footage.py)")
            print("  1. ✂️  Trocear metraje pendiente (slice_footage.py)")
            print("  2. 🤖 Generar guiones IA 'Deep Web' (generate_scripts.py)")
            print("  3. ⚡ Ensamblar vídeos con Subs y Música (auto_shorts.py)")
            print("  4. 🔥 MODO PRODUCCIÓN LOCAL (1 -> 2 -> 3 en cadena)")
            print("  5. 📤 Subir Shorts terminados a YouTube (upload_youtube.py)")
            print("  6. 🚀 CICLO TOTAL END-TO-END (1 -> 2 -> 3 -> 5)")
            print("  7. Salir")

            opcion = input("\nSelecciona una opción (0-7): ").strip()
            
            if opcion == "0": run_step("download_footage.py", "DESCARGADOR DE METRAJE")
            elif opcion == "1": run_step("slice_footage.py", "TROCEANDO METRAJE RAW")
            elif opcion == "2": run_step("generate_scripts.py", "GENERANDO GUIONES")
            elif opcion == "3": run_step("auto_shorts.py", "ENSAMBLANDO VÍDEOS")
            elif opcion == "4":
                if run_step("slice_footage.py", "PASO 1: TROCEADO"):
                    if run_step("generate_scripts.py", "PASO 2: GUIONES"):
                        run_step("auto_shorts.py", "PASO 3: ENSAMBLAJE")
            elif opcion == "5": run_step("upload_youtube.py", "PUBLICACIÓN EN YOUTUBE")
            elif opcion == "6":
                if run_step("slice_footage.py", "PASO 1: TROCEADO"):
                    if run_step("generate_scripts.py", "PASO 2: GUIONES"):
                        if run_step("auto_shorts.py", "PASO 3: ENSAMBLAJE"):
                            run_step("upload_youtube.py", "PASO 4: SUBIDA A YOUTUBE")
            elif opcion == "7": break
            else: print("\n⚠️ Opción no válida.")
    finally:
        release_lock()

if __name__ == "__main__": main()