import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png'],
        manifest: {
          name: 'bdai | better destinations',
          short_name: 'bdai',
          description: 'Tu pasaporte global y guía turística inteligente.',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          icons: [
            {
              src: 'logo.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    define: {
      '__GEMINI_API_KEY__': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ""),
      '__SUPABASE_URL__': JSON.stringify(process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || ""),
      '__SUPABASE_ANON_KEY__': JSON.stringify(process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ""),
      'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ""),
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ""),
      'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || ""),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "")
    }
  }
})
