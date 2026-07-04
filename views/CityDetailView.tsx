import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TourCard } from '../components/TourCard';
// futura mejora, actualmente no implantado
// import { CityCommunity } from '../components/CityCommunity';
import { formatCityName } from '../components/TravelServices';
import { useAppStore } from '../store/useAppStore';
import { useCity } from '../hooks/useCity';
import { fetchCityToursMerged } from '../services/supabaseClient';
import { tourCacheService } from '../lib/tourCacheService';
import { translations } from '../data/translations';

export const CityDetailView: React.FC = () => {
  const {
    userProfile: user,
    selectedCityInfo,
    activeTours: tours,
    setActiveTours: setTours,
    setCurrentTour: setActiveTour
  } = useAppStore();
  const { processCitySelection } = useCity();
  const navigate = useNavigate();
  const { slug: slugFromUrl } = useParams<{ slug: string }>();

  const [isHydrating, setIsHydrating] = useState(false);

  // Slug de la URL es la fuente de verdad — no dependemos del estado de Zustand
  const slug = slugFromUrl || selectedCityInfo?.slug || '';

  const t = translations[user.language] || translations.en;
  const normalTours = tours.filter(tr => !tr.isSponsored);
  const sponsoredTours = tours.filter(tr => tr.isSponsored);

  // Si llegamos a esta vista sin tours en memoria (ej. recarga, vuelta de background
  // en Chrome mobile, o pérdida de sessionStorage), los recuperamos directamente de
  // tours_cache usando el slug de la URL. La URL es siempre la fuente de verdad.
  useEffect(() => {
    if (!slug) return;
    if (tours && tours.length > 0) return; // ya tenemos datos, no hacer nada

    const rehydrateFromCache = async () => {
      setIsHydrating(true);
      // lang fuera del try para que catch pueda usarlo en el fallback offline
      const lang = user.language || 'es';
      try {
        // Carga unificada: tours_cache + sponsored_tours (misma query de siempre
        // para los normales; los patrocinados se añaden al final del array)
        const { tours: mergedTours } = await fetchCityToursMerged(slug, lang);

        if (mergedTours.length > 0) {
          tourCacheService.saveTours(slug, lang, mergedTours);
          setTours(mergedTours);
        } else {
          // Supabase sin datos — intentar copia local antes de volver al home
          const offline = tourCacheService.loadTours(slug, lang);
          if (offline && offline.length > 0) {
            setTours(offline);
          } else {
            console.warn(`[CityDetailView] No cache found for ${slug}. Redirecting to home.`);
            navigate('/home', { replace: true });
          }
        }
      } catch (e) {
        console.error('[CityDetailView] Rehydration error:', e);
        // Sin red: cargar la copia local si existe
        const offline = tourCacheService.loadTours(slug, lang);
        if (offline && offline.length > 0) {
          setTours(offline);
        } else {
          navigate('/home', { replace: true });
        }
      } finally {
        setIsHydrating(false);
      }
    };

    rehydrateFromCache();
  }, [slug, user.language]); // Solo se dispara si cambia el slug o el idioma

  if (isHydrating) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest animate-pulse">
          {user.language === 'es' ? 'cargando tour...' : 'loading tour...'}
        </p>
      </div>
    );
  }

  return (
    <div className="pt-safe-iphone w-full max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 animate-fade-in relative z-10">
      <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/80 backdrop-blur-xl z-20">
        <button
          onClick={() => navigate('/home')}
          className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-90"
        >
          <i className="fas fa-arrow-left text-xs"></i>
        </button>
        <h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">
          {formatCityName(selectedCityInfo?.city || slug.split('_')[0] || '', user.language)}
        </h2>
        {user.isAdmin && selectedCityInfo && (
          <button
            onClick={() => processCitySelection(
              {
                city: selectedCityInfo.city,
                country: selectedCityInfo.country,
                countryEn: selectedCityInfo.countryEn,
                slug: selectedCityInfo.slug
              },
              user.language,
              true
            )}
            className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center active:rotate-180 transition-transform"
          >
            <i className="fas fa-sync-alt text-xs"></i>
          </button>
        )}
      </header>

      <div className="pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {normalTours.map((tour, idx) => (
            <TourCard
              key={`${tour.id}-${idx}`}
              tour={tour}
              onSelect={() => {
                setActiveTour(tour);
                navigate(`/tour/${tour.id}/stop/0`);
              }}
              language={user.language}
            />
          ))}
        </div>

        {/* Sección de tours patrocinados: solo existe en municipios que los tengan */}
        {sponsoredTours.length > 0 && (
          <>
            <div className="flex items-center gap-4 mt-10 mb-8">
              <div className="flex-1 h-px bg-[#f6c604]/60"></div>
              <span className="text-[#f6c604] text-[9px] font-black uppercase tracking-[0.3em]">
                {t.sponsoredSection || 'PATROCINADO'}
              </span>
              <div className="flex-1 h-px bg-[#f6c604]/60"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsoredTours.map((tour, idx) => (
                <TourCard
                  key={`${tour.id}-${idx}`}
                  tour={tour}
                  onSelect={() => {
                    setActiveTour(tour);
                    navigate(`/tour/${tour.id}/stop/0`);
                  }}
                  language={user.language}
                />
              ))}
            </div>
          </>
        )}
        {/* futura mejora, actualmente no implantado: sección de comunidad por ciudad */}
        {/* {slug && <CityCommunity citySlug={slug} user={user} />} */}
      </div>
    </div>
  );
};
