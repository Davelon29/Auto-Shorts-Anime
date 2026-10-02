import os
import subprocess

RAW_DIR = "footage_raw"
CLIPS_DIR = "clips"
CLIP_DURATION = 2.0

def get_video_duration(file_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", file_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(result.stdout.strip())

def process_folder(category: str, source_folder: str, target_folder: str):
    os.makedirs(target_folder, exist_ok=True)
    valid_extensions = (".mp4", ".mkv", ".avi", ".mov", ".webm")
    files = [f for f in os.listdir(source_folder) if f.lower().endswith(valid_extensions)]

    if not files: return
    print(f"\n📁 Categoría '{category}': {len(files)} vídeo(s) encontrado(s).")

    existing_clips = [f for f in os.listdir(target_folder) if f.startswith(f"{category}_") and f.endswith(".mp4")]
    clip_counter = len(existing_clips)

    canvas_filter = (
        "split=2[bg][fg];"
        "[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=30,eq=brightness=-0.2[bg_blur];"
        "[fg]scale=1080:-2,eq=contrast=1.15:saturation=1.2:brightness=0.03,unsharp=5:5:1.0:5:5:0.0[fg_box];"
        "[bg_blur][fg_box]overlay=0:(H-h)/2"
    )

    for file in files:
        file_path = os.path.join(source_folder, file)
        try: total_sec = int(get_video_duration(file_path))
        except Exception as e:
            print(f"❌ Error al medir duración de '{file}': {e}")
            continue

        print(f"   🎬 Troceando '{file}' ({total_sec}s)...")
        start_point = 25
        end_point = max(start_point + 10, total_sec - 35)
        clips_generados_este_video = 0

        for start in range(start_point, end_point, 3):
            out_name = f"{category}_{clip_counter:04d}.mp4"
            out_file = os.path.join(target_folder, out_name)

            cmd = [
                "ffmpeg", "-y", "-ss", str(start), "-i", file_path,
                "-t", str(CLIP_DURATION), "-an", "-vf", canvas_filter,
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", 
                "-r", "30", "-video_track_timescale", "90000", out_file
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            clip_counter += 1
            clips_generados_este_video += 1

        print(f"   ✅ Extraídos {clips_generados_este_video} clips de '{file}'.")
        try:
            os.remove(file_path)
            print(f"   🗑️ Raw original '{file}' eliminado con éxito.")
        except: pass

    print(f"   📊 Total clips listos en '{category}': {clip_counter}")

def main():
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(CLIPS_DIR, exist_ok=True)
    items = os.listdir(RAW_DIR)
    subfolders = [d for d in items if os.path.isdir(os.path.join(RAW_DIR, d))]

    if subfolders:
        for folder in subfolders:
            src = os.path.join(RAW_DIR, folder)
            dst = os.path.join(CLIPS_DIR, folder)
            process_folder(folder, src, dst)
    else:
        process_folder("general", RAW_DIR, os.path.join(CLIPS_DIR, "general"))
    print("\n🎉 Proceso de troceado finalizado.")

if __name__ == "__main__": main()