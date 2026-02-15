
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  // Use path.resolve('.') instead of process.cwd() to resolve the directory for loadEnv to satisfy TypeScript environment types
  const env = loadEnv(mode, path.resolve('.'), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ""),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL || ""),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ""),
      'process.env.APP_ENV': JSON.stringify(env.VITE_APP_ENV || 'PROD')
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'leaflet'],
            ai: ['@google/genai']
          }
        }
      }
    },
    server: {
      port: 3000
    }
  }
})
