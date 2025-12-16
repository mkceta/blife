import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blife.app',
  appName: 'BLife',
  webDir: 'out',
  server: {
    url: 'https://b-life.app',
    cleartext: true
  },
  android: {
    // Optimizaciones de WebView para mejor rendimiento
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Desactivar en producción
    backgroundColor: '#000000',
    // Habilitar aceleración de hardware
    loggingBehavior: 'none',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500, // Reducido para carga más rápida
      launchAutoHide: false, // Control manual para mejor UX
      backgroundColor: "#000000",
      showSpinner: false,
      androidScaleType: "FIT_CENTER",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: "native",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
