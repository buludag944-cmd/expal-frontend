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
    // Option A: WebView is edge-to-edge; CSS env(safe-area-inset-*) owns insets.
    // overlay:false would inset the WebView natively AND double with CSS padding.
    await StatusBar.setOverlaysWebView({ overlay: true });
    // Dark icons — most screens use light chrome; readable on home gradient too
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() !== "ios") {
      await StatusBar.setBackgroundColor({ color: "#F25C54" });
    }
  } catch {
    /* iOS may ignore background / overlay APIs on older plugin builds */
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
