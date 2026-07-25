import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { StateStorage } from 'zustand/middleware';

// Fallback in-memory storage for environments where sessionStorage/localStorage are blocked
class InMemoryStorage implements StateStorage {
  private store = new Map<string, string>();

  getItem(name: string): string | null {
    return this.store.get(name) || null;
  }

  setItem(name: string, value: string): void {
    this.store.set(name, value);
  }

  removeItem(name: string): void {
    this.store.delete(name);
  }
}

// Adaptador respaldado por Capacitor Preferences (SharedPreferences/UserDefaults nativos).
// El `localStorage` del WebView de Android puede ser purgado por el sistema bajo presión
// de memoria/almacenamiento sin que la app se entere; Preferences es el almacén nativo
// duradero recomendado por Capacitor para este caso.
class NativePreferencesStorage implements StateStorage {
  getItem(name: string): Promise<string | null> {
    return Preferences.get({ key: name }).then(r => r.value);
  }

  setItem(name: string, value: string): Promise<void> {
    return Preferences.set({ key: name, value });
  }

  removeItem(name: string): Promise<void> {
    return Preferences.remove({ key: name });
  }
}

/**
 * Storage Provider that adapts to the environment (Web vs iOS/Android).
 *
 * Rules:
 * - Native (Capacitor): Use `Preferences` (nativo) para persistir datos entre sesiones
 *   de forma duradera (no lo purga el sistema como sí puede hacer con localStorage del WebView).
 * - Web (Browser): Use `sessionStorage` to keep cache ephemeral (clears when tab closes).
 * - Fallback: In-memory mapping if APIs are unavailable.
 */
export const getEnvAwareStorage = (): StateStorage => {
  try {
    if (Capacitor.isNativePlatform()) {
      return new NativePreferencesStorage();
    } else {
      return sessionStorage;
    }
  } catch (e) {
    console.warn("Storage API blocked or unavailable. Falling back to in-memory state.");
    return new InMemoryStorage();
  }
};
