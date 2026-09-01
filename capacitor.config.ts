import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Hosted SPA URL — only for dev/testing (e.g. CAPACITOR_SERVER_URL=http://192.168.x.x:3000).
 * Play Store builds must NOT set this — the web app is bundled inside the AAB.
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.yourbrand.expal",
  appName: "Expal",
  webDir: "build",
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#F25C54",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#F25C54",
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "banner", "list"],
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "automatic",
  },
};

if (serverUrl) {
  config.server = {
    url: serverUrl,
    cleartext: false,
    androidScheme: "https",
  };
}

export default config;
