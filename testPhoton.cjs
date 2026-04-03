const queries = [
    "gota de leche logroño",
    "convento madre de dios logroño",
    "puerta del revellin logroño",
    "muralla del revellin logroño",
    "escuelas pias logroño"
];

async function run() {
    for (const q of queries) {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`;
        console.log("Query:", q);
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                console.log("Found:", data.features[0].properties.name, "@", data.features[0].geometry.coordinates);
            } else {
                console.log("Not found in Photon");
            }
        } catch(e) { console.log("Error:", e.message) }
    }
}
run();
