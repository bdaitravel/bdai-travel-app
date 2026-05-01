# Mejora 04 — Tipado correcto de Leaflet (`@types/leaflet`)

## Qué ganas
`SchematicMap.tsx` accede a Leaflet a través de `window.L as any`. Esto significa que TypeScript no valida ninguna llamada a la API de Leaflet: puedes llamar a un método que no existe, pasar parámetros en el orden equivocado o usar una opción deprecada, y el compilador no dirá nada. El error llega en runtime, en el móvil del usuario.

Instalar `@types/leaflet` cuesta 30 segundos y aporta:
1. **Autocompletado real** de toda la API de Leaflet en el IDE.
2. **Errores de compilación** si usas la API de Leaflet incorrectamente.
3. **Eliminar el hack `window.L as any`**, que es un code smell que confunde a futuros desarrolladores.

**Beneficio concreto:** El mapa es la funcionalidad más crítica de la app — cualquier bug de Leaflet se detecta en el build, no en producción.

---

## Prompt para el agente

```
Eres un experto en TypeScript trabajando en el proyecto BDAI Travel App (React + Vite + TypeScript estricto).

Tu tarea es reemplazar el acceso a Leaflet via `window.L as any` por el import tipado oficial de Leaflet.

**Contexto:**
- `src/components/SchematicMap.tsx` usa Leaflet cargado como script global (via `window.L`).
- `leaflet` ya está en las dependencias de producción del `package.json`.
- `@types/leaflet` NO está instalado todavía.
- Leaflet se carga como script externo en `index.html` o similar (verifica primero).

**Pasos:**

1. **Instala el paquete de tipos** ejecutando en la terminal del proyecto:
   ```
   npm install --save-dev @types/leaflet
   ```

2. **Verifica cómo se carga Leaflet actualmente:**
   - Si se carga via `<script>` en `index.html`, Leaflet está disponible como global `L`. En este caso el import correcto es:
     ```typescript
     import L from 'leaflet';
     import 'leaflet/dist/leaflet.css';
     ```
     Y debes asegurarte de que Leaflet NO esté duplicado (script en HTML + import en JS). Si está en el HTML como CDN, **elimínalo del HTML** y deja solo el import en el componente.
   - Si ya se importa de otra forma, adáptalo.

3. **En `SchematicMap.tsx`:**
   - Elimina todas las referencias a `window.L` y `window.L as any`.
   - Sustituye cada `window.L.map(...)`, `window.L.tileLayer(...)`, etc. por `L.map(...)`, `L.tileLayer(...)` etc. usando el import del paso anterior.
   - Tipa las variables locales que almacenan instancias de Leaflet:
     ```typescript
     const mapRef = useRef<L.Map | null>(null);
     const markersRef = useRef<L.Marker[]>([]);
     const polylineRef = useRef<L.Polyline | null>(null);
     ```

4. **No cambies la lógica de negocio** del mapa (markers, popups, geofencing, auto-follow). Solo el tipado.

**Reglas obligatorias:**
- Ejecutar `npm run build` al final. El Exit code debe ser 0.
- Si Leaflet se cargaba como CDN en `index.html`, eliminar ese script tag para evitar cargar la librería dos veces.
- Respetar todas las reglas del archivo `AGENTS.md` del proyecto.
```
