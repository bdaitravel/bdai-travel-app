import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
async function test() {
   const res = await ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: "Return a JSON array of objects with 'name', 'latitude', and 'longitude' for the following places in Logroño: ESDIR (Escuela Superior de Diseño de La Rioja), Palacio del Marqués de Monesterio, Muro del Revellín. Just the JSON."
   });
   console.log(res.text);
}
test();
