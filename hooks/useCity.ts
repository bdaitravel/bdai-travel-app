import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useDebounce } from '../lib/useDebounce';
import { 
    generateToursForCity, normalizeCityWithAI, fetchRoutePolyline 
} from '../services/geminiService';
import { 
    supabase, checkIfCityCached, normalizeKey, updateRoutePolyline 
} from '../services/supabaseClient';
import { toast } from '../components/Toast';
import { Tour } from '../types';
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

    const processCitySelection = async (selection: any, langCode: string, forceRefresh = false) => {
        const t = translations[langCode] || translations.en;
        setIsLoading(true); 
        setSearchOptions(null); 
        setSearchVal(''); 

        const cleanName = selection.name?.split(',')[0].trim() || selection.city;
        const slug = (selection.slug || normalizeKey(cleanName, selection.countryEn || selection.country))
          .replace(/-/g, '_').toLowerCase();

        const backfillMissingPolylines = (tours: Tour[], citySlug: string, lang: string): void => {
          const toursMissingPolyline = tours.filter(t => !t.routePolyline && t.stops?.length >= 2);
          if (toursMissingPolyline.length === 0) return;

          console.log(`🔄 Backfilling ${toursMissingPolyline.length} tour(s) without polyline for ${citySlug}...`);

          (async () => {
            for (const tour of toursMissingPolyline) {
              try {
                const polyline = await fetchRoutePolyline(tour.stops);
                if (polyline && tour.id) {
                  await updateRoutePolyline(citySlug, lang, tour.id, polyline);
                  console.log(`✅ Polyline backfilled for tour: ${tour.title}`);
                }
              } catch (e) {
                console.warn(`⚠️ Backfill failed for ${tour.title} (non-critical):`, e);
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
              .eq('city', slug).eq('language', langCode.toLowerCase());
          }

          const { data: existing } = await supabase
            .from('tours_cache')
            .select('data, route_polylines')
            .eq('city', slug)
            .eq('language', langCode.toLowerCase())
            .maybeSingle();

          if (existing && existing.data && existing.data.length > 0) {
            const savedPolylines: Record<string, string> = existing.route_polylines || {};
            const toursWithPolylines = (existing.data as Tour[]).map((tour: Tour) => ({
              ...tour,
              routePolyline: savedPolylines[tour.id] ?? tour.routePolyline
            }));
            
            setTours(toursWithPolylines);
            navigate(`/city/${slug}`);
            setIsLoading(false);
            backfillMissingPolylines(toursWithPolylines, slug, langCode);
            return;
          }

          setLoadingMessage(t.generating);

          const generated = await generateToursForCity(
            cleanName,
            selection.countryEn || selection.country,
            { ...user, language: langCode } as any,
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
            // Si no devuelve tours y hemos estado un buen rato esperando, puede ser un Timeout encubierto
            toast("La generación ha tardado demasiado o excedió el límite de Supabase. Por favor, reintenta.", 'error');
            setSearchVal(cleanName); // Mantener el input para reintentar fácil
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
          processCitySelection({
            city: name,
            name: name,
            country: country,
            countryEn: country,
            slug: slug
          }, user.language);
        } else {
          handleCitySearch(name);
        }
    };

    const doSearch = useDebounce(async (val: string) => {
        if (val.length < 2) { setSearchOptions(null); setIsSearching(false); return; }
        try {
          const aiResults = await normalizeCityWithAI(val, user.language);
          const results = await Promise.all(aiResults.map(async (res) => {
            const slug = res.slug.replace(/-/g, '_').toLowerCase();
            const isCached = await checkIfCityCached(res.city, slug);
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
          setSearchOptions(results);
        } catch (e) {
          console.error("Search protocol error:", e);
        } finally {
          setIsSearching(false);
        }
    }, 1000);

    const handleCitySearch = (val: string) => {
        setSearchVal(val);
        if (val.length < 2) { setSearchOptions(null); return; }
        setIsSearching(true);
        doSearch(val);
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
