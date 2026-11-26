import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.gebeta.delivery',
  appName: 'Gebeta',
  webDir: 'dist',
  android: {
    ...(process.env.CAP_ANDROID_PATH ? { path: process.env.CAP_ANDROID_PATH } : {}),
    webContentsDebuggingEnabled: process.env.CAP_DEBUG === 'true',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#15140f',
      showSpinner: false,
    },
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'DARK',
    },
  },
}

export default config
