import os
import time
import json
import shutil
import datetime
import gc
from zoneinfo import ZoneInfo
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl" 
]

OUTPUT_DIR = "output"
UPLOADED_DIR = "uploaded"
STATE_FILE = "upload_state.json"

def get_authenticated_service():
    creds = None
    if os.path.exists('token_youtube.json'):
        creds = Credentials.from_authorized_user_file('token_youtube.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('client_secrets.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token_youtube.json', 'w') as token:
            token.write(creds.to_json())
    return build('youtube', 'v3', credentials=creds)

def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f: return json.load(f)
        except: pass
    return {}

def save_state(state: dict):
    tmp_file = STATE_FILE + ".tmp"
    with open(tmp_file, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)
    os.replace(tmp_file, STATE_FILE)

def move_to_uploaded(filepath: str):
    os.makedirs(UPLOADED_DIR, exist_ok=True)
    base = os.path.basename(filepath)
    dst = os.path.join(UPLOADED_DIR, base)
    if os.path.exists(dst):
        name, ext = os.path.splitext(base)
        dst = os.path.join(UPLOADED_DIR, f"{name}_{int(time.time())}{ext}")
    shutil.move(filepath, dst)

def parse_metadata(txt_path):
    with open(txt_path, "r", encoding="utf-8") as f:
        content = f.read()

    title, description, comment = "", "", ""
    if "▶ TÍTULO RECOMENDADO:" in content:
        title = content.split("▶ TÍTULO RECOMENDADO:")[1].split("▶ DESCRIPCIÓN:")[0].strip()
    if "▶ DESCRIPCIÓN:" in content and "▶ COMENTARIO FIJADO:" in content:
        description = content.split("▶ DESCRIPCIÓN:")[1].split("▶ COMENTARIO FIJADO:")[0].strip()
    if "▶ COMENTARIO FIJADO:" in content:
        comment = content.split("▶ COMENTARIO FIJADO:")[1].strip()

    tags = [word.strip("#") for word in description.split() if word.startswith("#")]
    return title, description, tags, comment

def get_next_schedule_slots(num_slots):
    slots = []
    base_times = [(14, 30), (17, 30), (20, 30), (23, 30)]
    tz_madrid = ZoneInfo("Europe/Madrid")
    now_madrid = datetime.datetime.now(tz_madrid)
    
    days_offset = 0
    while len(slots) < num_slots:
        for h, m in base_times:
            target_time = datetime.datetime(
                now_madrid.year, now_madrid.month, now_madrid.day, h, m, tzinfo=tz_madrid
            ) + datetime.timedelta(days=days_offset)
            
            if target_time > now_madrid:
                slots.append(target_time.isoformat())
                if len(slots) == num_slots:
                    return slots
        days_offset += 1
    return slots

def post_comment(youtube, video_id, comment_text):
    print(f"   💬 Publicando comentario opcional...")
    body = {
        "snippet": {
            "videoId": video_id,
            "topLevelComment": { "snippet": { "textOriginal": comment_text } }
        }
    }
    try:
        time.sleep(4)
        youtube.commentThreads().insert(part="snippet", body=body).execute()
        print("   📌 Comentario publicado con éxito.")
    except HttpError as e:
        if e.resp.status == 403:
            print("   ⚠️ YouTube prohíbe comentar en vídeos programados (estado Privado).")
        else:
            print(f"   ⚠️ Fallo al comentar: {e}")
    except Exception as e:
        print(f"   ⚠️ Error inesperado al publicar comentario: {e}")

def main():
    if not os.path.exists(OUTPUT_DIR): return

    raw_files = sorted(os.listdir(OUTPUT_DIR))
    mp4_files = [f for f in raw_files if f.endswith(".mp4") and not f.startswith("temp_")]
    valid_videos = []
    
    for mp4 in mp4_files:
        txt_path = os.path.join(OUTPUT_DIR, mp4.rsplit(".", 1)[0] + ".txt")
        if os.path.exists(txt_path) and os.path.getsize(os.path.join(OUTPUT_DIR, mp4)) > 0:
            valid_videos.append((mp4, txt_path))

    if not valid_videos:
        print("⚠️ No hay vídeos válidos en 'output/' listos para subir.")
        return

    print("\n🚀 === PUBLICACIÓN EN YOUTUBE ===")
    try:
        youtube = get_authenticated_service()
    except Exception as e:
        print(f"❌ Error de autenticación: {e}")
        return

    state = load_state()
    slots = get_next_schedule_slots(len(valid_videos))
    idx_slot = 0

    for mp4_file, txt_path in valid_videos:
        video_path = os.path.join(OUTPUT_DIR, mp4_file)
        
        if state.get(mp4_file, {}).get("status") == "uploaded":
            print(f"⏭️ Omitiendo '{mp4_file}': ya está registrado como subido.")
            try:
                move_to_uploaded(video_path)
                move_to_uploaded(txt_path)
            except: pass
            continue

        title, description, tags, comment = parse_metadata(txt_path)
        
        if "[AQUI_TU_ENLACE_AFILIADO]" in description or not title:
            print(f"⏭️ Omitiendo '{mp4_file}': El texto es inválido o falta configurar el enlace de afiliado.")
            continue

        publish_at = slots[idx_slot]
        idx_slot += 1

        print(f"\n▶ Asignando vídeo [{idx_slot}/{len(valid_videos)}]: {mp4_file}")
        print(f"   📌 Título: {title}")
        print(f"   📅 Programado local: {publish_at}")

        body = {
            "snippet": { "title": title, "description": description, "tags": tags, "categoryId": "1" },
            "status": { "privacyStatus": "private", "publishAt": publish_at }
        }
        
        try:
            media = MediaFileUpload(video_path, chunksize=1024*1024*2, resumable=True, mimetype="video/mp4")
            request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
            
            response = None
            print(f"   🚀 Subiendo...")
            while response is None:
                status_progress, response = request.next_chunk()
                if status_progress:
                    print(f"   ⏳ Progreso: {int(status_progress.progress() * 100)}%")
                    
            video_id = response.get("id")
            print(f"   ✅ URL: https://youtube.com/shorts/{video_id}")
            
            # Liberación de memoria forzada para evitar WinError 32
            del request
            del media
            gc.collect()
            time.sleep(1)
            
            state[mp4_file] = {"status": "uploaded", "youtube_id": video_id, "scheduled_at": publish_at}
            save_state(state)
            
            move_to_uploaded(video_path)
            move_to_uploaded(txt_path)
            
            if comment and not publish_at:
                post_comment(youtube, video_id, comment)
            elif publish_at:
                print("   💡 El enlace de afiliación está seguro en la Descripción (Comentario bloqueado hasta estreno).")

        except HttpError as e:
            print(f"   ❌ Fallo de API al subir {mp4_file}: HTTP {e.resp.status}")
            state[mp4_file] = {"status": "error", "error_code": e.resp.status}
            save_state(state)
            break 
        except Exception as e:
            print(f"   ❌ Error interno al subir {mp4_file}: {e}")

if __name__ == "__main__":
    main()