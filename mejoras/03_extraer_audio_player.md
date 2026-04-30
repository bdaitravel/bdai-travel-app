# Mejora 03 — Extraer `AudioPlayer` de `TourCard`

## Qué ganas
`TourCard.tsx` tiene 473 líneas porque mezcla dos responsabilidades completamente distintas: renderizar la tarjeta de un tour **y** gestionar la reproducción de audio (velocidad, play/pause, barra de progreso, SHA-256 hash, polling de caché). Esto tiene consecuencias prácticas:

1. **Imposible reutilizar el player**: si en el futuro quieres un mini-reproductor persistente en la barra inferior mientras el usuario navega entre vistas, tendrás que duplicar todo ese código o hacer un refactor costoso.
2. **Bugs cruzados**: un cambio en la lógica de audio puede romper el renderizado de la tarjeta, y viceversa.
3. **Difícil de leer**: un desarrollador nuevo tarda el doble en entender dónde termina la UI de la tarjeta y empieza el audio.

**Beneficio concreto:** `TourCard.tsx` queda por debajo de 250 líneas, el componente `AudioPlayer` es reutilizable desde cualquier vista, y cualquier bug de audio se aísla en un solo fichero.

---

## Prompt para el agente

```
Eres un experto en React + TypeScript trabajando en el proyecto BDAI Travel App.

Tu tarea es extraer la lógica de reproducción de audio del componente `ActiveTourCard` (dentro de `src/components/TourCard.tsx`) a un nuevo componente independiente `src/components/AudioPlayer.tsx`.

**Contexto:**
- `src/components/TourCard.tsx` exporta dos componentes: `TourCard` (tarjeta estática) y `ActiveTourCard` (vista activa del tour con audio).
- `ActiveTourCard` contiene toda la lógica de audio: llamadas a `generateAudio()` del servicio, gestión del estado `audioUrl`, `isLoadingAudio`, `audioSpeed`, control del elemento `<audio>`, manejo de eventos `play/pause/ended/error`, y la UI del player (botones, barra de velocidad).
- El estado de audio en Zustand se gestiona en `src/store/useAppStore.ts` con campos `audioSpeed` y `isAudioPlaying`.
- El servicio de audio está en `src/services/geminiService.ts` con la función `generateAudio(text, language)`.

**Lo que debes hacer:**

1. Crea `src/components/AudioPlayer.tsx` con una interface `AudioPlayerProps`:
   ```typescript
   interface AudioPlayerProps {
     text: string;           // Texto de la parada a narrar
     language: string;       // Idioma para la generación TTS
     stopIndex: number;      // Índice de la parada actual (para invalidar caché interna)
     onError?: (msg: string) => void;
   }
   ```
   
2. Mueve al nuevo componente SOLO la lógica relacionada con audio:
   - Los estados locales `audioUrl`, `isLoadingAudio`, `audioError`
   - El `useEffect` que llama a `generateAudio` cuando cambia la parada
   - El `useRef` del elemento `<audio>`
   - Los handlers `handlePlayPause`, `handleSpeedChange`
   - La UI del player (el bloque JSX con los botones de play/pausa, velocidad y el `<audio>` element)
   - La lectura/escritura del estado Zustand `audioSpeed` e `isAudioPlaying`

3. En `ActiveTourCard`, sustituye todo ese bloque por:
   ```tsx
   <AudioPlayer
     text={currentStop.description}
     language={language}
     stopIndex={currentStopIndex}
     onError={(msg) => toast(msg)}
   />
   ```

4. Asegúrate de que los imports queden limpios en ambos archivos (sin imports huérfanos).

**Reglas obligatorias:**
- NO cambiar la lógica de negocio del audio, solo moverla.
- NO cambiar la UI/estilos del player, solo moverlos.
- El comportamiento visible para el usuario debe ser 100% idéntico antes y después.
- Ejecutar `npm run build` al final. El Exit code debe ser 0.
- Respetar todas las reglas del archivo `AGENTS.md` del proyecto.
```
