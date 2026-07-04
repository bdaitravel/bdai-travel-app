import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ActiveTourCard } from '../components/TourCard';
import { useAppStore } from '../store/useAppStore';
import { syncUserProfile, fetchCityToursMerged } from '../services/supabaseClient';
import { tourCacheService } from '../lib/tourCacheService';
import { BdaiLogo } from '../components/BdaiLogo';
import { Tour } from '../types';

// El tourId tiene el formato "slug_lang_tourIdx" (ej: "logrono_es_0", "san_sebastian_es_1")
// El slug puede contener guiones bajos internos, así que extraemos desde la derecha.
const parseTourId = (tourId: string): { slug: string; lang: string; tourIdx: number } => {
  const parts = tourId.split('_');
  const tourIdx = parseInt(parts[parts.length - 1], 10);
  const lang = parts[parts.length - 2];
  const slug = parts.slice(0, -2).join('_');
  return { slug, lang, tourIdx: isNaN(tourIdx) ? 0 : tourIdx };
};

export const TourActiveView: React.FC = () => {
  const { 
    currentTour: activeTour, 
    userProfile: user, 
    currentStopIndex, 
    setCurrentStopIndex, 
    setUserProfile,
    setVisaToShare,
    setCurrentTour,
    setActiveTours,
    userLocation,
    selectedCityInfo,
    hasHydrated
  } = useAppStore();

  const navigate = useNavigate();
  const { tourId, stopIdx } = useParams();
  const idx = parseInt(stopIdx || '0', 10);

  const [isRehydrating, setIsRehydrating] = useState(false);
  const [rehydrationFailed, setRehydrationFailed] = useState(false);

  // Sincroniza el índice de la URL con el store
  useEffect(() => {
    if (idx !== currentStopIndex) {
      setCurrentStopIndex(idx);
    }
  }, [tourId, idx, currentStopIndex, setCurrentStopIndex]);

  // Rehidratación desde Supabase cuando el estado se perdió (app matada por Android,
  // cambio de app, bloqueo de pantalla con proceso reciclado, etc.)
  useEffect(() => {
    if (!hasHydrated) return;        // Esperar a que Zustand termine de cargar desde storage
    if (activeTour) return;          // Ya tenemos el tour en memoria, nada que hacer
    if (!tourId) { setRehydrationFailed(true); return; }
    if (rehydrationFailed) return;   // Ya intentamos y fallamos, no reintentar

    const rehydrate = async () => {
      setIsRehydrating(true);
      // Extraer fuera del try para que catch/offline puedan usarlo
      const { slug, lang, tourIdx } = parseTourId(tourId);

      const applyTours = (rawTours: Tour[]) => {
        // Buscar por id exacto primero: los tours patrocinados usan sufijo "sp"
        // (ej. agoncillo_spain_es_sp0) cuyo índice no es numérico. Fallback al
        // índice parseado — comportamiento original para tours normales.
        const tour = rawTours.find(t => t.id === tourId) ?? rawTours[tourIdx] ?? rawTours[0];
        setActiveTours(rawTours);
        setCurrentTour(tour);
        setCurrentStopIndex(idx);
      };

      try {
        // Carga unificada: tours_cache (query original) + sponsored_tours al final
        const { tours } = await fetchCityToursMerged(slug, lang);

        if (tours.length > 0) {
          tourCacheService.saveTours(slug, lang, tours);
          applyTours(tours);
        } else {
          // Supabase no tiene datos — intentar caché local antes de rendirse
          const offline = tourCacheService.loadTours(slug, lang);
          if (offline && offline.length > 0) {
            applyTours(offline);
          } else {
            console.warn(`[TourActiveView] No cache found for tour "${tourId}". Redirecting to home.`);
            setRehydrationFailed(true);
          }
        }
      } catch (e) {
        console.error('[TourActiveView] Rehydration error:', e);
        // Sin red: intentar la copia local antes de redirigir al home
        const offline = tourCacheService.loadTours(slug, lang);
        if (offline && offline.length > 0) {
          applyTours(offline);
        } else {
          setRehydrationFailed(true);
        }
      } finally {
        setIsRehydrating(false);
      }
    };

    rehydrate();
  }, [hasHydrated, activeTour, tourId, rehydrationFailed]);

  const updateUserAndSync = (u: any) => {
    setUserProfile(u);
    if (u.isLoggedIn) syncUserProfile(u);
  };

  // Pantalla de carga mientras Zustand rehidrata desde storage o hacemos fetch a Supabase
  if (!hasHydrated || isRehydrating) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center gap-4">
        <BdaiLogo className="w-16 h-16 animate-pulse" />
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest animate-pulse">
          {user.language === 'es' ? 'cargando tour...' : 'loading tour...'}
        </p>
      </div>
    );
  }

  // Si tras la rehidratación no hay tour, volver al home
  if (!activeTour || rehydrationFailed) return <Navigate to="/home" />;

  return (
    <ActiveTourCard 
      tour={activeTour} 
      user={user} 
      currentStopIndex={idx} 
      onNext={() => navigate(`/tour/${tourId}/stop/${idx + 1}`)} 
      onPrev={() => navigate(`/tour/${tourId}/stop/${idx - 1}`)} 
      onJumpTo={(i: number) => navigate(`/tour/${tourId}/stop/${i}`)} 
      onUpdateUser={updateUserAndSync} 
      language={user.language} 
      onBack={() => navigate(`/city/${selectedCityInfo?.slug || ''}`)} 
      userLocation={userLocation} 
      onTourComplete={() => {
        // Limpiar la ruta guardada al completar el tour
        localStorage.removeItem('bdai_last_tour_route');
        setVisaToShare({ 
          cityName: activeTour.city, 
          miles: activeTour.stops.reduce((acc, s) => acc + (s.photoSpot?.milesReward || 0), 0) 
        });
      }} 
    />
  );
};
