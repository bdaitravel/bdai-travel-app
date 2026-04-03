import { Tour, Stop } from '../types';

// ── Utilitario Haversine (hoistado para uso en toda la verificación GIS) ──
export const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Helper para comparar nombres (sin tildes, minúsculas, trim)
export const normalizeForMatch = (s: string) => 
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// ── Obtiene metadatos geográficos reales de la ciudad (Ground Truth) ──
export const getCityInfo = async (city: string, country: string): Promise<any> => {
    try {
        const query = encodeURIComponent(`${city}, ${country}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1&extratags=1`, {
            headers: { 'Accept-Language': 'en', 'User-Agent': 'bdai-travel-app/1.0' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            const population = data[0].extratags?.population
                ? parseInt(data[0].extratags.population, 10)
                : null;
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                population
            };
        }
    } catch (e) {
        console.warn('Nominatim city lookup failed:', e);
    }
    return null;
};

// ── Valida coordenadas de una parada contra Nominatim y Photon con umbral de 30m + Rescate por Nombre ──
export const verifyStopCoordinates = async (stop: Stop, city: string, country: string, cityCenter: { lat: number, lng: number } | null, requestTs: { last: number }): Promise<Stop> => {
    // 1. Limpieza de nombre para búsqueda (ej. "Catedral - Logroño" -> "Catedral")
    const cleanName = stop.name
        .split(/\s*[-–]\s*/)[0]
        .split(/\s*\(/)[0]
        .replace(/\b(y|e|o|and|or|et|und)\b.*/i, '')
        .trim();

    const queryNom = encodeURIComponent(`${cleanName}, ${city}, ${country}`);
    const queryPho = encodeURIComponent(`${cleanName} ${city}`);

    const waitForRateLimit = async () => {
        const elapsed = Date.now() - requestTs.last;
        if (elapsed < 1100) await new Promise(r => setTimeout(r, 1100 - elapsed));
        requestTs.last = Date.now();
    };

    try {
        let bestAuthorityLat = 0;
        let bestAuthorityLon = 0;
        let foundMatch = false;

        // A) Intento con Nominatim (Búsqueda estricta + Identidad)
        await waitForRateLimit();
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${queryNom}&format=json&limit=1&addressdetails=1`;
        const nomRes = await fetch(nomUrl, { signal: (AbortSignal as any).timeout?.(4000) }).catch(() => null);

        if (nomRes?.ok) {
            const data = await nomRes.json();
            if (data && data.length > 0) {
                const res = data[0];
                const nLat = parseFloat(res.lat);
                const nLon = parseFloat(res.lon);
                const dist = haversineKm(stop.latitude, stop.longitude, nLat, nLon);

                // Match 100% de identidad (usamos la primera parte del display_name que suele ser el nombre del POI)
                const osmName = res.display_name.split(',')[0].trim();
                const isExactMatch = normalizeForMatch(cleanName) === normalizeForMatch(osmName);

                if (isExactMatch || dist <= 0.03) { // Rescate Total o Imán 30m
                    console.log(`GIS 🎯 ${isExactMatch ? 'RESCATE (Match 100%)' : 'SNAP (30m)'} para '${stop.name}': ${(dist * 1000).toFixed(1)}m de ajuste.`);
                    bestAuthorityLat = nLat;
                    bestAuthorityLon = nLon;
                    foundMatch = true;
                }
            }
        }

        // B) Si Nominatim falló, probamos Photon (Búsqueda difusa)
        if (!foundMatch) {
            await waitForRateLimit();
            const phoUrl = `https://photon.komoot.io/api/?q=${queryPho}&limit=1`;
            const phoRes = await fetch(phoUrl, { signal: (AbortSignal as any).timeout?.(4000) }).catch(() => null);

            if (phoRes?.ok) {
                const data = await phoRes.json();
                if (data && data.features && data.features.length > 0) {
                    const feature = data.features[0];
                    const coords = feature.geometry.coordinates; // [lon, lat]
                    const pLat = coords[1];
                    const pLon = coords[0];
                    const dist = haversineKm(stop.latitude, stop.longitude, pLat, pLon);
                    
                    const photonName = feature.properties.name || "";
                    const isExactMatch = normalizeForMatch(cleanName) === normalizeForMatch(photonName);

                    if (isExactMatch || dist <= 0.03) {
                        console.log(`GIS 🎯 ${isExactMatch ? 'RESCATE (Photon Match 100%)' : 'SNAP (Photon 30m)'} para '${stop.name}': ${(dist * 1000).toFixed(1)}m de ajuste.`);
                        bestAuthorityLat = pLat;
                        bestAuthorityLon = pLon;
                        foundMatch = true;
                    }
                }
            }
        }

        if (foundMatch) {
            return { ...stop, latitude: bestAuthorityLat, longitude: bestAuthorityLon, coordinatesVerified: true };
        }

    } catch (e) {
        console.warn(`GIS Refinement error for '${stop.name}':`, e);
    }

    // Si nada coincidió, confiamos en la lectura original de Gemini+GoogleSearch
    console.log(`GIS 🔮 ${stop.name}: Manteniendo punto original de Google Search (Sin snap cercano < 30m ni match exacto).`);
    return { ...stop, coordinatesVerified: false };
};

// ── Geocodifica todas las paradas de un tour (secuencial) ────
export const processTourStops = async (tour: Tour, city: string, country: string, cityCenter: { lat: number, lng: number } | null): Promise<Tour> => {
    const stops = tour.stops;
    const results: Stop[] = [];
    const requestTs = { last: 0 };

    for (const stop of stops) {
        const verified = await verifyStopCoordinates(stop, city, country, cityCenter, requestTs);

        // Conservamos la parada a menos que sea una alucinación geográfica (> 10km)
        if (cityCenter) {
            const distToCenterKm = haversineKm(verified.latitude, verified.longitude, cityCenter.lat, cityCenter.lng);
            if (distToCenterKm > 10) {
                console.warn(`GIS: Eliminando '${verified.name}' por estar a ${distToCenterKm.toFixed(1)}km del centro de ${city}. Alucinación catastrófica.`);
                continue;
            }
        }
        results.push(verified);
    }

    return { ...tour, stops: results };
};
