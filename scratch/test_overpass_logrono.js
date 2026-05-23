const fetch = globalThis.fetch || require('node-fetch');

async function testQuery(name, lat, lon) {
    console.log(`\n=== Testing for: ${name} (${lat}, ${lon}) ===`);
    const delta = 0.001; // ~80m
    const query = `[out:json][timeout:8];node["entrance"~"main|yes"](${lat - delta},${lon - delta},${lat + delta},${lon + delta});out body;`;
    
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        });
        if (!res.ok) {
            console.log(`Failed to fetch Overpass: ${res.status}`);
            return;
        }
        const data = await res.json();
        console.log(`Query (delta=0.001) found ${data.elements?.length || 0} entrance nodes:`);
        if (data.elements) {
            for (const el of data.elements) {
                console.log(` - Node ${el.id}: (${el.lat}, ${el.lon}) tags:`, el.tags);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

async function testLargeDeltaQuery(name, lat, lon) {
    console.log(`\n=== Testing with LARGE delta (0.002 ≈ 160m) for: ${name} ===`);
    const delta = 0.002;
    const query = `[out:json][timeout:8];node["entrance"~"main|yes"](${lat - delta},${lon - delta},${lat + delta},${lon + delta});out body;`;
    
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        });
        const data = await res.json();
        console.log(`Query (delta=0.002) found ${data.elements?.length || 0} entrance nodes:`);
        if (data.elements) {
            for (const el of data.elements) {
                console.log(` - Node ${el.id}: (${el.lat}, ${el.lon}) tags:`, el.tags);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

async function testNameQuery(name) {
    console.log(`\n=== Testing NAME-based query for: ${name} ===`);
    const query = `[out:json][timeout:8];nwr["name"~"${name}",i];out body center;`;
    
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        });
        const data = await res.json();
        console.log(`Name query found ${data.elements?.length || 0} elements:`);
        if (data.elements) {
            for (const el of data.elements) {
                const lat = el.lat || el.center?.lat;
                const lon = el.lon || el.center?.lon;
                console.log(` - ${el.type} ${el.id} "${el.tags?.name}": (${lat}, ${lon}) tags:`, el.tags);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

async function run() {
    // Parlamento de La Rioja: ~ 42.46660, -2.44970 (convento de la merced)
    await testQuery("Parlamento de La Rioja", 42.46660, -2.44970);
    await testLargeDeltaQuery("Parlamento de La Rioja", 42.46660, -2.44970);
    await testNameQuery("Parlamento de La Rioja");
    await testNameQuery("Merced"); // Convento de la Merced
    
    // Museo de La Rioja: ~ 42.46582, -2.44876
    await testQuery("Museo de La Rioja", 42.46582, -2.44876);
    await testLargeDeltaQuery("Museo de La Rioja", 42.46582, -2.44876);
    await testNameQuery("Museo de La Rioja");
}

run();
