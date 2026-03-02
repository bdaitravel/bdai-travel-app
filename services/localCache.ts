import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'bdai_audio_cache';
const STORE_NAME = 'audios';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
        });
    }
    return dbPromise;
};

export const getLocalAudio = async (hash: string): Promise<Uint8Array | null> => {
    try {
        const db = await getDB();
        return await db.get(STORE_NAME, hash);
    } catch (e) {
        return null;
    }
};

export const saveLocalAudio = async (hash: string, data: Uint8Array) => {
    try {
        const db = await getDB();
        await db.put(STORE_NAME, data, hash);
    } catch (e) {
        console.error("Local cache save failed", e);
    }
};
