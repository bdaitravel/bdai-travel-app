// Simpler test - just compare approaches
const LOGRONO_CENTER = { lat: 42.4668, lng: -2.4486 };

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function test(label, url) {
  await new Promise(r => setTimeout(r, 1200));
  const res = await fetch(url, { headers: { 'User-Agent': 'test/1.0' } });
  const data = await res.json();
  if (data.length > 0) {
    const r = data[0];
    const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
    const dist = haversine(LOGRONO_CENTER.lat, LOGRONO_CENTER.lng, lat, lon);
    const town = r.address?.city || r.address?.town || r.address?.village || '?';
    console.log(`${label}: ${town} (${lat.toFixed(5)}, ${lon.toFixed(5)}) → ${dist.toFixed(1)}km ${dist > 2 ? '⚠️' : '✅'}`);
  } else {
    console.log(`${label}: ❌ sin resultados`);
  }
}

(async () => {
  const stop = "Antiguo Ayuntamiento";
  const bbox = `${LOGRONO_CENTER.lng - 0.04},${LOGRONO_CENTER.lat + 0.03},${LOGRONO_CENTER.lng + 0.04},${LOGRONO_CENTER.lat - 0.03}`;
  
  console.log(`=== Tests para: "${stop}" ===\n`);
  
  // Method 1: Current approach (free text, no constraint)
  await test("Método actual    ", `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stop + ", Logroño, Spain")}&format=json&limit=1&addressdetails=1`);
  
  // Method 2: viewbox + bounded=1
  await test("Con viewbox      ", `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stop)}&format=json&limit=1&addressdetails=1&viewbox=${bbox}&bounded=1`);
  
  // Method 3: structured query
  await test("Structured query ", `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stop)}&city=Logroño&countrycodes=es&format=json&limit=1&addressdetails=1`);

  console.log(`\n=== Tests para: "Calle del Laurel" ===\n`);
  const stop2 = "Calle del Laurel";
  
  await test("Método actual    ", `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stop2 + ", Logroño, Spain")}&format=json&limit=1&addressdetails=1`);
  await test("Con viewbox      ", `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stop2)}&format=json&limit=1&addressdetails=1&viewbox=${bbox}&bounded=1`);
  await test("Structured query ", `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stop2)}&city=Logroño&countrycodes=es&format=json&limit=1&addressdetails=1`);
})();
