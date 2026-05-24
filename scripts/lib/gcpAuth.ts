import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

// Parsea GCP_SERVICE_ACCOUNT desde process.env o desde .env.local directamente.
// dotenv trunca valores multilínea sin comillas — fallback a lectura directa del fichero.
function loadServiceAccount(): Record<string, string> {
  let saStr = process.env.GCP_SERVICE_ACCOUNT || '';
  if (!saStr || !saStr.includes('"type"')) {
    const envPath = join(process.cwd(), '.env.local');
    const raw = readFileSync(envPath, 'utf-8');
    const idx = raw.indexOf('GCP_SERVICE_ACCOUNT=');
    if (idx === -1) throw new Error('GCP_SERVICE_ACCOUNT no encontrado en .env.local');
    const jsonStart = raw.indexOf('{', idx);
    if (jsonStart === -1) throw new Error('JSON de GCP_SERVICE_ACCOUNT no encontrado');
    let depth = 0, i = jsonStart, inStr = false, esc = false;
    for (; i < raw.length; i++) {
      const c = raw[i];
      if (esc) { esc = false; continue; }
      if (c === '\\' && inStr) { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (!inStr) { if (c === '{') depth++; else if (c === '}' && --depth === 0) break; }
    }
    saStr = raw.slice(jsonStart, i + 1);
  }
  return JSON.parse(saStr);
}

let tokenCache: { token: string; exp: number } | null = null;

export async function getGCPAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.exp - 60000) return tokenCache.token;
  const sa = loadServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const b64 = (s: string) => Buffer.from(s).toString('base64url');
  const header  = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: sa.private_key_id }));
  const payload = b64(JSON.stringify({
    iss: sa.client_email, sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/generative-language',
    iat: now, exp: now + 3600,
  }));
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(sa.private_key.replace(/\\n/g, '\n'), 'base64url');
  const jwt = `${header}.${payload}.${sig}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GCP auth error: ${JSON.stringify(data)}`);
  tokenCache = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export function geminiHeaders(accessToken: string): Record<string, string> {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` };
}

export const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
