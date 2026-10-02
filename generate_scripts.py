import json
import os
import random
import re
import time
import sys
import requests

# SEGURIDAD: Lectura estricta desde variable de entorno
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    sys.exit("❌ ERROR CRÍTICO: La variable de entorno GEMINI_API_KEY no está configurada. Deteniendo ejecución.")

ANIMES_FILE = "animes.json"
SCRIPTS_FILE = "guiones.json"
CLIPS_DIR = "clips"
MIN_CLIPS_REQUERIDOS = 30

FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]

ANGULOS_TEMATICOS = [
    "Un error de continuidad gravísimo en el manga que el anime tuvo que tapar en secreto",
    "Una conexión perturbadora con crímenes o eventos históricos reales",
    "El borrador original de la obra donde el protagonista era el villano o moría trágicamente",
    "Un subtexto psicológico retorcido sobre el trauma de un personaje secundario",
    "La regla biológica o física oculta que hace que sus poderes sean una maldición",
    "Un mensaje oculto en el opening, ending o escenarios que nadie notó"
]

PROMPT_SISTEMA = """
Eres un ingeniero de retención y guionista de YouTube Shorts.
Tu objetivo es crear un guion de ritmo frenético que supere el 100% de retención.

REGLAS ESTRUCTURALES OBLIGATORIAS:
1. EL GANCHO DE RUPTURA: La primera frase debe ser una afirmación brutal o contraintuitiva. 
2. NARRATIVA TRANSFORMATIVA: Revela el significado oculto, los secretos de producción del mangaka o el terror psicológico. NUNCA describas la trama básica.
3. PREGUNTA DE DEBATE ANTICIPADA: Lanza la pregunta divisiva para los comentarios ANTES de la última frase.
4. EL BUCLE PERFECTO: La ÚLTIMA frase DEBE quedar cortada e incompleta, diseñada para encajar gramaticalmente con la PRIMERA frase del guion. 

REGLAS DE TÍTULO (CRÍTICO): 
- ¡PROHIBIDO USAR LA PALABRA "SECRETO" O "OSCURO"!
- El título debe ser agresivo, de máximo 8 palabras.
- Tienes que crear un título COMPLETAMENTE DIFERENTE Y ÚNICO cada vez.

Devuelve EXCLUSIVAMENTE formato JSON puro (sin comillas Markdown ni acotaciones de Markdown):
{"titulo": "TÍTULO ÚNICO Y DIFERENTE", "texto": "Guion corrido sin acotaciones..."}
"""

def extract_clean_json(text: str) -> dict:
    match = re.search(r'\{[\s\S]*\}', text)
    if match: return json.loads(match.group(0))
    return json.loads(text)

def validate_script_quality(titulo: str, texto: str) -> bool:
    """Valida que la IA haya respetado las reglas críticas antes de guardar."""
    titulo_clean = titulo.strip()
    
    # 1. Validación de palabras prohibidas
    if re.search(r'\b(secreto|oscuro|secretos|oscuros)\b', titulo_clean, re.IGNORECASE):
        print(f"   ⚠️ Rechazado: El título usa palabras prohibidas -> '{titulo_clean}'")
        return False
        
    # 2. Tolerancia ampliada de título (máx 9 palabras)
    palabras_titulo = titulo_clean.split()
    if len(palabras_titulo) > 9:
        print(f"   ⚠️ Rechazado: Título demasiado largo ({len(palabras_titulo)} palabras) -> '{titulo_clean}'")
        return False
        
    # 3. Tolerancia ampliada de guion (80-260 palabras) para modelos Flash
    palabras_texto = len(texto.split())
    if palabras_texto < 80 or palabras_texto > 260:
        print(f"   ⚠️ Rechazado: Longitud de guion fuera de rango ({palabras_texto} palabras).")
        return False
        
    return True

def count_clips(tag: str) -> int:
    target_folder = os.path.join(CLIPS_DIR, tag)
    if not os.path.exists(target_folder) or not os.path.isdir(target_folder):
        return 0
    return len([f for f in os.listdir(target_folder) if f.lower().endswith(".mp4")])

def load_animes_config() -> dict:
    if os.path.exists(ANIMES_FILE):
        try:
            with open(ANIMES_FILE, "r", encoding="utf-8") as f: return json.load(f)
        except: pass
    return {}

def main():
    animes = load_animes_config()
    if not animes:
        print("⚠️ No hay animes configurados en 'animes.json'.")
        return

    scripts_existentes = []
    if os.path.exists(SCRIPTS_FILE):
        try:
            with open(SCRIPTS_FILE, "r", encoding="utf-8") as f: scripts_existentes = json.load(f)
        except: pass

    print("\n🔍 Analizando clips disponibles para cada anime configurado...")
    nuevos_guiones = []

    for tag, data in animes.items():
        anime_name = data.get("nombre", tag)
        clips_disp = count_clips(tag)
        shorts_posibles = clips_disp // MIN_CLIPS_REQUERIDOS

        if shorts_posibles <= 0:
            print(f"⏭️ {anime_name} [{tag}]: {clips_disp} clips (Se necesitan mínimo {MIN_CLIPS_REQUERIDOS}). Saltando...")
            continue

        usados_este_tag = sum(1 for s in scripts_existentes if (s.get("tag") == tag or (not s.get("tag") and s.get("anime") == anime_name)))
        generar_cantidad = max(0, shorts_posibles - usados_este_tag)

        if generar_cantidad == 0:
            continue

        print(f"👉 {anime_name} [{tag}]: {clips_disp} clips -> Generando {generar_cantidad} guion(es)...")
        
        for i in range(generar_cantidad):
            angulo = random.choice(ANGULOS_TEMATICOS)
            payload = {
                "contents": [{"role": "user", "parts": [{"text": PROMPT_SISTEMA + "\n\nAnime: " + anime_name + ". Ángulo: " + angulo}]}],
                "generationConfig": {"temperature": 0.8, "responseMimeType": "application/json"}
            }
            
            exito = False
            for model in FALLBACK_MODELS:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
                try:
                    res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
                    if res.status_code == 200:
                        raw = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                        data_json = extract_clean_json(raw)
                        
                        titulo_ia = data_json.get("titulo", "").strip()
                        texto_ia = data_json.get("texto", "").strip()

                        if not titulo_ia or not texto_ia:
                            continue

                        # Validación restrictiva de la IA
                        if not validate_script_quality(titulo_ia, texto_ia):
                            continue

                        nuevo_script = {
                            "id": f"{tag}_auto_{int(time.time())}_{i}",
                            "tag": tag,
                            "anime": anime_name,
                            "titulo": titulo_ia.upper(),
                            "texto": texto_ia
                        }
                        nuevos_guiones.append(nuevo_script)
                        scripts_existentes.append(nuevo_script)
                        print(f"   [{i+1}/{generar_cantidad}] ✅ \"{titulo_ia}\"")
                        exito = True
                        break
                except Exception as e:
                    continue
            
            if not exito:
                print(f"   [{i+1}/{generar_cantidad}] ❌ Fallo de generación de IA para {tag} o superado límite de reglas.")
            time.sleep(2) # Backoff de seguridad para cuota

    if nuevos_guiones:
        # Escritura atómica (previene corrupción)
        temp_file = SCRIPTS_FILE + ".tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(scripts_existentes, f, ensure_ascii=False, indent=2)
        os.replace(temp_file, SCRIPTS_FILE)
        print(f"\n🎉 ¡Se han añadido {len(nuevos_guiones)} guiones nuevos al archivo!")
    else:
        print("\n✅ No hay guiones nuevos pendientes de generar.")

if __name__ == "__main__": main()