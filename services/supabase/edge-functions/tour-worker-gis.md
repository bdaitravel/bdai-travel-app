```javascript
// services/supabase/tour-worker-gis.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'tour-worker-gis'
// Despliegue: copiar este código en el editor del Dashboard de Supabase.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';

const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

// --- GIS & ROUTING UTILS ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeForMatch = (str) => {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const optimizeStopOrder = async (tour) => {
    if (tour.stops.length <= 2) return tour;
    try {
        const coordsStr = tour.stops.map(s => `${s.longitude},${s.latitude}`).join(';');
        const osrmUrl = `https://routing.openstreetmap.de/routed-foot/trip/v1/foot/${coordsStr}?source=first&roundtrip=false&geometries=polyline`;
        
        const res = await fetch(osrmUrl, { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' }});
        if (!res.ok) return tour;
        
        const data = await res.json();
        if (data.code === 'Ok' && data.waypoints && data.trips && data.trips.length > 0) {
            const sortedWaypoints = data.waypoints.sort((a, b) => a.waypoint_index - b.waypoint_index);
            const optimizedStops = sortedWaypoints.map(wp => tour.stops[wp.original_index]);
            
            tour.stops = optimizedStops;
            tour.routePolyline = data.trips[0].geometry;
            const distKm = data.trips[0].distance / 1000;
            const durationMin = Math.round((distKm / 4) * 60); // 4km/h walking
            
            tour.duration = durationMin > 120 ? `${(durationMin/60).toFixed(1)} horas` : `${durationMin} min`;
        }
        return tour;
    } catch (e) {
        console.error("Error optimizando ruta OSRM:", e);
        return tour;
    }
};

const verifyStopCoordinates = async (stop, city, cityInfo, language) => {
    try {
        await sleep(1100); // Global Rate Limiter Nominatim (1.1s)
        const searchQuery = `${stop.name}, ${city}`;
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&addressdetails=1`;
        
        const nomRes = await fetch(nomUrl, { headers: { 'Accept-Language': 'en', 'User-Agent': 'BDAI-Travel-App/1.0' } });
        if (nomRes.ok) {
            const data = await nomRes.json();
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                
                const cityCenterLat = cityInfo.lat;
                const cityCenterLon = cityInfo.lon;
                
                const distToCenter = haversineKm(lat, lon, cityCenterLat, cityCenterLon);
                if (distToCenter <= 3.0) { // 3km radio max
                    return { ...stop, latitude: lat, longitude: lon, coordinatesVerified: true };
                }
            }
        }
        
        // Fallback a Photon
        await sleep(500);
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=1&lang=en`;
        const photRes = await fetch(photonUrl);
        if (photRes.ok) {
            const photData = await photRes.json();
            if (photData.features && photData.features.length > 0) {
                const f = photData.features[0];
                const lon = f.geometry.coordinates[0];
                const lat = f.geometry.coordinates[1];
                
                const distToCenter = haversineKm(lat, lon, cityInfo.lat, cityInfo.lon);
                if (distToCenter <= 3.0) {
                    return { ...stop, latitude: lat, longitude: lon, coordinatesVerified: true };
                }
            }
        }
        return null;
    } catch(e) {
        return null;
    }
};

serve(async (req) => {
    try {
        const payload = await req.json();
        
        if (payload.table !== 'generation_jobs' || payload.type !== 'UPDATE') {
            return new Response("Not an UPDATE on generation_jobs", { status: 200 });
        }

        const job = payload.record;
        if (job.status !== 'PENDING_GIS') {
            return new Response("Job is not PENDING_GIS", { status: 200 });
        }

        console.log(`[WORKER GIS] Iniciando validación para Job ${job.id}`);

        const parts = job.city_slug.split('_');
        const city = parts[0];
        const rawTours = job.raw_ai_data || [];
        const cityInfo = job.city_info;
        
        let verifiedTours = [];
        const allUniqueVerifiedStops = new Map();

        // 1. Verificación Geográfica Iterativa
        for (let i = 0; i < rawTours.length; i++) {
            const tour = rawTours[i];
            const processedStops = [];
            
            for (let j = 0; j < tour.stops.length; j++) {
                const stop = tour.stops[j];
                const verifiedStop = await verifyStopCoordinates(stop, city, cityInfo, job.language);
                
                if (verifiedStop) {
                    const key = normalizeForMatch(verifiedStop.name);
                    if (!allUniqueVerifiedStops.has(key)) {
                        allUniqueVerifiedStops.set(key, { ...verifiedStop, id: `${job.city_slug}_stop_${allUniqueVerifiedStops.size}` });
                        processedStops.push(allUniqueVerifiedStops.get(key));
                    }
                }
            }
            
            if (processedStops.length > 0) {
                verifiedTours.push({
                    title: tour.title || `Tour ${i+1}`,
                    theme: tour.theme || 'mixed',
                    stops: processedStops
                });
            }
        }

        // 2. Lógica Centralizada de Fusión (Rescue Logic)
        const totalUniqueStops = Array.from(allUniqueVerifiedStops.values());
        const anyTourBelowThreshold = verifiedTours.some(t => t.stops.length < 8);

        if (totalUniqueStops.length >= 4 && (verifiedTours.length === 0 || totalUniqueStops.length < 16 || anyTourBelowThreshold)) {
            console.log(`[WORKER GIS] 🌀 Rescate activado. Fusionando ${totalUniqueStops.length} paradas en 1 único tour.`);
            let rescuedTour = {
                id: `${job.city_slug}_${job.language}_0`,
                title: "Lo Esencial y Curiosidades / Essentials & Curiosities",
                theme: "mixed",
                stops: totalUniqueStops
            };
            rescuedTour = await optimizeStopOrder(rescuedTour);
            verifiedTours = [rescuedTour];
        } else {
            // Optimizar todos los tours independientes
            for (let i = 0; i < verifiedTours.length; i++) {
                verifiedTours[i].id = `${job.city_slug}_${job.language}_${i}`;
                verifiedTours[i] = await optimizeStopOrder(verifiedTours[i]);
            }
        }

        // 3. Fallo Crítico
        if (totalUniqueStops.length < 4) {
            console.log(`[WORKER GIS] ❌ Fallo crítico: Solo ${totalUniqueStops.length} paradas validadas.`);
            
            await supabaseClient.from('tours_cache').update({ status: 'ERROR' }).eq('city', job.city_slug).eq('language', job.language);
            await supabaseClient.from('generation_jobs').update({ status: 'FAILED', error_message: 'Not enough valid stops (<4)' }).eq('id', job.id);
            return new Response("Failed (Not enough stops)", { status: 200 });
        }

        // 4. Guardado Exitoso
        const routePolylines = {};
        verifiedTours.forEach(t => { if (t.routePolyline) routePolylines[t.id] = t.routePolyline; });

        await supabaseClient.from('tours_cache').upsert({
            city: job.city_slug,
            language: job.language,
            data: verifiedTours,
            route_polylines: routePolylines,
            status: 'READY',
            updated_at: new Date().toISOString()
        }, { onConflict: 'city, language' });

        await supabaseClient.from('generation_jobs').update({ status: 'COMPLETED' }).eq('id', job.id);

        console.log(`[WORKER GIS] ✅ Tarea completada con éxito. Tours generados: ${verifiedTours.length}`);
        return new Response("GIS Validation Completed", { status: 200 });

    } catch (error) {
        console.error("[WORKER GIS] Fatal Error:", error);
        
        try {
            const payload = await req.json();
            if (payload && payload.record) {
                await supabaseClient.from('generation_jobs').update({ status: 'FAILED', error_message: error.message }).eq('id', payload.record.id);
                await supabaseClient.from('tours_cache').update({ status: 'ERROR' }).eq('city', payload.record.city_slug).eq('language', payload.record.language);
            }
        } catch(e) {}

        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
```
