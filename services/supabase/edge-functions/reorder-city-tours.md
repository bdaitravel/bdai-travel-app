// services/supabase/edge-functions/reorder-city-tours.md
// EDGE FUNCTION DE USO ÚNICO — Reordena las paradas de un tour ya cacheado usando OSRM
// sin necesidad de regenerar con Gemini ni repetir la verificación GIS.
//
// USO:
//   1. Pegar este código en Supabase Dashboard → Edge Functions → Nueva función: "reorder-city-tours"
//   2. Invocar con POST (ver instrucciones al final del archivo)
//   3. Opcional: eliminar la función cuando ya no sea necesaria
//
// BODY esperado:
//   { "city": "logrono_spain", "language": "es" }
//   Tip: consultar la columna `city` en la tabla `tours_cache` para obtener el slug exacto.

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

// Optimización Haversine local (NN+2-opt+Or-opt) + OSRM /route para polilínea visual.
// NOTA: El servidor público routing.openstreetmap.de NO soporta /trip para foot.

const haversineKmR = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const buildMat = (stops: any[]): number[][] => {
    const n = stops.length, m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const d = haversineKmR(stops[i].latitude, stops[i].longitude, stops[j].latitude, stops[j].longitude); m[i][j] = m[j][i] = d; }
    return m;
};
const nnRoute = (stops: any[], m: number[][]): number[] => {
    const n = stops.length; let best: number[] = [], bestD = Infinity;
    for (let s = 0; s < n; s++) {
        const vis = new Set<number>(), ord: number[] = []; let cur = s;
        while (ord.length < n) {
            if (vis.has(cur)) { let minD = Infinity, nxt = -1; for (let j = 0; j < n; j++) if (!vis.has(j) && m[cur][j] < minD) { minD = m[cur][j]; nxt = j; } if (nxt === -1) break; cur = nxt; }
            ord.push(cur); vis.add(cur);
            let minD = Infinity, nxt = -1; for (let j = 0; j < n; j++) if (!vis.has(j) && m[cur][j] < minD) { minD = m[cur][j]; nxt = j; } if (nxt === -1) break; cur = nxt;
        }
        let d = 0; for (let i = 0; i < ord.length - 1; i++) d += m[ord[i]][ord[i + 1]];
        if (d < bestD) { bestD = d; best = [...ord]; }
    }
    return best;
};
const twoOptR = (order: number[], m: number[][]): number[] => {
    const n = order.length; let imp = true, r = [...order];
    while (imp) { imp = false; for (let i = 0; i < n - 2; i++) for (let j = i + 2; j < n; j++) { if (j === n - 1 && i === 0) continue; const c = m[r[i]][r[i + 1]] + m[r[j]][r[(j + 1) % n]], w = m[r[i]][r[j]] + m[r[i + 1]][r[(j + 1) % n]]; if (w < c - 0.001) { r = [...r.slice(0, i + 1), ...r.slice(i + 1, j + 1).reverse(), ...r.slice(j + 1)]; imp = true; } } }
    return r;
};
const orOptR = (order: number[], m: number[][]): number[] => {
    const dist = (r: number[]) => { let d = 0; for (let i = 0; i < r.length - 1; i++) d += m[r[i]][r[i + 1]]; return d; };
    let imp = true, r = [...order];
    while (imp) { imp = false; for (let p = 0; p < r.length && !imp; p++) { const stop = r[p], wo = r.filter((_: number, i: number) => i !== p); const cur = dist(r); let best = cur - 0.001, bQ = -1; for (let q = 0; q <= wo.length; q++) { const d = dist([...wo.slice(0, q), stop, ...wo.slice(q)]); if (d < best) { best = d; bQ = q; } } if (bQ !== -1) { const w = r.filter((_: number, i: number) => i !== p); r = [...w.slice(0, bQ), stop, ...w.slice(bQ)]; imp = true; } } }
    return r;
};

const reorderWithOSRM = async (stops: any[]): Promise<{ stops: any[]; polyline: string; distance: string; duration: string } | null> => {
    if (!stops || stops.length <= 2) return null;
    try {
        const m = buildMat(stops);
        let order = nnRoute(stops, m); order = twoOptR(order, m); order = orOptR(order, m);
        const opt = order.map((i: number) => stops[i]);
        let distKm = 0;
        for (let i = 0; i < opt.length - 1; i++) distKm += haversineKmR(opt[i].latitude, opt[i].longitude, opt[i + 1].latitude, opt[i + 1].longitude);
        let polyline = '';
        try {
            const coords = opt.map((s: any) => `${s.longitude},${s.latitude}`).join(';');
            const r = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=polyline`, { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' } });
            if (r.ok) { const d = await r.json(); if (d.code === 'Ok') polyline = d.routes?.[0]?.geometry ?? ''; }
        } catch { /* polilínea opcional */ }
        const totalMin = Math.round(distKm * 15 + opt.length * 7.5 + 20);
        const h = Math.floor(totalMin / 60), mins = totalMin % 60;
        const duration = totalMin < 60 ? `${totalMin} min` : (mins > 0 ? `${h}h ${mins}min` : `${h}h`);
        return { stops: opt, polyline, distance: `${distKm.toFixed(1)} km`, duration };
    } catch (e) {
        console.error('[REORDER] Error:', e);
        return null;
    }
};

serve(async (req) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    let city: string, language: string;
    try {
        ({ city, language } = await req.json());
    } catch {
        return new Response('Invalid JSON body', { status: 400 });
    }
    if (!city || !language) return new Response('Missing "city" or "language"', { status: 400 });

    console.log(`[REORDER] Buscando tours_cache para city="${city}" language="${language}"`);

    const { data: cached, error: fetchErr } = await supabase
        .from('tours_cache')
        .select('data, route_polylines')
        .eq('city', city)
        .eq('language', language)
        .maybeSingle();

    if (fetchErr) return new Response(`DB error: ${fetchErr.message}`, { status: 500 });
    if (!cached?.data?.length) return new Response(`No tour encontrado para city="${city}" language="${language}"`, { status: 404 });

    const tours: any[] = cached.data;
    const newPolylines: Record<string, string> = {};
    const updatedTours: any[] = [];
    const log: string[] = [];

    for (const tour of tours) {
        const before = tour.stops.map((s: any) => s.name);
        const result = await reorderWithOSRM(tour.stops);

        if (result) {
            const after = result.stops.map((s: any) => s.name);
            const changed = JSON.stringify(before) !== JSON.stringify(after);
            log.push(`✅ "${tour.title}": ${tour.stops.length} paradas${changed ? ' → REORDENADO' : ' → sin cambios'}`);
            const updated = { ...tour, stops: result.stops, distance: result.distance, duration: result.duration };
            updatedTours.push(updated);
            if (tour.id && result.polyline) newPolylines[tour.id] = result.polyline;
        } else {
            log.push(`⚠️ "${tour.title}": OSRM falló, manteniendo orden original`);
            updatedTours.push(tour);
            if (tour.id && cached.route_polylines?.[tour.id]) {
                newPolylines[tour.id] = cached.route_polylines[tour.id];
            }
        }
    }

    const { error: updateErr } = await supabase
        .from('tours_cache')
        .update({ data: updatedTours, route_polylines: newPolylines, updated_at: new Date().toISOString() })
        .eq('city', city)
        .eq('language', language);

    if (updateErr) return new Response(`DB update error: ${updateErr.message}`, { status: 500 });

    const body = { success: true, city, language, toursProcessed: updatedTours.length, log };
    console.log('[REORDER] ✅ Completado:', log.join(' | '));
    return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json' } });
});
```

---

## Instrucciones de uso

### 1. Crear la función en Supabase Dashboard
- Ir a **Edge Functions → New Function → Name: `reorder-city-tours`**
- Pegar el bloque TypeScript de arriba

### 2. Encontrar el slug exacto de Logroño
Ejecutar en el **SQL Editor** de Supabase:
```sql
SELECT city, language, updated_at FROM tours_cache ORDER BY updated_at DESC LIMIT 20;
```
El slug de Logroño probablemente sea `logrono_spain` o `logrono_espana`.

### 3. Invocar la función
Desde la terminal del usuario (o desde el botón "Invoke" del Dashboard):
```bash
curl -X POST 'https://[PROJECT-REF].supabase.co/functions/v1/reorder-city-tours' \
  -H 'Authorization: Bearer [ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"city": "logrono_spain", "language": "es"}'
```

La respuesta indicará para cada tour si el orden cambió o no.

### 4. Verificar en la app
Recargar la app y navegar a Logroño — las paradas ya tendrán el nuevo orden sin necesidad de regenerar.

### 5. Eliminar la función (opcional)
Una vez confirmado que funciona, se puede eliminar desde el Dashboard para mantener el proyecto limpio.
