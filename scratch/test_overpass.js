
async function fetchOverpassCatalog(bbox) {
    const [south, north, west, east] = bbox;
    const bboxStr = `${south},${west},${north},${east}`;
    const query = `[out:json][timeout:25];(nwr["historic"](${bboxStr});nwr["tourism"~"attraction|museum|gallery|viewpoint|artwork|wine_cellar"](${bboxStr});nwr["amenity"~"place_of_worship|marketplace|theatre|arts_centre"](${bboxStr});nwr["man_made"="bridge"]["name"](${bboxStr});nwr["leisure"~"park|garden"]["name"](${bboxStr});nwr["building"~"cathedral|church|mosque|synagogue|palace|castle"]["name"](${bboxStr}););out center tags;`;
    console.log(`Querying Overpass for bbox: ${bboxStr}`);
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(query)}` });
        if (!res.ok) {
            console.error(`Overpass error: ${res.status}`);
            return [];
        }
        const data = await res.json();
        return (data.elements || []).map(el => ({
            name: el.tags?.name,
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            type: el.tags?.historic || el.tags?.tourism || 'poi'
        })).filter(p => p.name && p.lat);
    } catch (e) { 
        console.error('Fetch failed:', e);
        return []; 
    }
}

const bbox = [ '42.4288461', '42.5199157', '-2.5422727', '-2.3419680' ];
fetchOverpassCatalog(bbox).then(catalog => {
    console.log(`Catalog size: ${catalog.length}`);
    if (catalog.length > 0) {
        console.log(`Sample POI: ${catalog[0].name}`);
    }
});
