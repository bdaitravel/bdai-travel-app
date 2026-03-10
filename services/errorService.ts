/**
 * BDAI Error Service
 * - Reemplaza todos los alert() con toasts bonitos dentro de la app
 * - Guarda errores en Supabase (tabla error_logs)
 * - Email de soporte: support@bdai.travel (cámbialo si es diferente)
 */

export const SUPPORT_EMAIL = "support@bdai.travel";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

type ToastListener = (toasts: Toast[]) => void;

// ─── TOAST MANAGER (singleton global) ────────────────────────────────────────

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: ToastListener[] = [];

  private notify() {
    this.listeners.forEach(l => l([...this.toasts]));
  }

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(toast: Omit<Toast, 'id'>) {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const full: Toast = { duration: 4000, ...toast, id };
    this.toasts = [full, ...this.toasts].slice(0, 3);
    this.notify();
    if (full.duration && full.duration > 0) {
      setTimeout(() => this.dismiss(id), full.duration);
    }
    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }
}

export const toastManager = new ToastManager();

export const showToast = {
  error:   (title: string, message?: string, action?: Toast['action']) =>
    toastManager.show({ type: 'error',   title, message, duration: 7000, action }),
  success: (title: string, message?: string) =>
    toastManager.show({ type: 'success', title, message, duration: 3000 }),
  warning: (title: string, message?: string, action?: Toast['action']) =>
    toastManager.show({ type: 'warning', title, message, duration: 5000, action }),
  info:    (title: string, message?: string) =>
    toastManager.show({ type: 'info',    title, message, duration: 4000 }),
};

// ─── ERROR REPORTER → Supabase tabla error_logs ───────────────────────────────

interface ErrorReport {
  error_message: string;
  context: string;
  user_email: string;
  language: string;
  url: string;
  created_at: string;
}

let queue: ErrorReport[] = [];
let flushing = false;

const flush = async () => {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = [...queue];
  queue = [];
  try {
    const { supabase } = await import('./supabaseClient');
    await supabase.from('error_logs').insert(batch);
  } catch {
    // Nunca crashear la app por un error de logging
  } finally {
    flushing = false;
  }
};

export const reportError = (
  error: unknown,
  context: string,
  userEmail = 'anonymous',
  language = 'unknown'
) => {
  const msg = error instanceof Error ? error.message
    : typeof error === 'string' ? error
    : JSON.stringify(error);

  console.error(`[BDAI] ${context}:`, msg);

  queue.push({
    error_message: msg,
    context,
    user_email: userEmail,
    language,
    url: window.location.href,
    created_at: new Date().toISOString(),
  });

  setTimeout(flush, 2000);
};

// ─── HANDLERS ESPECÍFICOS ─────────────────────────────────────────────────────

export const handleGeminiError = (error: unknown, retry?: () => void) => {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    showToast.warning('DAI está ocupado 🧠',
      'Demasiadas peticiones. Inténtalo en unos segundos.',
      retry ? { label: 'Reintentar', onClick: retry } : undefined);
    return;
  }
  if (msg.includes('API_KEY') || msg.includes('INVALID_ARGUMENT')) {
    showToast.error('Error de configuración', 'Clave de API inválida.');
    return;
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    showToast.warning('Sin conexión 📡',
      'Comprueba tu internet.',
      retry ? { label: 'Reintentar', onClick: retry } : undefined);
    return;
  }
  showToast.error('DAI ha tenido un problema',
    'Inténtalo de nuevo.',
    retry ? { label: 'Reintentar', onClick: retry } : undefined);
};

export const handleSupabaseError = (error: unknown, context = 'db') => {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('JWT') || msg.includes('session')) {
    showToast.warning('Sesión expirada', 'Vuelve a iniciar sesión.');
    return;
  }
  if (msg.includes('Failed to fetch')) {
    showToast.warning('Sin conexión', 'Trabajando en modo offline.');
    return;
  }
  showToast.error('Error guardando datos', 'Inténtalo de nuevo.');
  reportError(error, `supabase:${context}`);
};

// ─── GLOBAL ERROR CATCHER ─────────────────────────────────────────────────────

export const initGlobalErrorHandler = () => {
  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message || String(e.reason);
    if (msg.includes('Failed to fetch') || msg.includes('ResizeObserver')) return;
    reportError(e.reason, 'unhandledrejection');
  });
};
