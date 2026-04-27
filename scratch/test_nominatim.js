
async function getCityInfo(city, country) {
    try {
        const query = encodeURIComponent(`${city}, ${country}`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1&extratags=1`;
        console.log(`Searching: ${url}`);
        const res = await fetch(url, { headers: { 'User-Agent': 'BDAI-Travel-App/1.0', 'Accept-Language': 'en' }});
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                return { 
                    lat: parseFloat(data[0].lat), 
                    lon: parseFloat(data[0].lon), 
                    name: data[0].display_name,
                    bbox: data[0].boundingbox
                };
            }
        }
    } catch(e) { console.warn('getCityInfo failed:', e); }
    return null;
}

const city = "logrono";
const country = "spain";

getCityInfo(city, country).then(info => {
    console.log("Result for 'logrono':", info);
});

getCityInfo("Logroño", country).then(info => {
    console.log("Result for 'Logroño':", info);
});
