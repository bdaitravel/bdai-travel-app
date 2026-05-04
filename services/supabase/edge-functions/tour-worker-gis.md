// services/supabase/tour-worker-gis.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'tour-worker-gis'
// Recibe el webhook de UPDATE en generation_jobs (status=PENDING_GIS),
// verifica coordenadas, optimiza rutas y guarda el resultado final.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';

const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

// ── UTILS ─────────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeForMatch = (str: string): string => {
    if (!str) return '';
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
};

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// ── Lógica de fusión con umbral configurable ──────────────────────────────────
// REGLA: se mantienen 2 tours si AMBOS tienen ≥8 paradas. Si no, se fusiona en 1.
// Umbral mínimo por tour: 8 paradas. Umbral total para justificar 2 tours: ≥16 paradas únicas.
const shouldMergeIntoOneTour = (tours: any[], totalUniqueStops: any[]): boolean => {
    if (tours.length === 0) return totalUniqueStops.length >= 4;
    const totalStops = totalUniqueStops.length;
    const allToursAboveThreshold = tours.every(t => t.stops.length >= 8);
    return totalStops < 16 || !allToursAboveThreshold;
};

// ── Título DAI para el tour fusionado ────────────────────────────────────────
// Hereda el título del primer tour bruto si está disponible, 
// o usa uno con sabor DAI genérico si no.
const buildRescueTourTitle = (rawTours: any[], language: string): string => {
    const isSpanish = language.startsWith('es');
    const isEnglish = language.startsWith('en');
    const isFrench = language.startsWith('fr');
    const isGerman = language.startsWith('de');
    const isItalian = language.startsWith('it');

    // Si el AI generó al menos 1 tour con título propio, usarlo como base
    const baseTitle = rawTours?.[0]?.title;
    if (baseTitle && baseTitle.length > 3 && !baseTitle.toLowerCase().includes('tour 1')) {
        return baseTitle; // heredar el título original, era el mejor candidato
    }

    // Fallback con títulos DAI por idioma
    if (isSpanish)  return 'Todo lo que merece la pena — en un solo paseo';
    if (isEnglish)  return 'Everything Worth Seeing — One Walk to Rule Them All';
    if (isFrench)   return 'L\'essentiel et les curiosités — une seule promenade';
    if (isGerman)   return 'Alles, was zählt — ein einziger Spaziergang';
    if (isItalian)  return 'Tutto ciò che vale — in un\'unica passeggiata';
    return 'The Essential & Curiosities — One Complete Walk';
};

// ── Normalización para comparación de municipios ─────────────────────────────
const extractMunicipalityFromAddress = (address: any): string => {
    const raw = address?.city || address?.town || address?.village || address?.municipality || address?.county || '';
    return raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
};

// ── Verificación de coordenadas (Nominatim → Photon fallback) ─────────────────
// cityInfo CONTRACT: { lat, lon, radiusKm, population, bbox:{south,west,north,east} }
// VALIDACIÓN DE MUNICIPIO: se descarta cualquier resultado cuyo address.city/town/village
// no coincida con la ciudad objetivo. Esto previene que calles con el mismo nombre en
// municipios adyacentes (ej. Calle Laurel en Villamediana vs Logroño) pasen el filtro de radio.
const verifyStopCoordinates = async (stop: any, city: string, cityInfo: any): Promise<any | null> => {
    const radiusKm = cityInfo.radiusKm || 5;
    const normalizedCity = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    try {
        await sleep(1100); // Rate limiter Nominatim (max 1 req/s)

        // Intento 1: Nominatim con validación de municipio
        const searchQuery = `${stop.name}, ${city}`;
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1`;
        const nomRes = await fetch(nomUrl, { headers: { 'Accept-Language': 'en', 'User-Agent': 'BDAI-Travel-App/1.0' } });

        if (nomRes.ok) {
            const data = await nomRes.json();
            for (const result of (data || [])) {
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);

                // VALIDACIÓN DE MUNICIPIO: el resultado debe pertenecer a la ciudad objetivo,
                // no a un municipio vecino con el mismo nombre de calle/lugar.
                const resultMunicipality = extractMunicipalityFromAddress(result.address);
                const isCorrectMunicipality = resultMunicipality === '' ||
                    resultMunicipality.includes(normalizedCity) ||
                    normalizedCity.includes(resultMunicipality);

                if (!isCorrectMunicipality) {
                    console.warn(`[GIS] ⚠️ ${stop.name}: municipio incorrecto (${result.address?.city || result.address?.town} ≠ ${city}). Descartando.`);
                    continue;
                }

                const distToCenter = haversineKm(lat, lon, cityInfo.lat, cityInfo.lon);
                if (distToCenter <= radiusKm) {
                    console.log(`[GIS] ✅ Nominatim: ${stop.name} (${distToCenter.toFixed(2)}km, municipio: ${resultMunicipality || 'ok'})`);
                    return { ...stop, latitude: lat, longitude: lon, coordinatesVerified: true };
                } else {
                    console.warn(`[GIS] ⚠️ ${stop.name}: fuera de radio (${distToCenter.toFixed(2)}km > ${radiusKm.toFixed(2)}km)`);
                }
            }
        }

        // Intento 2: Photon fallback con validación de municipio
        await sleep(500);
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5&lang=en`;
        const photRes = await fetch(photonUrl);
        if (photRes.ok) {
            const photData = await photRes.json();
            for (const f of (photData.features || [])) {
                const lon = f.geometry.coordinates[0];
                const lat = f.geometry.coordinates[1];

                // Validación de municipio en Photon
                const photonCity = (f.properties?.city || f.properties?.county || '').toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                const isCorrectMunicipality = photonCity === '' ||
                    photonCity.includes(normalizedCity) ||
                    normalizedCity.includes(photonCity);

                if (!isCorrectMunicipality) {
                    console.warn(`[GIS] ⚠️ ${stop.name} (Photon): municipio incorrecto (${photonCity} ≠ ${city}). Descartando.`);
                    continue;
                }

                const distToCenter = haversineKm(lat, lon, cityInfo.lat, cityInfo.lon);
                if (distToCenter <= radiusKm) {
                    console.log(`[GIS] ✅ Photon: ${stop.name} (${distToCenter.toFixed(2)}km)`);
                    return { ...stop, latitude: lat, longitude: lon, coordinatesVerified: true };
                }
            }
        }

        console.warn(`[GIS] ❌ ${stop.name}: sin verificación válida en ${city}.`);
        return null;

    } catch (e) {
        console.warn(`[GIS] Error verificando ${stop.name}:`, e);
        return null;
    }
};

// ── Optimización de ruta (Haversine NN+2-opt+Or-opt + OSRM /route para polilínea) ──
// NOTA: El servidor público routing.openstreetmap.de NO soporta /trip para foot
// (devuelve NotImplemented). Se usa optimización Haversine local y /route para la polilínea.

const haversineKmRoute = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildRouteMatrix = (stops: any[]): number[][] => {
    const n = stops.length;
    const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
            const d = haversineKmRoute(stops[i].latitude, stops[i].longitude, stops[j].latitude, stops[j].longitude);
            m[i][j] = m[j][i] = d;
        }
    return m;
};

const nearestNeighborRoute = (stops: any[], m: number[][]): number[] => {
    const n = stops.length;
    let best: number[] = [], bestD = Infinity;
    for (let start = 0; start < n; start++) {
        const visited = new Set<number>(), order: number[] = [];
        let cur = start;
        while (order.length < n) {
            if (visited.has(cur)) {
                let minD = Infinity, nxt = -1;
                for (let j = 0; j < n; j++) if (!visited.has(j) && m[cur][j] < minD) { minD = m[cur][j]; nxt = j; }
                if (nxt === -1) break;
                cur = nxt;
            }
            order.push(cur); visited.add(cur);
            let minD = Infinity, nxt = -1;
            for (let j = 0; j < n; j++) if (!visited.has(j) && m[cur][j] < minD) { minD = m[cur][j]; nxt = j; }
            if (nxt === -1) break;
            cur = nxt;
        }
        let d = 0; for (let i = 0; i < order.length - 1; i++) d += m[order[i]][order[i + 1]];
        if (d < bestD) { bestD = d; best = [...order]; }
    }
    return best;
};

const twoOptRoute = (order: number[], m: number[][]): number[] => {
    const n = order.length;
    let improved = true, route = [...order];
    while (improved) {
        improved = false;
        for (let i = 0; i < n - 2; i++)
            for (let j = i + 2; j < n; j++) {
                if (j === n - 1 && i === 0) continue;
                const cur = m[route[i]][route[i + 1]] + m[route[j]][route[(j + 1) % n]];
                const nw = m[route[i]][route[j]] + m[route[i + 1]][route[(j + 1) % n]];
                if (nw < cur - 0.001) {
                    route = [...route.slice(0, i + 1), ...route.slice(i + 1, j + 1).reverse(), ...route.slice(j + 1)];
                    improved = true;
                }
            }
    }
    return route;
};

const orOptRoute = (order: number[], m: number[][]): number[] => {
    const dist = (r: number[]): number => { let d = 0; for (let i = 0; i < r.length - 1; i++) d += m[r[i]][r[i + 1]]; return d; };
    let improved = true, route = [...order];
    while (improved) {
        improved = false;
        for (let p = 0; p < route.length && !improved; p++) {
            const stop = route[p], without = route.filter((_: number, i: number) => i !== p);
            const cur = dist(route);
            let best = cur - 0.001, bestQ = -1;
            for (let q = 0; q <= without.length; q++) {
                const d = dist([...without.slice(0, q), stop, ...without.slice(q)]);
                if (d < best) { best = d; bestQ = q; }
            }
            if (bestQ !== -1) {
                const w = route.filter((_: number, i: number) => i !== p);
                route = [...w.slice(0, bestQ), stop, ...w.slice(bestQ)];
                improved = true;
            }
        }
    }
    return route;
};

const calcRouteDuration = (distKm: number, nStops: number): string => {
    const total = Math.round(distKm * 15 + nStops * 7.5 + 20);
    if (total < 60) return `${total} min`;
    const h = Math.floor(total / 60), m = total % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

const optimizeStopOrder = async (tour: any): Promise<any> => {
    if (!tour.stops || tour.stops.length <= 2) return tour;
    try {
        const stops = tour.stops;
        const m = buildRouteMatrix(stops);
        let order = nearestNeighborRoute(stops, m);
        order = twoOptRoute(order, m);
        order = orOptRoute(order, m);
        const optimized = order.map((i: number) => stops[i]);

        let distKm = 0;
        for (let i = 0; i < optimized.length - 1; i++)
            distKm += haversineKmRoute(optimized[i].latitude, optimized[i].longitude, optimized[i + 1].latitude, optimized[i + 1].longitude);

        // Polilínea visual: OSRM /route (sí disponible para foot)
        let polyline: string | undefined;
        try {
            const coords = optimized.map((s: any) => `${s.longitude},${s.latitude}`).join(';');
            const osrmRes = await fetch(
                `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=polyline`,
                { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' } }
            );
            if (osrmRes.ok) {
                const d = await osrmRes.json();
                if (d.code === 'Ok') polyline = d.routes?.[0]?.geometry;
            }
        } catch (e) { console.warn('[GIS] OSRM /route polyline failed:', e); }

        tour.stops = optimized;
        tour.distance = `${distKm.toFixed(1)} km`;
        tour.duration = calcRouteDuration(distKm, optimized.length);
        if (polyline) tour.routePolyline = polyline;
        console.log(`[GIS] 🗺️ Ruta optimizada: ${tour.title} — ${optimized.length} paradas, ${tour.distance}, ~${tour.duration}`);
        return tour;
    } catch (e) {
        console.error('[GIS] Error optimizando ruta:', e);
        return tour;
    }
};

// ── SERVIDOR ──────────────────────────────────────────────────────────────────
serve(async (req) => {
    try {
        // Seguridad: verificar el Webhook Secret
        const secret = req.headers.get('x-webhook-secret');
        if (secret !== Deno.env.get('WEBHOOK_SECRET')) {
            console.error('[GIS] Unauthorized webhook attempt');
            return new Response('Unauthorized', { status: 401 });
        }

        const payload = await req.json();

        if (payload.table !== 'generation_jobs' || payload.type !== 'UPDATE') {
            return new Response('Not an UPDATE on generation_jobs', { status: 200 });
        }

        const job = payload.record;
        if (job.status !== 'PENDING_GIS') {
            return new Response('Job is not PENDING_GIS', { status: 200 });
        }

        console.log(`[GIS] Iniciando validación para Job ${job.id}: ${job.city_slug} / ${job.language}`);

        const parts = job.city_slug.split('_');
        const city = parts[0];
        const rawTours: any[] = job.raw_ai_data || [];

        // cityInfo CONTRACT (guardado por tour-worker-ai):
        // { lat, lon, radiusKm, population, bbox:{south,west,north,east} }
        const cityInfo = job.city_info;
        if (!cityInfo?.lat || !cityInfo?.lon) {
            throw new Error('Missing or malformed city_info in job (lat/lon required)');
        }
        // Garantía de seguridad: si radiusKm no llegó por algún motivo, usar fallback razonable
        if (!cityInfo.radiusKm || cityInfo.radiusKm <= 0) {
            console.warn('[GIS] cityInfo.radiusKm no definido, usando fallback de 5km');
            cityInfo.radiusKm = 5;
        }

        // ── 1. Verificación geográfica de paradas ──────────────────────────────
        const allUniqueVerifiedStops = new Map<string, any>();
        let processedTours: any[] = [];

        for (let i = 0; i < rawTours.length; i++) {
            const tour = rawTours[i];
            if (!tour?.stops?.length) continue;

            const processedStops: any[] = [];
            for (const stop of tour.stops) {
                const verifiedStop = await verifyStopCoordinates(stop, city, cityInfo);
                if (verifiedStop) {
                    const key = normalizeForMatch(verifiedStop.name);
                    if (!allUniqueVerifiedStops.has(key)) {
                        const enriched = { ...verifiedStop, id: `${job.city_slug}_stop_${allUniqueVerifiedStops.size}` };
                        allUniqueVerifiedStops.set(key, enriched);
                        processedStops.push(enriched);
                    }
                }
            }

            if (processedStops.length > 0) {
                processedTours.push({
                    title: tour.title || `Tour ${i + 1}`,
                    theme: tour.theme || 'mixed',
                    city: tour.city || city,       // garantizar que city nunca se pierda
                    country: tour.country || '',
                    stops: processedStops
                });
            }
        }

        const totalUniqueStops = Array.from(allUniqueVerifiedStops.values());

        // ── 2. Fallo crítico: menos de 4 paradas verificadas ──────────────────
        if (totalUniqueStops.length < 4) {
            const errorMsg = `Not enough valid stops: ${totalUniqueStops.length} (minimum 4)`;
            console.error(`[GIS] ❌ ${errorMsg}`);
            await supabaseClient.from('tours_cache').update({ status: 'ERROR', error_message: errorMsg }).eq('city', job.city_slug).eq('language', job.language);
            await supabaseClient.from('generation_jobs').update({ status: 'FAILED', error_message: errorMsg }).eq('id', job.id);
            return new Response('Failed (Not enough stops)', { status: 200 });
        }

        // ── 3. Decisión de fusión ─────────────────────────────────────────────
        // Mantener 2 tours solo si AMBOS tienen ≥8 paradas Y hay ≥16 paradas únicas en total.
        // En cualquier otro caso, fusionar en 1 tour completo.
        if (shouldMergeIntoOneTour(processedTours, totalUniqueStops)) {
            console.log(`[GIS] 🌀 Fusión activada. ${processedTours.length} tours / ${totalUniqueStops.length} paradas únicas → 1 tour.`);
            const rescueTitle = buildRescueTourTitle(rawTours, job.language);
            let rescuedTour: any = {
                id: `${job.city_slug}_${job.language}_0`,
                title: rescueTitle,
                theme: 'mixed',
                city: city,
                country: job.city_slug.split('_').slice(1).join('_') || '',
                stops: totalUniqueStops
            };
            rescuedTour = await optimizeStopOrder(rescuedTour);
            processedTours = [rescuedTour];
        } else {
            // Optimizar cada tour independientemente
            console.log(`[GIS] ✅ Manteniendo ${processedTours.length} tours separados (${totalUniqueStops.length} paradas únicas).`);
            for (let i = 0; i < processedTours.length; i++) {
                processedTours[i].id = `${job.city_slug}_${job.language}_${i}`;
                processedTours[i] = await optimizeStopOrder(processedTours[i]);
            }
        }

        // ── 4. Guardado exitoso ───────────────────────────────────────────────
        const routePolylines: Record<string, string> = {};
        processedTours.forEach(t => { if (t.routePolyline) routePolylines[t.id] = t.routePolyline; });

        await supabaseClient.from('tours_cache').upsert({
            city: job.city_slug,
            language: job.language,
            data: processedTours,
            route_polylines: routePolylines,
            status: 'READY',
            updated_at: new Date().toISOString()
        }, { onConflict: 'city, language' });

        await supabaseClient.from('generation_jobs').update({ status: 'COMPLETED' }).eq('id', job.id);

        console.log(`[GIS] ✅ Completado. Tours: ${processedTours.length}. Paradas totales: ${totalUniqueStops.length}.`);
        return new Response('GIS Validation Completed', { status: 200 });

    } catch (error: any) {
        console.error('[GIS] Fatal Error:', error);
        try {
            const payload = await req.clone().json();
            if (payload?.record) {
                await supabaseClient.from('generation_jobs').update({ status: 'FAILED', error_message: error.message }).eq('id', payload.record.id);
                await supabaseClient.from('tours_cache').update({ status: 'ERROR', error_message: error.message }).eq('city', payload.record.city_slug).eq('language', payload.record.language);
            }
        } catch (_) {}
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});