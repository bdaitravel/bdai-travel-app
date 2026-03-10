import React, { useState, useEffect } from 'react';
import { toastManager, Toast } from '../services/errorService';

const ICONS: Record<string, string> = {
  error:   'fa-circle-xmark text-red-400',
  success: 'fa-circle-check text-emerald-400',
  warning: 'fa-triangle-exclamation text-yellow-400',
  info:    'fa-circle-info text-blue-400',
};

const BORDERS: Record<string, string> = {
  error:   'border-red-500/30',
  success: 'border-emerald-500/30',
  warning: 'border-yellow-500/30',
  info:    'border-blue-500/30',
};

const ToastItem = ({ toast }: { toast: Toast }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeño delay para animación de entrada
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}
        bg-slate-900/95 backdrop-blur-xl border ${BORDERS[toast.type]}
        rounded-2xl p-4 shadow-2xl w-full max-w-sm pointer-events-auto
      `}
    >
      <div className="flex items-start gap-3">
        <i className={`fas ${ICONS[toast.type]} text-base mt-0.5 shrink-0`}></i>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-[11px] uppercase tracking-wider leading-tight">{toast.title}</p>
          {toast.message && (
            <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); toastManager.dismiss(toast.id); }}
              className="mt-2 text-purple-400 font-black text-[10px] uppercase tracking-widest"
            >
              {toast.action.label} →
            </button>
          )}
        </div>
        <button
          onClick={() => toastManager.dismiss(toast.id)}
          className="text-slate-600 hover:text-slate-400 transition-colors shrink-0 ml-1"
        >
          <i className="fas fa-xmark text-xs"></i>
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[99999] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
};
