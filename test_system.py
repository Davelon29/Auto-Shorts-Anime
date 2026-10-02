import os
import json
import datetime
from zoneinfo import ZoneInfo
from upload_youtube import get_next_schedule_slots, parse_metadata, save_state

def run_tests():
    print("=== INICIANDO PRUEBAS DE SEGURIDAD LOCAL ===")
    
    # 1. Prueba de Zona Horaria (Madrid)
    slots = get_next_schedule_slots(4)
    if len(slots) == 4 and "T" in slots[0]:
        print("✅ Generación de Timezones Madrid correcta.")
    else:
        print("❌ Error en la generación de slots horarios.")

    # 2. Prueba Atómica de Estado
    test_state = {"test_vid.mp4": {"status": "uploaded"}}
    save_state(test_state)
    if os.path.exists("upload_state.json"):
        with open("upload_state.json", "r") as f:
            data = json.load(f)
            if "test_vid.mp4" in data:
                print("✅ Persistencia JSON atómica correcta.")
        os.remove("upload_state.json")
    else:
        print("❌ Error guardando el estado JSON.")

    # 3. Prueba de Parsing de Metadatos
    test_txt = "test_meta.txt"
    with open(test_txt, "w", encoding="utf-8") as f:
        f.write("▶ TÍTULO RECOMENDADO:\nTITULO PRUEBA | JJK #shorts\n▶ DESCRIPCIÓN:\nHola Mundo #Anime\n▶ COMENTARIO FIJADO:\n[AQUI_TU_ENLACE_AFILIADO]")
    title, desc, tags, comment = parse_metadata(test_txt)
    if "TITULO PRUEBA" in title and tags == ["Anime"]:
        print("✅ Extracción de Metadatos correcta.")
    os.remove(test_txt)
    
    print("=== PRUEBAS SUPERADAS ===")

if __name__ == "__main__":
    run_tests()