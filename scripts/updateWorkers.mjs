import fs from 'fs';
import path from 'path';

// AI Worker 02
const pAi = path.resolve('services/supabase/edge-functions/tour-worker-ai-02.md');
let contentAi = fs.readFileSync(pAi, 'utf8');

contentAi = contentAi.replace(/const secret = req\.headers\.get\('x-webhook-secret'\);\r?\n\s*if \(secret !== Deno\.env\.get\('WEBHOOK_SECRET'\)\) \{\r?\n\s*console\.error\('\[AI\] Unauthorized webhook attempt'\);\r?\n\s*return new Response\('Unauthorized', \{ status: 401 \}\);\r?\n\s*\}/, 
`// const secret = req.headers.get('x-webhook-secret');
        // if (secret !== Deno.env.get('WEBHOOK_SECRET')) {
        //     console.error('[AI] Unauthorized webhook attempt');
        //     return new Response('Unauthorized', { status: 401 });
        // }`);

contentAi = contentAi.replace(/const gRes = await fetch\(\r?\n\s*`https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash:generateContent\?key=\$\{GEMINI_API_KEY\}`,\r?\n\s*\{\r?\n\s*method: 'POST',\r?\n\s*headers: \{ 'Content-Type': 'application\/json', 'Referer': 'https:\/\/www\.bdai\.travel\/' \},/,
`const accessToken = await getGcpAccessToken();
        const gRes = await fetch(
            \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent\`,
            {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Referer': 'https://www.bdai.travel/',
                    'Authorization': \`Bearer \${accessToken}\`
                },`);
                
fs.writeFileSync(pAi, contentAi, 'utf8');
console.log('AI worker updated.');

// GIS Worker 02
const pGis = path.resolve('services/supabase/edge-functions/tour-worker-gis-02.md');
let contentGis = fs.readFileSync(pGis, 'utf8');
contentGis = contentGis.replace(/const secret = req\.headers\.get\('x-webhook-secret'\);\r?\n\s*if \(secret !== Deno\.env\.get\('WEBHOOK_SECRET'\)\) \{\r?\n\s*console\.error\('\[GIS\] Unauthorized webhook attempt'\);\r?\n\s*return new Response\('Unauthorized', \{ status: 401 \}\);\r?\n\s*\}/,
`// const secret = req.headers.get('x-webhook-secret');
        // if (secret !== Deno.env.get('WEBHOOK_SECRET')) {
        //     console.error('[GIS] Unauthorized webhook attempt');
        //     return new Response('Unauthorized', { status: 401 });
        // }`);
fs.writeFileSync(pGis, contentGis, 'utf8');
console.log('GIS worker updated.');
