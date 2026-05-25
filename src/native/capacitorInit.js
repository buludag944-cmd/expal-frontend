import { Capacitor } from "@capacitor/core";

/**
 * Native-only UX (splash, status bar, back button). No API or auth changes.
 */
export async function initCapacitorNative() {
  if (!Capacitor.isNativePlatform()) return;

  const [{ App }, { SplashScreen }, { StatusBar, Style }] = await Promise.all([
    import("@capacitor/app"),
    import("@capacitor/splash-screen"),
    import("@capacitor/status-bar"),
  ]);

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0f172a" });
  } catch {
    /* iOS may ignore background color */
  }

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  try {
    await SplashScreen.hide();
  } catch {
    /* already hidden */
  }
}
