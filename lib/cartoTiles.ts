// Configuración compartida de teselas CARTO — usada por cualquier mapa Leaflet
// de la app (SchematicMap en el tour activo, CityDiscoveryMap en la pestaña
// de tours). Centralizado aquí para no duplicar la key/atribución en cada mapa.
//
// Key gratuita de CARTO (carto.com/basemaps/apikey) — obligatoria desde que
// CARTO retiró el acceso anónimo a sus teselas. Sin ella, CARTO devuelve una
// tesela-imagen con el aviso "API KEY REQUIRED" en vez de servir el mapa.
// Parámetro confirmado por email de CARTO (ago-2026): `key`, solo para el
// servicio raster — el vectorial aún no la exige (CARTO avisará cuando cambie).
const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY as string | undefined;

export const CARTO_TILE_URL = CARTO_API_KEY
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

// Atribución obligatoria: condición del tier gratuito de CARTO, licencia ODbL
// de OpenStreetMap, y política de uso del servicio de rutas OSRM de FOSSGIS
// (routing.openstreetmap.de, ver lib/routingService.ts).
export const CARTO_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a> · Routing: <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener">FOSSGIS</a>';
