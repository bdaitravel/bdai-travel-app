import { Capacitor } from '@capacitor/core';
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

/**
 * Storage Provider that adapts to the environment (Web vs iOS/Android).
 * 
 * Rules:
 * - Native (Capacitor): Use `localStorage` to persist data between sessions (saves battery/data).
 * - Web (Browser): Use `sessionStorage` to keep cache ephemeral (clears when tab closes).
 * - Fallback: In-memory mapping if APIs are unavailable.
 */
export const getEnvAwareStorage = (): StateStorage => {
  try {
    if (Capacitor.isNativePlatform()) {
      return localStorage;
    } else {
      return sessionStorage;
    }
  } catch (e) {
    console.warn("Storage API blocked or unavailable. Falling back to in-memory state.");
    return new InMemoryStorage();
  }
};
