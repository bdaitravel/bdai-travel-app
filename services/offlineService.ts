/**
 * BDAI Offline Service
 * - Guarda tours completos en IndexedDB del navegador
 * - Detecta conexión y usa datos locales automáticamente
 * - Los audios generados también se cachean localmente
 */

const DB_NAME = 'bdai_offline';
const DB_VERSION = 2;
const TOURS_STORE = 'tours';
const AUDIO_STORE = 'audio';
const META_STORE = 'meta';

// ─── DB INIT ──────────────────────────────────────────────────────────────────

let db: IDBDatabase | null = null;

export const initOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(TOURS_STORE)) {
        const toursStore = database.createObjectStore(TOURS_STORE, { keyPath: 'slug' });
        toursStore.createIndex('language', 'language', { unique: false });
        toursStore.createIndex('savedAt', 'savedAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        database.createObjectStore(AUDIO_STORE, { keyPath: 'key' });
      }

      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };

    req.onsuccess = (e) => {
      db = (e.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    req.onerror = () => reject(req.error);
  });
};

const getDB = async () => {
  if (!db) await initOfflineDB();
  return db!;
};

// ─── CONNECTIVITY ─────────────────────────────────────────────────────────────

export const isOnline = () => navigator.onLine;

type ConnectivityListener = (online: boolean) => void;
const connectivityListeners: ConnectivityListener[] = [];

export const onConnectivityChange = (fn: ConnectivityListener) => {
  connectivityListeners.push(fn);
  window.addEventListener('online',  () => { fn(true);  connectivityListeners.forEach(l => l(true)); });
  window.addEventListener('offline', () => { fn(false); connectivityListeners.forEach(l => l(false)); });
  return () => {
    const i = connectivityListeners.indexOf(fn);
    if (i > -1) connectivityListeners.splice(i, 1);
  };
};

// ─── TOURS ────────────────────────────────────────────────────────────────────

interface OfflineTour {
  slug: string;
  language: string;
  city: string;
  country: string;
  tours: any[];
  savedAt: number;
}

export const saveTourOffline = async (
  slug: string,
  language: string,
  city: string,
  country: string,
  tours: any[]
): Promise<void> => {
  try {
    const database = await getDB();
    const tx = database.transaction(TOURS_STORE, 'readwrite');
    const store = tx.objectStore(TOURS_STORE);
    await new Promise<void>((resolve, reject) => {
      const req = store.put({ slug: `${slug}_${language}`, language, city, country, tours, savedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    console.log(`[Offline] Tours saved for ${city} (${language})`);
  } catch (e) {
    console.warn('[Offline] Could not save tours:', e);
  }
};

export const getOfflineTours = async (slug: string, language: string): Promise<any[] | null> => {
  try {
    const database = await getDB();
    const tx = database.transaction(TOURS_STORE, 'readonly');
    const store = tx.objectStore(TOURS_STORE);
    return new Promise((resolve) => {
      const req = store.get(`${slug}_${language}`);
      req.onsuccess = () => resolve(req.result?.tours || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const getAllOfflineCities = async (): Promise<OfflineTour[]> => {
  try {
    const database = await getDB();
    const tx = database.transaction(TOURS_STORE, 'readonly');
    const store = tx.objectStore(TOURS_STORE);
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};

export const removeOfflineCity = async (slug: string, language: string): Promise<void> => {
  try {
    const database = await getDB();
    const tx = database.transaction(TOURS_STORE, 'readwrite');
    const store = tx.objectStore(TOURS_STORE);
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(`${slug}_${language}`);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[Offline] Could not remove city:', e);
  }
};

// ─── AUDIO ────────────────────────────────────────────────────────────────────

export const saveAudioOffline = async (key: string, buffer: Uint8Array): Promise<void> => {
  try {
    const database = await getDB();
    const tx = database.transaction(AUDIO_STORE, 'readwrite');
    const store = tx.objectStore(AUDIO_STORE);
    await new Promise<void>((resolve, reject) => {
      const req = store.put({ key, buffer, savedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[Offline] Could not save audio:', e);
  }
};

export const getAudioOffline = async (key: string): Promise<Uint8Array | null> => {
  try {
    const database = await getDB();
    const tx = database.transaction(AUDIO_STORE, 'readonly');
    const store = tx.objectStore(AUDIO_STORE);
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.buffer || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

// ─── STORAGE INFO ─────────────────────────────────────────────────────────────

export const getOfflineStorageInfo = async (): Promise<{ cities: number; sizeEstimateKB: number }> => {
  try {
    const cities = await getAllOfflineCities();
    // Rough estimate: each tour ~50KB
    const sizeEstimateKB = cities.length * 50;
    return { cities: cities.length, sizeEstimateKB };
  } catch {
    return { cities: 0, sizeEstimateKB: 0 };
  }
};
