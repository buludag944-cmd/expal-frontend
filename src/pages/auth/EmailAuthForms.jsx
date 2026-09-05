import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";

const MIN_PASSWORD = 8;

/**
 * Email/password sign-in + create-account forms.
 * @param {"mobile"|"web"} variant — styling for gradient vs white card landing
 * @param {"signin"|"signup"} [initialMode]
 */
export default function EmailAuthForms({ variant = "mobile", initialMode = "signin" }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localNotice, setLocalNotice] = useState("");

  const isWeb = variant === "web";
  const inputClass = isWeb ? "auth-web-input" : "auth-landing-input";
  const submitClass = isWeb ? "auth-web-submit" : "auth-landing-btn-primary";
  const linkClass = isWeb ? "auth-web-link" : "auth-landing-text-link";
  const switchClass = isWeb ? "auth-web-switch" : "auth-landing-switch";

  function switchMode(next) {
    setMode(next);
    setLocalError("");
    setLocalNotice("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    setLocalNotice("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setLocalError("Email and password are required.");
      return;
    }
    if (mode === "signup") {
      if (!firstName.trim() || !lastName.trim()) {
        setLocalError("First name and last name are required.");
        return;
      }
      if (password.length < MIN_PASSWORD) {
        setLocalError(`Password must be at least ${MIN_PASSWORD} characters.`);
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const result = await login(trimmedEmail, password);
        if (!result.success) {
          setLocalError(result.error || "Login failed.");
        }
        return;
      }

      const result = await register(
        firstName.trim(),
        lastName.trim(),
        trimmedEmail,
        password
      );
      if (!result.success) {
        setLocalError(result.error || "Could not create account.");
        return;
      }
      if (result.requiresVerification) {
        setLocalNotice(
          result.message || "Check your email for a verification link, then sign in."
        );
        setMode("signin");
        setPassword("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-email-block">
      <div className={switchClass} role="tablist" aria-label="Email auth mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={mode === "signin" ? "is-active" : ""}
          onClick={() => switchMode("signin")}
          disabled={busy}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={mode === "signup" ? "is-active" : ""}
          onClick={() => switchMode("signup")}
          disabled={busy}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="auth-email-form" noValidate>
        {mode === "signup" && (
          <div className="auth-email-name-row">
            <input
              className={inputClass}
              type="text"
              name="firstName"
              placeholder="First name"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={busy}
            />
            <input
              className={inputClass}
              type="text"
              name="lastName"
              placeholder="Last name"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={busy}
            />
          </div>
        )}
        <input
          className={inputClass}
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
        <input
          className={inputClass}
          type="password"
          name="password"
          placeholder={mode === "signup" ? `Password (min ${MIN_PASSWORD})` : "Password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === "signup" ? MIN_PASSWORD : undefined}
          disabled={busy}
        />

        {localError && (
          <div className={isWeb ? "auth-landing-error !text-red-800 !bg-red-50" : "auth-landing-error"}>
            {localError}
          </div>
        )}
        {localNotice && (
          <div
            className={
              isWeb
                ? "auth-landing-notice !text-[#5c4033] !bg-amber-50"
                : "auth-landing-notice"
            }
          >
            {localNotice}
          </div>
        )}

        <button type="submit" className={submitClass} disabled={busy}>
          {busy
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account"
              : "Sign in with email"}
        </button>
      </form>

      {mode === "signin" && (
        <p className={isWeb ? "auth-web-forgot" : "auth-landing-forgot"}>
          <Link to="/forgot" className={linkClass}>
            Forgot password?
          </Link>
        </p>
      )}
    </div>
  );
}
