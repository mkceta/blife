import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blife.app',
  appName: 'BLife',
  webDir: 'out',
  server: {
    url: 'https://blife-udc.vercel.app',
    cleartext: true
  }
};

export default config;
