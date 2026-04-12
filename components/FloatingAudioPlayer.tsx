import React, { useState, useEffect, useRef } from 'react';
import { audioManager, AudioState } from '../services/audioManager';
import { useAppStore } from '../store/useAppStore';
import { syncUserProfile } from '../services/supabaseClient';

export const FloatingAudioPlayer: React.FC = () => {
  const [audioState, setAudioState] = useState<AudioState>(audioManager.getState());
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const { userProfile, updateUserProfile } = useAppStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioManager.setOnStateChange((state) => {
      setAudioState({ ...state });
    });
    return () => {
      audioManager.setOnStateChange(() => {});
    };
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    if (showSpeedMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpeedMenu]);

  const handleSpeedChange = (speed: number) => {
    // 1. Actualizar manager de audio (cambio inmediato)
    audioManager.setSpeed(speed);
    
    // 2. Actualizar estado local del perfil para persistencia
    const updatedUser = { ...userProfile, audioSpeed: speed };
    updateUserProfile({ audioSpeed: speed });
    
    // 3. Sincronizar con Supabase
    if (userProfile.isLoggedIn) {
      syncUserProfile(updatedUser);
    }
    
    setShowSpeedMenu(false);
  };

  const speeds = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  // Solo mostrar si hay audio activo
  if (!audioState.isPlaying && !audioState.isLoading) return null;

  return (
    <div
      style={{ zIndex: 99998 }}
      className="fixed bottom-36 left-1/2 -translate-x-1/2 animate-slide-up pointer-events-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-5 py-3 flex items-center gap-3 shadow-2xl shadow-purple-500/20 min-w-[260px] relative">
        
        {/* Menú de Velocidad (Dropdown) */}
        {showSpeedMenu && (
          <div 
            ref={menuRef}
            className="absolute bottom-full left-0 right-0 mb-3 bg-slate-900/98 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-2 z-[99999] animate-fade-in"
          >
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2 px-3 pt-1">Playback Speed</p>
            <div className="grid grid-cols-3 gap-1">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`py-2 rounded-xl text-[10px] font-black transition-all ${
                    audioState.playbackRate === s 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {s.toFixed(2)}x
                </button>
              ))}
            </div>
          </div>
        )}

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

        <div className="flex items-center gap-2">
           {/* Selector de Velocidad */}
           <button
             onClick={() => setShowSpeedMenu(!showSpeedMenu)}
             className={`h-9 px-3 rounded-xl border flex items-center justify-center transition-all active:scale-95 text-[10px] font-black ${
               showSpeedMenu ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
             }`}
           >
             {audioState.playbackRate.toFixed(2)}x
           </button>

           {/* Botón stop */}
           <button
             onClick={() => audioManager.stop()}
             className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center text-red-400 active:scale-90 transition-all shrink-0 hover:bg-red-500/30"
           >
             <i className="fas fa-stop text-[10px]"></i>
           </button>
        </div>
      </div>
    </div>
  );
};
