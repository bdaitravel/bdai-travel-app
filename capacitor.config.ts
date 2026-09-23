import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'travel.bdai.app',
  appName: 'bdai.travel',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Por defecto iOS sirve el contenido desde capacitor://localhost (esquema no estándar),
    // no https://localhost como Android — Cloudflare Turnstile (y otras APIs web que dependen
    // de un origen http(s) normal) fallan silenciosamente bajo ese esquema. Forzar https aquí
    // es la solución oficial de Capacitor para este tipo de incompatibilidad.
    iosScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#9333ea'
    },
    StatusBar: {
      style: 'dark',
      overlay: true,
      backgroundColor: '#020617'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark'
    }
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    preferredContentMode: 'mobile'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
