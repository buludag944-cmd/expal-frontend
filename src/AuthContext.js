import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getApiBaseUrl } from "./apiConfig";
import { setupPushNotifications } from "./lib/pushNotifications";

const AuthContext = createContext();
const API = getApiBaseUrl();

const NETWORK_ERROR =
  "Cannot reach API. Start the backend: cd backend && npm start (port 3001).";

const BACKEND_UNREACHABLE_LOCAL =
  "Backend not reachable — is the server running on port 3001? Check REACT_APP_API_URL in frontend/.env and restart `npm start`.";

const BACKEND_UNREACHABLE_REMOTE =
  "API not reachable. On Render free tier the server may be asleep — wait up to 60 seconds and try again. If it keeps failing, check https://expalapp-1.onrender.com/health in your browser.";

const HEALTH_TIMEOUT_MS = 3500;
const HEALTH_RETRIES = 2;
const HEALTH_RETRY_DELAY_MS = 300;
const REMOTE_HEALTH_TIMEOUT_MS = 25000;
const REMOTE_HEALTH_RETRIES = 5;
const REMOTE_HEALTH_RETRY_DELAY_MS = 800;

function isLocalApiBase(apiBase) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(apiBase.replace(/\/$/, ""));
}

async function checkApiHealth(apiBase) {
  const root = apiBase.replace(/\/$/, "");
  const url = `${root}/health`;
  const local = isLocalApiBase(root);
  const timeoutMs = local ? HEALTH_TIMEOUT_MS : REMOTE_HEALTH_TIMEOUT_MS;
  const retries = local ? HEALTH_RETRIES : REMOTE_HEALTH_RETRIES;
  const retryDelayMs = local ? HEALTH_RETRY_DELAY_MS : REMOTE_HEALTH_RETRY_DELAY_MS;
  let lastDetail = "";

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        lastDetail = `HTTP ${res.status}`;
      } else {
        const text = await res.text();
        if (text.includes('"ok":true') || text.trim() === "OK") {
          return { ok: true, detail: "" };
        }
        try {
          const data = JSON.parse(text);
          if (data && data.ok === true) {
            return { ok: true, detail: "" };
          }
        } catch {
          /* not JSON */
        }
        lastDetail = "Unexpected /health body (expected { ok: true })";
      }
    } catch (e) {
      lastDetail = e && e.name === "AbortError" ? "timeout" : e && e.message ? e.message : "network error";
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }

  return { ok: false, detail: lastDetail };
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return { error: res.ok ? null : `HTTP ${res.status}` };
  }
}

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    fetch(`${API}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => parseJsonSafe(res))
      .then((data) => {
        if (cancelled) return;
        if (data && data.error) {
          logout();
        } else if (data && data.id) {
          setUser(data);
        }
      })
      .catch(() => {
        if (!cancelled) console.warn("Profile verify skipped: API unreachable.");
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  useEffect(() => {
    if (token && user) {
      setupPushNotifications(token);
    }
  }, [token, user]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseJsonSafe(res);

      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        return { success: true };
      }
      return { success: false, error: data.error || `Login failed (${res.status})` };
    } catch {
      return { success: false, error: NETWORK_ERROR };
    }
  };

  const register = async (firstName, lastName, email, password) => {
    console.info("[signup] API base:", API, "(from REACT_APP_API_URL / default)");

    try {
      console.info("[signup] POST /api/register →", `${API}/api/register`);
      const controller = new AbortController();
      const registerTimeoutMs = isLocalApiBase(API) ? 15000 : 90000;
      const timer = setTimeout(() => controller.abort(), registerTimeoutMs);
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await parseJsonSafe(res);

      if (res.status === 503) {
        return {
          success: false,
          error:
            data.error ||
            "Server could not send verification email. Add SMTP settings on Render, or try again later.",
        };
      }
      if (res.ok && data.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          message: data.message || "Check your email to verify your account.",
        };
      }
      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        return { success: true };
      }
      if (data.id) {
        return { success: true };
      }
      return {
        success: false,
        error: data.error || `Registration failed (${res.status})`,
      };
    } catch (e) {
      if (e && e.name === "AbortError") {
        const hint = isLocalApiBase(API) ? BACKEND_UNREACHABLE_LOCAL : BACKEND_UNREACHABLE_REMOTE;
        return { success: false, error: `${hint} (signup timed out — try again)` };
      }
      return { success: false, error: NETWORK_ERROR };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
