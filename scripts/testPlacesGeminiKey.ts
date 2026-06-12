// scripts/testPlacesGeminiKey.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const KEY = process.env.VITE_GEMINI_API_KEY_02 || '';

async function test() {
  console.log("Testing VITE_GEMINI_API_KEY_02 for Gemini with Referer. Key:", KEY);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Referer': 'https://app.bdai.travel/'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Respond in 3 words: Yes it works." }] }]
      })
    });
    
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json));
  } catch (err: any) {
    console.error("Error:", err);
  }
}

test();
