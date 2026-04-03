import { GoogleGenAI } from "@google/genai";

// ── Singleton: una sola instancia para todo el módulo ──────────────────────
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ── Clases de error propias ────────────────────────────────────────────────
export class QuotaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QuotaError";
    }
}

// ── Wrapper con reintentos y backoff exponencial ───────────────────────────
export const handleAiCall = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const errorMsg = typeof error === 'string' ? error : JSON.stringify(error);
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return handleAiCall(fn, retries - 1, delay * 2);
            }
            throw new QuotaError("Límite excedido. Por favor, usa tu clave API.");
        }
        throw error;
    }
};
