export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return new Response(JSON.stringify([]), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'bdai-travel-app/1.0',
        'Accept-Language': 'es,en'
      }
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify([]), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
