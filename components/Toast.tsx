import React, { useState, useEffect } from 'react';

export const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  window.dispatchEvent(new CustomEvent('bdai-toast', { detail: { message, type } }));
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<{id: number, message: string, type: string}[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, ...customEvent.detail }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3500);
    };
    window.addEventListener('bdai-toast', handleToast);
    return () => window.removeEventListener('bdai-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-safe-iphone left-0 right-0 z-[99999] flex flex-col items-center gap-2 pointer-events-none px-4 mt-4">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-3 rounded-2xl shadow-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${t.type === 'error' ? 'bg-red-500 text-white' : t.type === 'success' ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'}`}>
          <i className={`fas ${t.type === 'error' ? 'fa-triangle-exclamation' : t.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}`}></i>
          {t.message}
        </div>
      ))}
    </div>
  );
};
