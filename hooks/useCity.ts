import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useDebounce } from '../lib/useDebounce';
import {
    normalizeCityWithAI, fetchRoutePolyline
} from '../services/geminiService';
import {
    supabase, checkIfCityCached, normalizeKey, updateRoutePolyline,
    searchCitiesInCache, searchMunicipalitiesNominatim
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

          // Tour no cacheado: registrar solicitud (el webhook dispara el email)
          const { error: reqError } = await supabase.from('tour_requests').insert({
            city: cleanName,
            country: selection.countryEn || selection.country,
            language: lang,
            slug,
            user_email: user.email || 'Anónimo'
          });
          if (reqError) console.error('Error registrando solicitud de tour:', reqError);

          toast(t.tourRequested || "We've received your request! We'll notify you when the tour is ready.", 'info');
          setSearchVal('');
          setIsLoading(false);
          return;

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

    // Merge por slug manteniendo orden: cacheados primero, luego por coincidencia exacta
    const mergeAndSort = (base: any[], incoming: any[]): any[] => {
        const merged = [...base];
        for (const item of incoming) {
            const idx = merged.findIndex(r => r.slug === item.slug);
            if (idx !== -1) {
                merged[idx] = { ...merged[idx], ...item };
            } else {
                merged.push(item);
            }
        }
        return merged.sort((a, b) => {
            const aScore = (a.isCached ? 0 : 2) + (a.isSuggestion ? 1 : 0);
            const bScore = (b.isCached ? 0 : 2) + (b.isSuggestion ? 1 : 0);
            return aScore - bScore;
        });
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

    // ── Fase 1.5: Nominatim municipios España (300ms) ─────────────────────────
    const doNominatimSearch = useDebounce(async (val: string) => {
        if (val.length < 2) return;
        const lang = user.language || 'es';
        try {
            const nominatimResults = await searchMunicipalitiesNominatim(val, lang);
            if (nominatimResults.length === 0) return;
            const enriched = await Promise.all(nominatimResults.map(async (r) => ({
                ...r,
                isCached: await checkIfCityCached(r.city, r.slug, lang)
            })));
            const merged = mergeAndSort(localResultsRef.current, enriched);
            localResultsRef.current = merged;
            setSearchOptions(merged.length > 0 ? merged : null);
        } catch {
            // silencioso — la Fase 2 AI sigue en marcha como respaldo
        }
    }, 300);

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

          const merged = mergeAndSort(localResultsRef.current, enriched);
          setSearchOptions(merged.length > 0 ? merged : null);
        } catch (e) {
          console.error("Search protocol error:", e);
          toast("Error en el buscador inteligente (AI).", "error");
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
        doLocalSearch(val);       // Fase 1: caché Supabase, ~150ms
        doNominatimSearch(val);   // Fase 1.5: Nominatim España, ~300ms
        doAiSearch(val);          // Fase 2: AI Gemini, ~5-20s
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
