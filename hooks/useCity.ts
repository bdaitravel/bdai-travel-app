import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useDebounce } from '../lib/useDebounce';
import {
    generateToursForCity, normalizeCityWithAI, fetchRoutePolyline
} from '../services/geminiService';
import {
    supabase, checkIfCityCached, normalizeKey, updateRoutePolyline,
    searchCitiesInCache
} from '../services/supabaseClient';
import { toast } from '../components/Toast';
import { Tour } from '../types';
import { tourCacheService } from '../lib/tourCacheService';
import { translations } from '../data/translations';

export const useCity = () => {
    const {
        userProfile: user,
        setActiveTours: setTours,
        setSelectedCityInfo,
        setIsLoading,
        setLoadingMessage
    } = useAppStore();
    const navigate = useNavigate();

    const [searchVal, setSearchVal] = useState('');
    const [searchOptions, setSearchOptions] = useState<any[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Ref para que doAiSearch acceda a los resultados locales actuales sin closure stale
    const localResultsRef = useRef<any[]>([]);

    const processCitySelection = async (selection: any, langCode: string, forceRefresh = false) => {
        const lang = langCode || user.language || 'es';
        const t = translations[lang] || translations.en;
        setIsLoading(true);
        setSearchOptions(null);
        setSearchVal('');

        const cleanName = selection.name?.split(',')[0].trim() || selection.city;
        const slug = (selection.slug || normalizeKey(cleanName, selection.countryEn || selection.country))
          .replace(/-/g, '_').toLowerCase();

        const backfillMissingPolylines = (tours: Tour[], citySlug: string, l: string): void => {
          const toursMissingPolyline = tours.filter(t => !t.routePolyline && t.stops?.length >= 2);
          if (toursMissingPolyline.length === 0) return;

          (async () => {
            for (const tour of toursMissingPolyline) {
              try {
                const polyline = await fetchRoutePolyline(tour.stops);
                if (polyline && tour.id) await updateRoutePolyline(citySlug, l, tour.id, polyline);
              } catch (e) {
                console.warn(`⚠️ Backfill failed for ${tour.title}:`, e);
              }
            }
          })();
        };

        setSelectedCityInfo({
          city: cleanName,
          country: selection.country,
          countryEn: selection.countryEn || selection.country,
          slug: slug
        });

        try {
          setTours([]);
          setLoadingMessage(forceRefresh ? t.rewriting : t.syncing);

          if (forceRefresh) {
            setLoadingMessage(t.purging);
            await supabase.from('tours_cache').delete()
              .eq('city', slug).eq('language', lang);
          }

          const { data: existing } = await supabase
            .from('tours_cache')
            .select('data, route_polylines')
            .eq('city', slug)
            .eq('language', lang)
            .maybeSingle();

          if (existing && existing.data && existing.data.length > 0) {
            const savedPolylines: Record<string, string> = existing.route_polylines || {};
            const toursWithPolylines = (existing.data as Tour[]).map((tour: Tour) => ({
              ...tour,
              routePolyline: savedPolylines[tour.id] ?? tour.routePolyline
            }));

            tourCacheService.saveTours(slug, lang, toursWithPolylines);
            setTours(toursWithPolylines);
            navigate(`/city/${slug}`);
            setIsLoading(false);
            backfillMissingPolylines(toursWithPolylines, slug, lang);
            return;
          }

          setLoadingMessage(t.generating);

          const generated = await generateToursForCity(
            cleanName,
            selection.countryEn || selection.country,
            { ...user, language: lang } as any,
            (tour) => {
              setTours(prev => {
                const existingIdx = prev.findIndex(t => t.id === tour.id);
                if (existingIdx !== -1) {
                  const updated = [...prev];
                  updated[existingIdx] = tour;
                  return updated;
                }
                return [...prev, tour];
              });
            }
          );

          if (generated && generated.length > 0) {
            setTours(generated);
            navigate(`/city/${slug}`);
            setIsLoading(false);
          } else {
            toast("La generación ha tardado demasiado o excedió el límite de Supabase. Por favor, reintenta.", 'error');
            setSearchVal(cleanName);
            setIsLoading(false);
          }

        } catch (e: any) {
          console.error("Selection error:", e);
          if (e?.message?.includes("Fallo en la generación") || e?.message?.includes("504") || e?.message?.includes("Timeout")) {
              toast("El servidor tardó demasiado (Timeout de protección). Inténtalo de nuevo.", 'error');
          } else {
              toast("Error inesperado generando la ciudad", 'error');
          }
        } finally {
          setIsLoading(false);
        }
    };

    const handleTravelServiceSelect = (name: string, country?: string) => {
        if (country) {
          const slug = normalizeKey(name, country);
          processCitySelection({ city: name, name, country, countryEn: country, slug }, user.language);
        } else {
          handleCitySearch(name);
        }
    };

    // ── Fase 1: Supabase instantánea (150ms) ─────────────────────────────────
    const doLocalSearch = useDebounce(async (val: string) => {
        if (val.length < 2) {
            localResultsRef.current = [];
            setSearchOptions(null);
            return;
        }
        const lang = user.language || 'es';
        const cached = await searchCitiesInCache(val, lang);
        localResultsRef.current = cached;
        if (cached.length > 0) setSearchOptions(cached);
    }, 150);

    // ── Fase 2: Gemini en paralelo (1000ms) ──────────────────────────────────
    const doAiSearch = useDebounce(async (val: string) => {
        if (val.length < 2) { setIsSearching(false); return; }
        const lang = user.language || 'es';
        try {
          const aiResults = await normalizeCityWithAI(val, lang);
          const enriched = await Promise.all(aiResults.map(async (res) => {
            const slug = res.slug.replace(/-/g, '_').toLowerCase();
            const isCached = await checkIfCityCached(res.city, slug, lang);
            return {
              name: res.city,
              city: res.city,
              cityLocal: res.cityLocal,
              country: res.country,
              countryEn: res.countryEn,
              countryCode: res.countryCode,
              slug,
              isCached,
              fullName: res.cityLocal || res.city
            };
          }));

          // Merge: los resultados de caché van primero. Si la IA tiene el mismo slug,
          // enriquece la entrada local con nombre correcto (acentos) y flag.
          const merged = [...localResultsRef.current];
          for (const aiResult of enriched) {
            const localIdx = merged.findIndex(r => r.slug === aiResult.slug);
            if (localIdx !== -1) {
              merged[localIdx] = { ...merged[localIdx], ...aiResult };
            } else {
              merged.push(aiResult);
            }
          }
          setSearchOptions(merged.length > 0 ? merged : null);
        } catch (e) {
          console.error("Search protocol error:", e);
          // Los resultados locales siguen visibles; no limpiar
        } finally {
          setIsSearching(false);
        }
    }, 1000);

    const handleCitySearch = (val: string) => {
        setSearchVal(val);
        if (val.length < 2) {
            localResultsRef.current = [];
            setSearchOptions(null);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        doLocalSearch(val); // responde en <150ms
        doAiSearch(val);    // enriquece en 5-20s
    };

    return {
        searchVal,
        setSearchVal,
        searchOptions,
        isSearching,
        processCitySelection,
        handleTravelServiceSelect,
        handleCitySearch
    };
};
