import React, { useState, useEffect } from 'react';
import { audioManager, AudioState } from '../services/audioManager';

export const FloatingAudioPlayer: React.FC = () => {
  const [audioState, setAudioState] = useState<AudioState>(audioManager.getState());

  useEffect(() => {
    audioManager.setOnStateChange((state) => {
      setAudioState({ ...state });
    });
    return () => {
      audioManager.setOnStateChange(() => {});
    };
  }, []);

  // Solo mostrar si hay audio activo
  if (!audioState.isPlaying && !audioState.isLoading) return null;

  return (
    <div
      style={{ zIndex: 99998 }}
      className="fixed bottom-36 left-1/2 -translate-x-1/2 animate-slide-up pointer-events-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-5 py-3 flex items-center gap-4 shadow-2xl shadow-purple-500/20 min-w-[220px]">
        
        {/* Icono animado */}
        <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
          {audioState.isLoading ? (
            <i className="fas fa-spinner fa-spin text-white text-xs"></i>
          ) : (
            <div className="flex items-end gap-[2px] h-4">
              <div className="w-[3px] bg-white rounded-full animate-bounce" style={{ height: '40%', animationDelay: '0ms' }}></div>
              <div className="w-[3px] bg-white rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms' }}></div>
              <div className="w-[3px] bg-white rounded-full animate-bounce" style={{ height: '60%', animationDelay: '300ms' }}></div>
              <div className="w-[3px] bg-white rounded-full animate-bounce" style={{ height: '80%', animationDelay: '100ms' }}></div>
            </div>
          )}
        </div>

        {/* Nombre de la parada */}
        <div className="flex-1 min-w-0">
          <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest">
            {audioState.isLoading ? 'Cargando audio...' : 'DAI habla'}
          </p>
          <p className="text-white font-black text-[11px] truncate uppercase tracking-tight">
            {audioState.stopName || '...'}
          </p>
        </div>

        {/* Botón stop */}
        <button
          onClick={() => audioManager.stop()}
          className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center text-red-400 active:scale-90 transition-all shrink-0 hover:bg-red-500/30"
        >
          <i className="fas fa-stop text-[10px]"></i>
        </button>
      </div>
    </div>
  );
};
