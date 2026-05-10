import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Tour } from '../types';

// ── Constantes ────────────────────────────────────────────────────────────────
const AUDIO_DIR = 'bdai/audio';
const AUDIO_INDEX_KEY = 'bdai_audio_index';   // metadata en localStorage
const TOUR_KEY_PREFIX = 'bdai_tour_offline_'; // JSON de tours por slug+lang
const TTL_MS = 15 * 24 * 60 * 60 * 1000;     // 15 días

// ── Tipos internos ────────────────────────────────────────────────────────────
interface AudioMeta { url: string; savedAt: number; size: number; }
type AudioIndex = Record<string, AudioMeta>; // clave: filename (hash.mp3)

// ── Helpers privados ──────────────────────────────────────────────────────────
const isNative = (): boolean => Capacitor.isNativePlatform();

const readIndex = (): AudioIndex => {
    try { return JSON.parse(localStorage.getItem(AUDIO_INDEX_KEY) || '{}'); }
    catch { return {}; }
};

const writeIndex = (idx: AudioIndex): void => {
    try { localStorage.setItem(AUDIO_INDEX_KEY, JSON.stringify(idx)); } catch {}
};

// Extrae el nombre del archivo del final de una URL, descartando query strings
const filenameFromUrl = (url: string): string =>
    url.split('/').pop()?.split('?')[0] || '';

const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

// Descarga un MP3 remoto y lo persiste en el filesystem nativo. Fire-and-forget.
const saveAudioFile = async (remoteUrl: string, filename: string): Promise<void> => {
    try {
        const res = await fetch(remoteUrl);
        if (!res.ok) return;
        const blob = await res.blob();
        const data = await blobToBase64(blob);
        await Filesystem.writeFile({
            path: `${AUDIO_DIR}/${filename}`,
            data,
            directory: Directory.Cache,
            recursive: true,
        });
        const idx = readIndex();
        idx[filename] = { url: remoteUrl, savedAt: Date.now(), size: blob.size };
        writeIndex(idx);
    } catch {} // La caché es oportunista — el fallo es silencioso
};

// ── API pública ───────────────────────────────────────────────────────────────
export const tourCacheService = {
    /**
     * Devuelve la URL local del audio si está en caché (reproducción offline),
     * o la URL remota si no lo está (e inicia la descarga en background para
     * que la próxima reproducción sea local).
     */
    async getOrCacheAudioUrl(remoteUrl: string): Promise<string> {
        if (!remoteUrl || !isNative()) return remoteUrl;
        const filename = filenameFromUrl(remoteUrl);
        if (!filename) return remoteUrl;

        const idx = readIndex();
        if (idx[filename]) {
            try {
                const { uri } = await Filesystem.getUri({
                    path: `${AUDIO_DIR}/${filename}`,
                    directory: Directory.Cache,
                });
                return Capacitor.convertFileSrc(uri);
            } catch {
                // El archivo desapareció del disco — limpiamos el índice y re-descargamos
                delete idx[filename];
                writeIndex(idx);
            }
        }

        // No está en caché: reproducir desde red y descargar en segundo plano
        saveAudioFile(remoteUrl, filename).catch(() => {});
        return remoteUrl;
    },

    /** Persiste el JSON completo del tour en localStorage (native-only). */
    saveTours(slug: string, lang: string, tours: Tour[]): void {
        if (!isNative()) return;
        try {
            localStorage.setItem(`${TOUR_KEY_PREFIX}${slug}_${lang}`, JSON.stringify(tours));
        } catch {}
    },

    /** Recupera tours guardados localmente. Devuelve null si no hay datos. */
    loadTours(slug: string, lang: string): Tour[] | null {
        if (!isNative()) return null;
        try {
            const raw = localStorage.getItem(`${TOUR_KEY_PREFIX}${slug}_${lang}`);
            return raw ? (JSON.parse(raw) as Tour[]) : null;
        } catch { return null; }
    },

    /** Elimina archivos de audio con más de 15 días. Llamar al arrancar la app. */
    async evictExpired(): Promise<void> {
        if (!isNative()) return;
        const idx = readIndex();
        const now = Date.now();
        const expired = Object.entries(idx).filter(([, m]) => now - m.savedAt > TTL_MS);
        await Promise.allSettled(
            expired.map(async ([filename]) => {
                try {
                    await Filesystem.deleteFile({
                        path: `${AUDIO_DIR}/${filename}`,
                        directory: Directory.Cache,
                    });
                } catch {}
                delete idx[filename];
            })
        );
        if (expired.length > 0) writeIndex(idx);
    },

    /** Total de bytes ocupados por los MP3 en caché (lectura del índice, O(1)). */
    getCacheSize(): number {
        return Object.values(readIndex()).reduce((acc, m) => acc + m.size, 0);
    },

    /** Vacía toda la caché de audio y resetea el índice. */
    async clearAudioCache(): Promise<void> {
        if (isNative()) {
            const idx = readIndex();
            await Promise.allSettled(
                Object.keys(idx).map((filename) =>
                    Filesystem.deleteFile({
                        path: `${AUDIO_DIR}/${filename}`,
                        directory: Directory.Cache,
                    }).catch(() => {})
                )
            );
        }
        writeIndex({});
    },
};
