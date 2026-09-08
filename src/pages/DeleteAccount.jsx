import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getApiBaseUrl } from "../apiConfig";
import { isNativeApp } from "../lib/platform";
import { MobileScreen } from "../components/mobile/MobileShared";
import Button from "../components/ui/Button";

const SUPPORT_EMAIL = "expalappsupport@gmail.com";
const API = getApiBaseUrl();

/**
 * Public account-deletion page for Google Play Console (and App Store) requirements.
 * URL: https://expalapp.netlify.app/delete-account
 */
function DeleteAccountContent({ native = false }) {
  const { user, token, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const deleteAccount = async () => {
    if (!token) return;
    const ok = window.confirm(
      "Delete your EXPal account permanently? This removes your profile, messages, posts, and documents. This cannot be undone."
    );
    if (!ok) return;
    const typed = window.prompt("Type DELETE to confirm account deletion:");
    if (typed !== "DELETE") {
      setMessage("Deletion cancelled.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete account");
      logout();
    } catch (err) {
      setMessage(err.message || "Could not delete account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!native && (
        <Link to="/" className="text-primary font-medium hover:underline">
          ← Back to Expal
        </Link>
      )}
      {!native && <h1 className="text-2xl font-bold mt-6 mb-2">Delete your EXPal account</h1>}
      {native && <h1 className="mob-legal-title">Delete your account</h1>}
      <p className={native ? "mob-legal-muted" : "text-muted mb-6"}>
        Google Play &amp; App Store account deletion information
      </p>

      <p className="mob-legal-p">
        You can permanently delete your EXPal account and associated personal data. Deletion is
        irreversible.
      </p>

      <h2 className="mob-legal-h2">Option 1 — In the app (fastest)</h2>
      <ol className="mob-legal-list" style={{ listStyle: "decimal", paddingLeft: "1.25rem" }}>
        <li>Open the EXPal app and sign in</li>
        <li>Go to <strong>Profile</strong></li>
        <li>Tap <strong>Delete account</strong></li>
        <li>Confirm, then type <strong>DELETE</strong> when asked</li>
      </ol>

      <h2 className="mob-legal-h2">Option 2 — On this website</h2>
      {user && token ? (
        <div className="space-y-3 my-4">
          <p className="mob-legal-p">
            Signed in as <strong>{user.email}</strong>. Use the button below to delete your account
            now.
          </p>
          <Button type="button" variant="danger" disabled={busy} onClick={deleteAccount}>
            {busy ? "Deleting…" : "Delete my account permanently"}
          </Button>
          {message && (
            <p className="text-sm" style={{ color: "#a32d2d" }}>
              {message}
            </p>
          )}
        </div>
      ) : (
        <p className="mob-legal-p">
          <Link to="/" className="mob-legal-link">
            Sign in to EXPal
          </Link>
          , then return to this page or open <strong>Profile → Delete account</strong>.
        </p>
      )}

      <h2 className="mob-legal-h2">Option 3 — Email request</h2>
      <p className="mob-legal-p">
        If you cannot access the app, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Delete%20EXPal%20account`} className="mob-legal-link">
          {SUPPORT_EMAIL}
        </a>{" "}
        from the address on your account. Include the subject line{" "}
        <strong>Delete EXPal account</strong>. We aim to complete email requests within{" "}
        <strong>30 days</strong>.
      </p>

      <h2 className="mob-legal-h2">What is deleted</h2>
      <ul className="mob-legal-list">
        <li>Your profile and account credentials</li>
        <li>Messages, posts, comments, listings, and documents linked to your account</li>
        <li>Device push tokens and in-app notifications</li>
      </ul>
      <p className="mob-legal-p">
        Some records may be retained temporarily in backups or where required by law, then removed
        in the normal backup cycle.
      </p>

      <h2 className="mob-legal-h2">Related</h2>
      <p className="mob-legal-p">
        See our{" "}
        <Link to="/privacy" className="mob-legal-link">
          Privacy Policy
        </Link>{" "}
        for how we handle data.
      </p>
    </>
  );
}

export default function DeleteAccount() {
  if (isNativeApp()) {
    return (
      <MobileScreen title="Delete account" showBack>
        <div className="mob-legal-content">
          <DeleteAccountContent native />
        </div>
      </MobileScreen>
    );
  }

  return (
    <div className="max-w-prose mx-auto px-4 py-8 space-y-4">
      <DeleteAccountContent />
    </div>
  );
}
