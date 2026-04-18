// Export components from specific files
export { supabase } from './supabase/client';
export * from './supabase/profileService';
export * from './supabase/rankingService';
export * from './supabase/toursService';
export * from './supabase/audioService';

// Utilities kept here for backward compatibility
export const normalizeKey = (city: string | undefined | null, country?: string): string => {
  const clean = (text: string) => text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s\-\/\\]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const safeCity = clean(city || '');
  if (!safeCity) return '';
  
  const safeCountry = clean(country || '');
  if (!safeCountry || safeCountry === 'cache') return safeCity;
  if (safeCity.endsWith(`_${safeCountry}`)) return safeCity;
  
  return `${safeCity}_${safeCountry}`;
};

export const validateEmailFormat = (email: string) => { 
  return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); 
};
