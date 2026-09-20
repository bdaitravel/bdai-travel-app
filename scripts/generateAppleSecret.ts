// Genera el "Secret Key" que pide Supabase en Authentication → Providers → Apple.
// Apple no expone un secreto fijo: hay que firmar un JWT nosotros mismos con la clave
// privada (.p8) del "Sign in with Apple Key" de Apple Developer, y ese JWT caduca a
// los 6 meses como máximo (es un límite de Apple, no se puede alargar) — por eso hay
// que repetir esto cada vez que llegue el aviso de caducidad en Supabase.
//
// Uso:
//   npx tsx scripts/generateAppleSecret.ts
//
// Variables de entorno necesarias (añadir a .env.local, no se suben al repo):
//   APPLE_TEAM_ID        → Apple Developer → Membership → Team ID (10 caracteres)
//   APPLE_KEY_ID         → Apple Developer → Certificates, Identifiers & Profiles → Keys
//                           → la key de "Sign in with Apple" que ya creasteis → Key ID
//   APPLE_CLIENT_ID      → el Services ID, tal cual aparece en Supabase como Client ID
//                           "web" → en este proyecto: travel.bdai.app.web
//   APPLE_PRIVATE_KEY_PATH → ruta local al fichero .p8 descargado de Apple Developer
//                           (Apple solo deja descargarlo UNA vez al crear la key — si se
//                           ha perdido, hay que revocar esa key y crear una nueva, lo que
//                           también obliga a actualizar APPLE_KEY_ID)

import 'dotenv/config';
import { readFileSync } from 'fs';
import { SignJWT, importPKCS8 } from 'jose';

const TEAM_ID = process.env.APPLE_TEAM_ID || '';
const KEY_ID = process.env.APPLE_KEY_ID || '';
const CLIENT_ID = process.env.APPLE_CLIENT_ID || '';
const PRIVATE_KEY_PATH = process.env.APPLE_PRIVATE_KEY_PATH || '';

const SIX_MONTHS_SECONDS = 15777000; // máximo que permite Apple para este JWT

async function main() {
    if (!TEAM_ID || !KEY_ID || !CLIENT_ID || !PRIVATE_KEY_PATH) {
        console.error('❌ Faltan variables de entorno. Revisa APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, APPLE_PRIVATE_KEY_PATH en .env.local');
        process.exit(1);
    }

    const pkcs8 = readFileSync(PRIVATE_KEY_PATH, 'utf8');
    const privateKey = await importPKCS8(pkcs8, 'ES256');

    const now = Math.floor(Date.now() / 1000);

    const jwt = await new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: KEY_ID })
        .setIssuer(TEAM_ID)
        .setIssuedAt(now)
        .setExpirationTime(now + SIX_MONTHS_SECONDS)
        .setAudience('https://appleid.apple.com')
        .setSubject(CLIENT_ID)
        .sign(privateKey);

    console.log('\n✅ Nuevo secreto generado (válido 6 meses desde hoy):\n');
    console.log(jwt);
    console.log('\nPégalo en Supabase → Authentication → Providers → Apple → "Secret Key (for OAuth)" → Save.\n');
}

main().catch(e => { console.error('❌ Error generando el secreto:', e); process.exit(1); });
