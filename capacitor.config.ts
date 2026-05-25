import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Hosted SPA URL for native shells (instant web updates without store releases).
 * Override for local device testing: CAPACITOR_SERVER_URL=http://YOUR_LAN_IP:3000
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL || "https://expalapp.netlify.app";

const config: CapacitorConfig = {
  appId: "com.yourbrand.expal",
  appName: "EXPal",
  webDir: "build",
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f172a",
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "banner", "list"],
    },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
