import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
    normalizeCityWithAI, fetchRoutePolyline
} from '../services/geminiService';
import {
    supabase, checkIfCityCached, normalizeKey, updateRoutePolyline,
    searchCitiesInCache, searchMunicipalitiesNominatim, fetchCityToursMerged
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
    const [lastRequestedCity, setLastRequestedCity] = useState<string | null>(null);

    const searchTermRef = useRef<string>('');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    const processCitySelection = async (selection: any, langCode: string, forceRefresh = false) => {
        const lang = langCode || user.language || 'es';
        const t = translations[lang] || translations.en;
        
        const cleanName = selection.name?.split(',')[0].trim() || selection.city;
        const slug = (selection.slug || normalizeKey(cleanName, selection.countryEn || selection.country))
          .replace(/-/g, '_').toLowerCase();

        // ── Bypass del Loading Screen si ya sabemos que NO hay caché ──
        if (selection.isCached === false && !forceRefresh) {
          setSearchOptions(null);
          setSearchVal('');
          
          const { error: reqError } = await supabase.from('tour_requests').insert({
            city: cleanName,
            country: selection.countryEn || selection.country,
            language: lang,
            slug,
            user_email: user.email || 'Anónimo'
          });
          if (reqError) console.error('Error registrando solicitud de tour:', reqError);

          setLastRequestedCity(cleanName);
          return;
        }

        // Si tenemos que buscar en caché (o no estamos seguros), mostramos el loader general
        setIsLoading(true);
        setSearchOptions(null);
        setSearchVal('');

        const backfillMissingPolylines = (tours: Tour[], citySlug: string, l: string): void => {
          // Los patrocinados no tienen ruta: nunca calcular polylines para ellos
          const toursMissingPolyline = tours.filter(t => !t.isSponsored && !t.routePolyline && t.stops?.length >= 2);
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

          const { tours: mergedTours, hasNormal } = await fetchCityToursMerged(slug, lang);

          if (hasNormal) {
            tourCacheService.saveTours(slug, lang, mergedTours);
            setTours(mergedTours);
            navigate(`/city/${slug}`);
            setIsLoading(false);
            backfillMissingPolylines(mergedTours, slug, lang);
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

          setLastRequestedCity(cleanName);
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

    const executeSearchProtocol = async (val: string) => {
        if (searchTermRef.current !== val) return;
        
        setIsSearching(true);
        const lang = user.language || 'es';
        
        // Fase 1: Caché Local (instantáneo)
        const cached = await searchCitiesInCache(val, lang);
        if (searchTermRef.current !== val) return;
        
        setSearchOptions(cached.length > 0 ? cached : null);

        // Fase 2: Nominatim e IA en paralelo
        const nominatimPromise = searchMunicipalitiesNominatim(val, lang)
            .then(async (nominatimResults) => {
                if (nominatimResults.length === 0 || searchTermRef.current !== val) return;
                const enriched = await Promise.all(nominatimResults.map(async (r) => ({
                    ...r,
                    isCached: await checkIfCityCached(r.city, r.slug, lang)
                })));
                if (searchTermRef.current !== val) return;
                setSearchOptions(prev => {
                    const merged = mergeAndSort(prev || [], enriched);
                    return merged.length > 0 ? merged : null;
                });
            }).catch(() => {});

        const aiPromise = normalizeCityWithAI(val, lang)
            .then(async (aiResults) => {
                if (aiResults.length === 0 || searchTermRef.current !== val) return;
                const enriched = await Promise.all(aiResults.map(async (res) => {
                    const slug = res.slug.replace(/-/g, '_').toLowerCase();
                    const isCached = await checkIfCityCached(res.city, slug, lang);
                    
                    const normalizedQuery = val.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
                    const normalizedCity = (res.cityLocal || res.city).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
                    const isSuggestion = !normalizedCity.includes(normalizedQuery) && !normalizedQuery.includes(normalizedCity);

                    return {
                        name: res.city,
                        city: res.city,
                        cityLocal: res.cityLocal,
                        country: res.country,
                        countryEn: res.countryEn,
                        countryCode: res.countryCode,
                        slug,
                        isCached,
                        fullName: res.cityLocal || res.city,
                        isSuggestion
                    };
                }));
                if (searchTermRef.current !== val) return;
                setSearchOptions(prev => {
                    const merged = mergeAndSort(prev || [], enriched);
                    return merged.length > 0 ? merged : null;
                });
            }).catch((e) => {
                console.error("Search protocol error:", e);
                if (searchTermRef.current === val) {
                    toast("Error en el buscador inteligente (AI).", "error");
                }
            });

        await Promise.all([nominatimPromise, aiPromise]);
        
        if (searchTermRef.current === val) {
            setIsSearching(false);
        }
    };

    const handleCitySearch = (val: string) => {
        setSearchVal(val);
        searchTermRef.current = val;
        setLastRequestedCity(null);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        if (val.length < 2) {
            setSearchOptions(null);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        debounceTimerRef.current = setTimeout(() => {
            executeSearchProtocol(val);
        }, 1200);
    };

    const triggerImmediateSearch = () => {
        const val = searchVal.trim();
        if (val.length < 2) return;
        
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        
        searchTermRef.current = val;
        executeSearchProtocol(val);
    };

    return {
        searchVal,
        setSearchVal,
        searchOptions,
        isSearching,
        lastRequestedCity,
        processCitySelection,
        handleTravelServiceSelect,
        handleCitySearch,
        triggerImmediateSearch
    };
};
