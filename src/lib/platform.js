/** Capacitor Android/iOS — not mobile browser. */
export function isNativeApp() {
  try {
    const { Capacitor } = require("@capacitor/core");
    const platform = Capacitor.getPlatform();
    return platform === "android" || platform === "ios";
  } catch {
    return false;
  }
}

export function getNativePlatform() {
  try {
    const { Capacitor } = require("@capacitor/core");
    return Capacitor.getPlatform();
  } catch {
    return "web";
  }
}

export function isIOSNative() {
  return getNativePlatform() === "ios";
}

export function isAndroidNative() {
  return getNativePlatform() === "android";
}
