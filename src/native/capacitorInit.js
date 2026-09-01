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
    const isIOS = Capacitor.getPlatform() === "ios";
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Light });
    if (!isIOS) {
      await StatusBar.setBackgroundColor({ color: "#F25C54" });
    }
  } catch {
    /* iOS may ignore background / overlay APIs */
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

  window.setTimeout(() => {
    SplashScreen.hide().catch(() => {});
  }, 500);
}
