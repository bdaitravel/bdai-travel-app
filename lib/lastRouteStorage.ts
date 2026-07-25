import { getEnvAwareStorage } from '../services/storageProvider';

// Recuerda la última ruta visitada para restaurarla si Android mata el proceso en segundo
// plano y lo recrea desde cero: Capacitor no conserva el hash de la URL en ese caso, así que
// sin esto SIEMPRE se aterriza en /home tras un reinicio, sin importar dónde estuviera el
// usuario (perfil, clasificación, ciudad, tour...). Antes esto solo cubría /tour/*.
const ROUTE_KEY = 'bdai_last_route';
const ROUTE_TS_KEY = 'bdai_last_route_ts';
const ROUTE_TTL_MS = 24 * 60 * 60 * 1000; // no restaurar rutas de hace más de 24h

// Rutas que no tiene sentido "restaurar": ya son el destino por defecto.
const NON_RESTORABLE = ['/', '/login', '/home'];

const storage = getEnvAwareStorage();

export const clearLastRoute = async (): Promise<void> => {
    await storage.removeItem(ROUTE_KEY);
    await storage.removeItem(ROUTE_TS_KEY);
};

export const saveLastRoute = async (pathname: string): Promise<void> => {
    if (NON_RESTORABLE.includes(pathname)) {
        await clearLastRoute();
        return;
    }
    await storage.setItem(ROUTE_KEY, pathname);
    await storage.setItem(ROUTE_TS_KEY, String(Date.now()));
};

export const getLastRoute = async (): Promise<string | null> => {
    const raw = await storage.getItem(ROUTE_KEY);
    const ts = await storage.getItem(ROUTE_TS_KEY);
    if (!raw || !ts) return null;
    if (Date.now() - parseInt(ts, 10) > ROUTE_TTL_MS) {
        await clearLastRoute();
        return null;
    }
    return raw;
};
