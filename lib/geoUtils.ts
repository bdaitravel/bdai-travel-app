import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

// Una sola lectura de posición (no watch) — para pantallas que solo necesitan
// saber "más o menos dónde estás" en el momento en que se piden (ej. elegir
// la parada más cercana al lanzar Modo Libre), no seguimiento continuo.
export const getOneShotLocation = (timeoutMs: number = 6000): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
        const opts = { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60000 };

        const run = async () => {
            try {
                if (Capacitor.isNativePlatform()) {
                    let perm = await Geolocation.checkPermissions();
                    if (perm.location !== 'granted') perm = await Geolocation.requestPermissions();
                    if (perm.location !== 'granted') return resolve(null);
                }
                const pos = await Geolocation.getCurrentPosition(opts);
                resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            } catch {
                resolve(null);
            }
        };
        run();
    });

// Distancia haversine entre dos coordenadas, en metros.
export const calculateDistanceMeters = (
    lat1: number | string,
    lon1: number | string,
    lat2: number | string,
    lon2: number | string
): number => {
    const R = 6371000;
    const l1 = typeof lat1 === 'string' ? parseFloat(lat1) : lat1;
    const ln1 = typeof lon1 === 'string' ? parseFloat(lon1) : lon1;
    const l2 = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
    const ln2 = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;
    if (isNaN(l1) || isNaN(ln1) || isNaN(l2) || isNaN(ln2)) return Infinity;
    const dLat = (l2 - l1) * Math.PI / 180;
    const dLon = (ln2 - ln1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(l1 * Math.PI / 180) * Math.cos(l2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
