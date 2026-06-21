const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { input, language } = await req.json();

    if (!input || typeof input !== 'string' || input.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), { headers: jsonHeaders });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Falta GEMINI_API_KEY en los secretos de la edge function.');

    const lang = (language || 'es').toLowerCase();
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{
          text: `The user typed: "${input.trim()}" in language "${lang}" and is looking for a city or town to visit.

RULES:
- If the input exactly matches a known town or village name (no matter how small), ALWAYS include it.
- CRITICAL: If the city name exists in multiple countries, return ALL of them.
- If the spelling is misspelled, correct it and return the intended city.
- DO NOT invent or bring up random cities that are completely unrelated to the input just to fill up the results.
- Return up to 5 results. If there is only 1 valid match or corrected city, returning just 1 result is perfectly fine.

For each result return:
- "cityEn": Official city name in ENGLISH ONLY.
- "cityLocal": City name translated to "${lang}".
- "country": Country name in "${lang}".
- "countryEn": Country name in ENGLISH ONLY.
- "countryCode": 2-letter ISO country code in UPPERCASE.`
        }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              cityEn:      { type: 'STRING' },
              cityLocal:   { type: 'STRING' },
              country:     { type: 'STRING' },
              countryEn:   { type: 'STRING' },
              countryCode: { type: 'STRING' },
            },
            required: ['cityEn', 'cityLocal', 'country', 'countryEn', 'countryCode']
          }
        }
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://app.bdai.travel/'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15_000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      throw new Error(`Gemini respondió con status ${response.status}`);
    }

    const resJson = await response.json();
    const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const results = JSON.parse(text);

    return new Response(JSON.stringify({ results }), { headers: jsonHeaders });

  } catch (error: any) {
    console.error('search-city error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message, results: [] }),
      { headers: jsonHeaders, status: 500 }
    );
  }
});
