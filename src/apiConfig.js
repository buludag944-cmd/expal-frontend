/**
 * CRA inlines REACT_APP_* at build time — restart `npm start` after changing .env.
 * Prefix http:// when the value is host:port only, otherwise fetch() treats it as a path on :3000.
 *
 * Native (Capacitor) builds must never talk to localhost — the phone cannot reach the
 * developer's machine. Fall back to production API if env was missing at build time.
 */
import { isNativeApp } from "./lib/platform";

export const PRODUCTION_API_URL = "https://expalapp-1.onrender.com";

function isLocalhostUrl(u) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(u || "").replace(/\/$/, ""));
}

export function getApiBaseUrl() {
  let u = (process.env.REACT_APP_API_URL || "").toString().trim().replace(/\/$/, "");
  if (u && !/^https?:\/\//i.test(u)) {
    u = `http://${u}`;
  }
  // Bare localhost (no port) hits :80 and breaks /health JSON checks
  if (/^https?:\/\/(localhost|127\.0\.0\.1)$/i.test(u)) {
    u = `${u}:3001`;
  }

  if (isNativeApp()) {
    if (!u || isLocalhostUrl(u)) {
      return PRODUCTION_API_URL;
    }
    return u.replace(/\/$/, "");
  }

  if (!u) {
    u = "http://localhost:3001";
  }
  return u.replace(/\/$/, "");
}
