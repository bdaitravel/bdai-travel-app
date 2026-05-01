import { Tour, TourCache, Stop } from '../../types';
import { supabase } from './client';
import { normalizeKey } from '../supabaseClient';
import { slugToDisplayName } from '../../lib/slugToDisplayName';

export const checkIfCityCached = async (city: string, slug: string, language = 'es'): Promise<boolean> => {
    if (!slug) return false;
    const lang = language || 'es';
    try {
        const { data: d1 } = await supabase
            .from('tours_cache').select('city, status').eq('city', slug).eq('language', lang).limit(1);

        if (d1 && d1.length > 0 && d1[0].status === 'READY') return true;

        const cityOnly = slug.split('_')[0];
        if (!cityOnly) return false;
        const { data: d2 } = await supabase
            .from('tours_cache').select('city, status')
            .ilike('city', `${cityOnly}%`).eq('language', lang).eq('status', 'READY').limit(1);
        return !!(d2 && d2.length > 0);
    } catch (e) { return false; }
};

export const searchCitiesInCache = async (query: string, language = 'es'): Promise<any[]> => {
    if (!query || query.length < 2) return [];
    // Normalizar la query para que "logroño" encuentre "logrono_spain"
    const normalizedQuery = query
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().trim().replace(/\s+/g, '_');
    try {
        const { data, error } = await supabase
            .from('tours_cache')
            .select('city, language')
            .ilike('city', `%${normalizedQuery}%`)
            .eq('status', 'READY')
            .eq('language', language)
            .limit(8);

        if (error) throw error;

        const seen = new Set<string>();
        return (data || []).reduce((acc: any[], curr: any) => {
            if (!seen.has(curr.city)) {
                seen.add(curr.city);
                const { city, country, countryCode, fullName } = slugToDisplayName(curr.city);
                acc.push({
                    name: city,
                    city,
                    cityLocal: city,
                    country,
                    countryEn: country,
                    countryCode,
                    fullName,
                    isCached: true,
                    slug: curr.city,
                });
            }
            return acc;
        }, []);
    } catch (e) {
        return [];
    }
};

export const getCachedTours = async (city: string, country: string, language: string): Promise<{ data: Tour[], langFound: string, cityName: string } | null> => {
    const slug = normalizeKey(city, country);
    if (!slug) return null;
    try {
        const { data, error } = await supabase.from('tours_cache')
            .select('data, language, city')
            .eq('city', slug).eq('language', language.toLowerCase()).maybeSingle();
        if (!error && data?.data) return { data: data.data, langFound: language, cityName: data.city };

        const cityOnly = slug.split('_')[0];
        const { data: d2 } = await supabase.from('tours_cache')
            .select('data, language, city')
            .ilike('city', `${cityOnly}%`).eq('language', language.toLowerCase()).maybeSingle();
        if (d2?.data) return { data: d2.data, langFound: language, cityName: d2.city };
    } catch (e) { console.warn("Cache lookup failed", e); }
    return null;
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
    const slug = normalizeKey(city, country);
    if (!slug) return;
    try {
        const routePolylines: Record<string, string> = {};
        const cleanTours = tours.map(tour => {
            if (tour.routePolyline && tour.id) {
                routePolylines[tour.id] = tour.routePolyline;
            }
            return tour;
        });

        await supabase.rpc('upsert_tours_cache_rpc', {
            p_city: slug,
            p_language: language.toLowerCase(),
            p_data: cleanTours,
            p_route_polylines: routePolylines,
            p_status: 'READY',
            p_locked_until: null
        });

        const savedCount = Object.keys(routePolylines).length;
        if (savedCount > 0) {
            console.log(`🗺️ Cache saved: ${savedCount}/${tours.length} polylines persisted for ${slug} (Status: READY)`);
        }
    } catch (e) { console.error("❌ Error saving cache:", e); }
};

export const tryLockCityForGeneration = async (slug: string, language: string): Promise<{ locked: boolean, data?: Tour[], isNew?: boolean }> => {
    try {
        const { data: existing, error: selectError } = await supabase
            .from('tours_cache')
            .select('status, data, locked_until, route_polylines')
            .eq('city', slug)
            .eq('language', language.toLowerCase())
            .maybeSingle();

        if (selectError) throw selectError;

        const now = new Date();
        const tenMinsFromNow = new Date(now.getTime() + 10 * 60000).toISOString();

        if (existing) {
            if (existing.status === 'READY') {
                const savedPolylines: Record<string, string> = existing.route_polylines || {};
                const toursWithPolylines = (existing.data as Tour[] || []).map(tour => ({
                    ...tour,
                    routePolyline: savedPolylines[tour.id] ?? tour.routePolyline
                }));
                return { locked: false, data: toursWithPolylines };
            }

            const lockedUntil = existing.locked_until ? new Date(existing.locked_until) : null;
            if (lockedUntil && lockedUntil > now) {
                return { locked: true, isNew: false };
            }

            const { data: lockSuccess, error: lockError } = await supabase.rpc('lock_tour_cache_rpc', {
                p_city: slug,
                p_language: language.toLowerCase(),
                p_locked_until: tenMinsFromNow
            });
            if (lockError) throw lockError;
            if (!lockSuccess) return { locked: true, isNew: false };

            return { locked: true, isNew: true };
        }

        const { data: lockSuccess, error: lockError } = await supabase.rpc('lock_tour_cache_rpc', {
            p_city: slug,
            p_language: language.toLowerCase(),
            p_locked_until: tenMinsFromNow
        });

        if (lockError) throw lockError;
        if (!lockSuccess) return { locked: true, isNew: false };

        return { locked: true, isNew: true };
    } catch (e) {
        console.error("Lock error:", e);
        return { locked: false };
    }
};

export const getRoutePolylines = async (citySlug: string, language: string): Promise<Record<string, string>> => {
    try {
        const { data, error } = await supabase
            .from('tours_cache')
            .select('route_polylines')
            .eq('city', citySlug)
            .eq('language', language.toLowerCase())
            .maybeSingle();
        if (error || !data?.route_polylines) return {};
        return data.route_polylines as Record<string, string>;
    } catch (e) {
        return {};
    }
};

export const updateRoutePolyline = async (
    citySlug: string,
    language: string,
    tourId: string,
    polyline: string
): Promise<boolean> => {
    try {
        const { error } = await supabase.rpc('upsert_tour_polyline', {
            p_city: citySlug,
            p_language: language.toLowerCase(),
            p_tour_id: tourId,
            p_polyline: polyline
        });
        if (error) throw error;
        return true;
    } catch (e) {
        console.warn('⚠️ Could not persist polyline to cache (non-critical):', e);
        return false;
    }
};

export const updateTourStopLocation = async (citySlug: string, language: string, stopId: string, lat: number, lng: number) => {
    try {
        const { data: cached } = await supabase
            .from('tours_cache')
            .select('data, route_polylines, status, locked_until')
            .eq('city', citySlug)
            .eq('language', language.toLowerCase())
            .maybeSingle();

        if (cached && cached.data) {
            const updatedData = cached.data.map((tour: Tour) => ({
                ...tour,
                stops: tour.stops.map((stop: Stop) =>
                    stop.id === stopId ? { ...stop, latitude: lat, longitude: lng } : stop
                )
            }));

            await supabase.rpc('upsert_tours_cache_rpc', {
                p_city: citySlug,
                p_language: language.toLowerCase(),
                p_data: updatedData,
                p_route_polylines: cached.route_polylines || {},
                p_status: cached.status || 'READY',
                p_locked_until: cached.locked_until || null
            });
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error updating stop location:", e);
        return false;
    }
};

export const getAllToursCache = async (): Promise<TourCache[]> => {
    try {
        const { data, error } = await supabase.from('tours_cache').select('*');
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Error fetching all tours cache:", e);
        return [];
    }
};

export const getCommunityPosts = async (city: string) => { return []; };
export const getCityPosts = async (city: string) => { return []; };
export const addCommunityPost = async (post: any) => { return { success: true }; };
export const addCommunityPostSecure = async (citySlug: string, posts: any[]) => {
    return await supabase.rpc('add_community_post', {
        p_city: citySlug,
        p_posts: posts
    });
};
export const saveCityPostcard = async (city: string, country: string, imageUrl: string) => { return true; };