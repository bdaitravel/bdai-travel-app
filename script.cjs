const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/javier/Documents/antigravity/proyectos/bdai_daisy/bdai-travel-app/services/supabase/edge-functions';

let orch = fs.readFileSync(path.join(dir, 'tour-orchestrator.md'), 'utf-8');
orch = orch.replace(/PENDING_AI/g, 'PENDING_AI_02');
orch = orch.replace(/tour-orchestrator/g, 'tour-orchestrator-02');
fs.writeFileSync(path.join(dir, 'tour-orchestrator-02.md'), orch);

let gis = fs.readFileSync(path.join(dir, 'tour-worker-gis.md'), 'utf-8');
gis = gis.replace(/tour-worker-gis/g, 'tour-worker-gis-02');
fs.writeFileSync(path.join(dir, 'tour-worker-gis-02.md'), gis);

let ai = fs.readFileSync(path.join(dir, 'tour-worker-ai.md'), 'utf-8');
ai = ai.replace(/tour-worker-ai/g, 'tour-worker-ai-02');
ai = ai.replace(/PENDING_AI/g, 'PENDING_AI_02');

const importStr = 'import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";';
const newImport = importStr + '\nimport { importPKCS8, SignJWT } from "npm:jose@5.2.0";';
ai = ai.replace(importStr, newImport);

const authCode = `
// ── GCP Service Account Auth ──────────────────────────────────────────────
let gcpAccessToken = "";
let gcpTokenExpiration = 0;

async function getGcpAccessToken(): Promise<string> {
  if (gcpAccessToken && Date.now() < gcpTokenExpiration - 300000) {
    return gcpAccessToken;
  }
  const saJsonStr = Deno.env.get('GCP_SERVICE_ACCOUNT');
  if (!saJsonStr) throw new Error('Falta la variable GCP_SERVICE_ACCOUNT');
  const sa = JSON.parse(saJsonStr);
  const privateKey = await importPKCS8(sa.private_key, "RS256");
  const jwt = await new SignJWT({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/generative-language",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: sa.private_key_id })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: \`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=\${jwt}\`,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(\`Error auth GCP: \${JSON.stringify(data)}\`);
  gcpAccessToken = data.access_token;
  gcpTokenExpiration = Date.now() + (data.expires_in * 1000);
  return gcpAccessToken;
}

`;

ai = ai.replace('const GROUNDING_DAILY_LIMIT', authCode + 'const GROUNDING_DAILY_LIMIT');

const oldFetch = `const gRes = await fetch(
            \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${GEMINI_API_KEY}\`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Referer': 'https://app.bdai.travel/' },`;

const newFetch = `const accessToken = await getGcpAccessToken();
        const gRes = await fetch(
            \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent\`,
            {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': \`Bearer \${accessToken}\`,
                    'Referer': 'https://app.bdai.travel/' 
                },`;

ai = ai.replace(oldFetch, newFetch);

fs.writeFileSync(path.join(dir, 'tour-worker-ai-02.md'), ai);
console.log('Replication complete!');
