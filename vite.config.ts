
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Esto permite que process.env.API_KEY sea accesible en el navegador tras la compilación en Vercel
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})
