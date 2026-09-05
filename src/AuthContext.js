import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getApiBaseUrl, PRODUCTION_API_URL } from "./apiConfig";
import { syncPushTokenIfGranted, unregisterPushDevice } from "./lib/pushNotifications";
import { isNativeApp } from "./lib/platform";

const AuthContext = createContext();
const API = getApiBaseUrl();
const TOKEN_KEY = "token";
const USER_KEY = "expal_user";
const PROFILE_TIMEOUT_MS = 12000;
const AUTH_BLOCK_MAX_MS = 6000;

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user) {
  if (user && user.id) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function isLocalApiBase(apiBase) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(apiBase.replace(/\/$/, ""));
}

const BACKEND_UNREACHABLE_LOCAL =
  "Backend not reachable — is the server running on port 3001? Check REACT_APP_API_URL in frontend/.env and restart `npm start`.";

const BACKEND_UNREACHABLE_REMOTE = (apiBase) =>
  `API not reachable. On Render free tier the server may be asleep — wait up to 60 seconds and try again. If it keeps failing, check ${apiBase.replace(/\/$/, "")}/health in your browser.`;

const BACKEND_UNREACHABLE_NATIVE =
  `Could not reach EXPal servers (${PRODUCTION_API_URL}). Check your internet connection, or wait a minute if the API is waking up, then try again.`;

const NETWORK_ERROR = isNativeApp()
  ? BACKEND_UNREACHABLE_NATIVE
  : isLocalApiBase(API)
    ? BACKEND_UNREACHABLE_LOCAL
    : BACKEND_UNREACHABLE_REMOTE(API);

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return { error: res.ok ? null : `HTTP ${res.status}` };
  }
}

async function fetchProfileFromApi(accessToken) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS);
  try {
    const res = await fetch(`${API}/api/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    const data = await parseJsonSafe(res);
    return { res, data };
  } catch (err) {
    if (err?.name === "AbortError") {
      return { res: { ok: false, status: 408 }, data: { error: "timeout" } };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [authNotice, setAuthNotice] = useState("");
  const [authReady, setAuthReady] = useState(true);
  const [authBlocking, setAuthBlocking] = useState(false);
  const freshSessionRef = useRef(false);

  const clearSession = useCallback((notice = "") => {
    setToken(null);
    setUser(null);
    setAuthNotice(notice);
    setAuthReady(true);
    setAuthBlocking(false);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const logout = useCallback(() => {
    const prevToken = localStorage.getItem(TOKEN_KEY);
    // Best-effort: drop FCM registration so the next account doesn't get this device's pushes
    unregisterPushDevice(prevToken).catch(() => {});
    clearSession("");
  }, [clearSession]);

  const applySession = useCallback(async (accessToken, loginUser) => {
    if (!accessToken || !loginUser?.id) {
      return null;
    }

    freshSessionRef.current = true;
    localStorage.setItem(TOKEN_KEY, accessToken);
    writeStoredUser(loginUser);
    setUser(loginUser);
    setAuthNotice("");
    setAuthReady(true);
    setAuthBlocking(false);
    setToken(accessToken);

    try {
      const { res, data } = await fetchProfileFromApi(accessToken);
      if (res.ok && data?.id) {
        setUser(data);
        writeStoredUser(data);
      }
    } catch {
      /* keep loginUser from auth response */
    } finally {
      freshSessionRef.current = false;
    }

    return loginUser;
  }, []);

  useEffect(() => {
    if (!token) {
      setAuthReady(true);
      setAuthBlocking(false);
      return;
    }

    if (freshSessionRef.current) {
      return;
    }

    let cancelled = false;
    const cachedUser = readStoredUser();
    const shouldBlock = !cachedUser?.id;

    if (shouldBlock) {
      setAuthBlocking(true);
      setAuthReady(false);
    } else {
      setAuthReady(true);
      setAuthBlocking(false);
    }

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setAuthReady(true);
        setAuthBlocking(false);
      }
    }, shouldBlock ? AUTH_BLOCK_MAX_MS : PROFILE_TIMEOUT_MS);

    fetchProfileFromApi(token)
      .then(({ res, data }) => {
        if (cancelled || freshSessionRef.current) return;
        if (res.ok && data?.id) {
          setUser(data);
          writeStoredUser(data);
          setAuthNotice("");
          return;
        }
        if (res.status === 401) {
          clearSession(
            "Your session expired. Sign in again with Google or email — your data is saved on the server if you use the same account."
          );
        }
      })
      .catch(() => {
        /* keep cached user — app stays usable */
      })
      .finally(() => {
        clearTimeout(timeout);
        if (!cancelled) {
          setAuthReady(true);
          setAuthBlocking(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [token, clearSession]);

  useEffect(() => {
    if (token && user) {
      syncPushTokenIfGranted(token);
    }
  }, [token, user]);

  const loginWithGoogle = async (idToken) => {
    const url = `${API}/api/auth/google`;
    const unreachable = isNativeApp()
      ? BACKEND_UNREACHABLE_NATIVE
      : isLocalApiBase(API)
        ? BACKEND_UNREACHABLE_LOCAL
        : BACKEND_UNREACHABLE_REMOTE(API);

    const postOnce = async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await parseJsonSafe(res);
      return { res, data };
    };

    try {
      // Warm Render free tier before / after a failed attempt
      if (!isLocalApiBase(API)) {
        await fetch(`${API}/health`).catch(() => {});
      }

      let { res, data } = await postOnce();

      // Retry once if server was cold-starting
      if (!res.ok && (res.status >= 500 || res.status === 502 || res.status === 503 || res.status === 504)) {
        await new Promise((r) => setTimeout(r, 2500));
        ({ res, data } = await postOnce());
      }

      if (data.token && data.user?.id) {
        await applySession(data.token, data.user);
        return { success: true };
      }
      if (data.token && !data.user?.id) {
        return {
          success: false,
          error: "Sign-in succeeded but profile was incomplete. Try again in a moment.",
        };
      }
      if (res.status === 404) {
        return {
          success: false,
          error:
            "Server update required: API missing POST /api/auth/google. Redeploy the backend on Render.",
        };
      }
      if (res.status === 503) {
        return {
          success: false,
          error:
            data.error ||
            "Google sign-in is not configured on the server. Add FIREBASE_SERVICE_ACCOUNT_JSON on Render and redeploy.",
        };
      }
      return {
        success: false,
        error: data.error || `Google sign-in failed (${res.status})`,
      };
    } catch {
      // One delayed retry for transient network / cold start
      try {
        await new Promise((r) => setTimeout(r, 2000));
        const { res, data } = await postOnce();
        if (data.token && data.user?.id) {
          await applySession(data.token, data.user);
          return { success: true };
        }
        return {
          success: false,
          error: data.error || `Google sign-in failed (${res.status})`,
        };
      } catch {
        return { success: false, error: unreachable };
      }
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseJsonSafe(res);

      if (data.token && data.user?.id) {
        await applySession(data.token, data.user);
        return { success: true };
      }
      return { success: false, error: data.error || `Login failed (${res.status})` };
    } catch {
      return { success: false, error: NETWORK_ERROR };
    }
  };

  const register = async (firstName, lastName, email, password) => {
    try {
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
      if (data.token && data.user?.id) {
        await applySession(data.token, data.user);
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

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const { res, data } = await fetchProfileFromApi(token);
    if (res.ok && data?.id) {
      setUser(data);
      writeStoredUser(data);
      return data;
    }
    return null;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authReady,
        authBlocking,
        login,
        loginWithGoogle,
        register,
        logout,
        authNotice,
        refreshUser,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
