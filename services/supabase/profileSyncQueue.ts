import { UserProfile } from '../../types';
import { supabase } from './client';
import { buildProfilePayload } from './profileService';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { getEnvAwareStorage } from '../storageProvider';
import { toast } from '../../components/Toast';

// Cola de sincronización de perfil: solo hay una cuenta activa por dispositivo, así que
// basta con un único "slot" pendiente (se sobrescribe con el payload más reciente, no es FIFO).
// Persiste en Preferences (nativo) / sessionStorage (web) ANTES de intentar la red, para que
// un cierre de la app o una pérdida de conexión no borren un cambio que aún no llegó a Supabase.

const PENDING_SYNC_KEY = 'bdai_pending_profile_sync';
const DEBOUNCE_MS = 1200;
const MAX_WAIT_MS = 4000;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

const storage = getEnvAwareStorage();
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type SyncStatus = 'idle' | 'syncing' | 'pending';
let currentStatus: SyncStatus = 'idle';

const setStatus = (status: SyncStatus) => {
    const prev = currentStatus;
    currentStatus = status;
    if (prev !== 'pending' && status === 'pending') {
        toast('Cambios guardados en el dispositivo. Se sincronizarán cuando haya conexión.', 'info');
    } else if (prev === 'pending' && status === 'idle') {
        toast('Perfil sincronizado ✓', 'success');
    }
};

let pendingPayload: Record<string, any> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;

const readPending = async (): Promise<Record<string, any> | null> => {
    const raw = await storage.getItem(PENDING_SYNC_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
};

const writePending = async (payload: Record<string, any>) => {
    await storage.setItem(PENDING_SYNC_KEY, JSON.stringify(payload));
};

const clearPending = async () => {
    await storage.removeItem(PENDING_SYNC_KEY);
};

const pushToSupabase = async (payload: Record<string, any>): Promise<boolean> => {
    let { error } = await supabase.rpc('upsert_profile_rpc', { p_payload: payload });
    if (!error) return true;
    console.error('❌ Sync error (intento inicial):', error);

    for (const delay of RETRY_DELAYS_MS) {
        await sleep(delay);
        ({ error } = await supabase.rpc('upsert_profile_rpc', { p_payload: payload }));
        if (!error) return true;
        console.error(`❌ Sync error (reintento tras ${delay}ms):`, error);
    }
    return false;
};

const runFlush = async (payload: Record<string, any>) => {
    setStatus('syncing');
    const ok = await pushToSupabase(payload);
    inFlight = null;
    if (ok) {
        // Solo limpiar si nadie encoló un cambio más nuevo mientras se enviaba este
        if (pendingPayload === payload) {
            pendingPayload = null;
            await clearPending();
        }
        setStatus(pendingPayload ? 'pending' : 'idle');
        if (pendingPayload) triggerFlush();
    } else {
        setStatus('pending');
    }
};

const triggerFlush = () => {
    if (maxWaitTimer) { clearTimeout(maxWaitTimer); maxWaitTimer = null; }
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    if (inFlight || !pendingPayload) return;
    inFlight = runFlush(pendingPayload);
};

/**
 * Encola una actualización de perfil para sincronizar con Supabase.
 * No bloqueante: persiste de inmediato en storage duradero y hace debounce/retry en segundo plano.
 * Usar para cualquier cambio salvo la creación inicial del perfil (ver `syncUserProfile`).
 */
export const queueProfileSync = (profile: UserProfile): void => {
    if (!profile || !profile.email) {
        console.error('queueProfileSync: perfil sin email, no se puede encolar', profile);
        return;
    }
    const payload = buildProfilePayload(profile);
    pendingPayload = payload;
    writePending(payload).catch(e => console.error('No se pudo persistir la cola de sync de perfil', e));

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(triggerFlush, DEBOUNCE_MS);

    if (!maxWaitTimer) {
        maxWaitTimer = setTimeout(triggerFlush, MAX_WAIT_MS);
    }
};

/**
 * Si hay un cambio de perfil pendiente de sincronizar (de esta sesión o de una anterior
 * que se cerró antes de completar el envío), lo reintenta ahora. Se llama en:
 * - Reanudación de la app en primer plano.
 * - Reconexión de red.
 * - Justo antes de leer el perfil remoto en el login (para no perder el pendiente con el pull).
 */
export const flushPendingProfileSync = async (): Promise<void> => {
    if (!pendingPayload) {
        const stored = await readPending();
        if (!stored) return;
        pendingPayload = stored;
    }
    triggerFlush();
    if (inFlight) await inFlight;
};

let listenersInitialized = false;

/** Registra los listeners de reanudación de app y reconexión de red. Llamar una sola vez en el arranque. */
export const initProfileSyncQueue = () => {
    if (listenersInitialized) return;
    listenersInitialized = true;

    // Al recuperar conexión, intentar vaciar la cola
    if (Capacitor.isNativePlatform()) {
        Network.addListener('networkStatusChange', (status) => {
            if (status.connected) flushPendingProfileSync();
        });
    } else if (typeof window !== 'undefined') {
        window.addEventListener('online', () => { flushPendingProfileSync(); });
    }

    // Al volver a primer plano, intentar vaciar la cola; al pasar a background, intento best-effort
    if (Capacitor.isNativePlatform()) {
        App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                flushPendingProfileSync();
            } else if (pendingPayload) {
                // Best-effort: Android puede suspender el proceso antes de que esto termine
                triggerFlush();
            }
        });
    }
};
