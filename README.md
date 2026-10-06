# Auto Shorts Anime Studio

Fábrica automatizada de producción y planificación de YouTube Shorts de anime con alta retención (retención > 100%).

## Características Principales

- **Dashboard & Orquestador de Pipeline**: Control centralizado de las 7 fases del pipeline (descarga, troceado a 2.0s vertical 9:16, guionizado IA, ensamblaje con ducking de música, subidas y ciclo end-to-end).
- **Generador de Guiones IA (Gemini 3.8 Flash)**: Generación de guiones estilo "Expediente Anime / Deep Web" con gancho de ruptura inicial, revelación de producción del mangaka, preguntas divisivas para el debate en comentarios y bucle de audio perfecto.
- **Ensamblador & Preview 9:16**: Previsualizador interactivo estilo smartphone vertical que simula la composición de los micro-clips de 2.0s, el rótulo inicial superior y los subtítulos dinámicos palabra por palabra.
- **Gestión de Metraje & Clips**: Catálogo configurable de animes (`animes.json`), contador de clips disponibles y cálculo de Shorts listos.
- **Planificador de YouTube Studio**: Programación en franjas horarias de máxima audiencia (14:30, 17:30, 20:30 y 23:30) y generación de metadatos optimizados.

## Variables de Entorno

Configura en tu archivo de entorno o plataforma:
```bash
GEMINI_API_KEY=tu_api_key_de_gemini
PORT=3000
```
