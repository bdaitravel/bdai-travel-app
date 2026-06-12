import os
import re

dir_path = r'c:\Users\javier\Documents\antigravity\proyectos\bdai_daisy\bdai-travel-app\services\supabase\edge-functions'

# 1. tour-orchestrator-02.md
with open(os.path.join(dir_path, 'tour-orchestrator.md'), 'r', encoding='utf-8') as f:
    orch = f.read()
orch = orch.replace('PENDING_AI', 'PENDING_AI_02')
orch = orch.replace('tour-orchestrator', 'tour-orchestrator-02')
with open(os.path.join(dir_path, 'tour-orchestrator-02.md'), 'w', encoding='utf-8') as f:
    f.write(orch)

# 2. tour-worker-gis-02.md
with open(os.path.join(dir_path, 'tour-worker-gis.md'), 'r', encoding='utf-8') as f:
    gis = f.read()
gis = gis.replace('tour-worker-gis', 'tour-worker-gis-02')
with open(os.path.join(dir_path, 'tour-worker-gis-02.md'), 'w', encoding='utf-8') as f:
    f.write(gis)

# 3. tour-worker-ai-02.md
with open(os.path.join(dir_path, 'tour-worker-ai.md'), 'r', encoding='utf-8') as f:
    ai = f.read()
ai = ai.replace('tour-worker-ai', 'tour-worker-ai-02')
ai = ai.replace('PENDING_AI', 'PENDING_AI_02')

import_str = 'import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";'
new_import = import_str + '\nimport { importPKCS8, SignJWT } from "npm:jose@5.2.0";'
ai = ai.replace(import_str, new_import)

auth_code = '''
// -- GCP Service Account Auth ----------------------------------------------
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
    body: grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(Error auth GCP: );
  gcpAccessToken = data.access_token;
  gcpTokenExpiration = Date.now() + (data.expires_in * 1000);
  return gcpAccessToken;
}

'''
ai = ai.replace('const GROUNDING_DAILY_LIMIT', auth_code + 'const GROUNDING_DAILY_LIMIT')

old_fetch = """const gRes = await fetch(
            https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Referer': 'https://app.bdai.travel/' },"""

new_fetch = """const accessToken = await getGcpAccessToken();
        const gRes = await fetch(
            https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent,
            {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': Bearer ,
                    'Referer': 'https://app.bdai.travel/' 
                },"""

ai = ai.replace(old_fetch, new_fetch)

with open(os.path.join(dir_path, 'tour-worker-ai-02.md'), 'w', encoding='utf-8') as f:
    f.write(ai)

print('Replication complete!')
