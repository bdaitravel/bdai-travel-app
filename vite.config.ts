
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargamos variables de .env, .env.local, etc.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Inyectamos las variables. Damos prioridad a las variables del sistema de despliegue.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ""),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL || ""),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ""),
      // Fix: 'window' is not defined in the Node.js environment during the build process.
      // Environment-specific logic should rely on VITE_APP_ENV or other environment variables.
      'process.env.APP_ENV': JSON.stringify(env.VITE_APP_ENV || 'PROD')
    },
    // Fix: 'historyApiFallback' is not a valid property of 'server' in Vite.
    // SPA history fallback is already handled by default in the Vite development server.
    server: {}
  }
})
