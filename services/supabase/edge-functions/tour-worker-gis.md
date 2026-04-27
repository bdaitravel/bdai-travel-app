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

// ── Verificación de coordenadas (Nominatim → Photon fallback) ─────────────────
// cityInfo CONTRACT: { lat, lon, radiusKm, population, bbox:{south,west,north,east} }
const verifyStopCoordinates = async (stop: any, city: string, cityInfo: any): Promise<any | null> => {
    const radiusKm = cityInfo.radiusKm || 5;

    try {
        await sleep(1100); // Rate limiter Nominatim (max 1 req/s)

        // Intento 1: Nominatim
        const searchQuery = `${stop.name}, ${city}`;
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=3&addressdetails=1`;
        const nomRes = await fetch(nomUrl, { headers: { 'Accept-Language': 'en', 'User-Agent': 'BDAI-Travel-App/1.0' } });

        if (nomRes.ok) {
            const data = await nomRes.json();
            for (const result of (data || [])) {
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                const distToCenter = haversineKm(lat, lon, cityInfo.lat, cityInfo.lon);
                if (distToCenter <= radiusKm) {
                    console.log(`[GIS] ✅ Nominatim: ${stop.name} (${distToCenter.toFixed(2)}km)`);
                    return { ...stop, latitude: lat, longitude: lon, coordinatesVerified: true };
                }
            }
            if (data && data.length > 0) {
                console.warn(`[GIS] ⚠️ ${stop.name}: fuera de radio (${haversineKm(parseFloat(data[0].lat), parseFloat(data[0].lon), cityInfo.lat, cityInfo.lon).toFixed(2)}km > ${radiusKm.toFixed(2)}km)`);
            }
        }

        // Intento 2: Photon fallback
        await sleep(500);
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=3&lang=en`;
        const photRes = await fetch(photonUrl);
        if (photRes.ok) {
            const photData = await photRes.json();
            for (const f of (photData.features || [])) {
                const lon = f.geometry.coordinates[0];
                const lat = f.geometry.coordinates[1];
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

// ── Optimización de ruta (OSRM /trip) ────────────────────────────────────────
const optimizeStopOrder = async (tour: any): Promise<any> => {
    if (!tour.stops || tour.stops.length <= 2) return tour;
    try {
        const coordsStr = tour.stops.map((s: any) => `${s.longitude},${s.latitude}`).join(';');
        const osrmUrl = `https://routing.openstreetmap.de/routed-foot/trip/v1/foot/${coordsStr}?source=first&roundtrip=false&geometries=polyline`;
        const res = await fetch(osrmUrl, { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' } });
        if (!res.ok) return tour;
        const data = await res.json();
        if (data.code === 'Ok' && data.waypoints && data.trips?.length > 0) {
            const optimizedStops = new Array(tour.stops.length);
            data.waypoints.forEach((wp: any, i: number) => {
                optimizedStops[wp.waypoint_index] = tour.stops[i];
            });
            tour.stops = optimizedStops.filter((s: any) => s !== undefined);
            tour.routePolyline = data.trips[0].geometry;
            const distKm = data.trips[0].distance / 1000;
            const durationMin = Math.round((distKm / 4) * 60);
            tour.duration = durationMin > 120 ? `${(durationMin / 60).toFixed(1)} horas` : `${durationMin} min`;
            tour.distance = `${distKm.toFixed(1)} km`;
        }
        return tour;
    } catch (e) {
        console.error('[GIS] Error OSRM:', e);
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