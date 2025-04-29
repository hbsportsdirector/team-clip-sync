
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ed862eab27b74629aead64fffbae7ed6',
  appName: 'team-clip-sync',
  webDir: 'dist',
  server: {
    url: 'https://ed862eab-27b7-4629-aead-64fffbae7ed6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      splashImmersive: true,
      launchAutoHide: true
    }
  }
};

export default config;
