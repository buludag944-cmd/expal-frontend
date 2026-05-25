/**
 * CRA inlines REACT_APP_* at build time — restart `npm start` after changing .env.
 * Prefix http:// when the value is host:port only, otherwise fetch() treats it as a path on :3000.
 */
export function getApiBaseUrl() {
  let u = (process.env.REACT_APP_API_URL || "").toString().trim().replace(/\/$/, "");
  if (u && !/^https?:\/\//i.test(u)) {
    u = `http://${u}`;
  }
  if (!u) {
    u = "http://localhost:3001";
  }
  // Bare localhost (no port) hits :80 and breaks /health JSON checks
  if (/^https?:\/\/(localhost|127\.0\.0\.1)$/i.test(u)) {
    u = `${u}:3001`;
  }
  return u.replace(/\/$/, "");
}
