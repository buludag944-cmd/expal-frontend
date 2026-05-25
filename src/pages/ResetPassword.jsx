import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiBaseUrl } from "../apiConfig";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input, { Label } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";

const API = getApiBaseUrl();
const MIN_LENGTH = 8;

function normalizeTokenFromRoute(raw) {
  if (raw == null || raw === "") return "";
  let s = String(raw).trim().replace(/\s+/g, "");
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep s */
  }
  return s;
}

export default function ResetPassword() {
  const { token: tokenParam } = useParams();
  const token = useMemo(() => normalizeTokenFromRoute(tokenParam), [tokenParam]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const clientError =
    password.length > 0 && password.length < MIN_LENGTH
      ? `Password must be at least ${MIN_LENGTH} characters.`
      : confirm.length > 0 && password !== confirm
        ? "Passwords do not match."
        : "";

  const expired = error.includes("expired");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing reset link.");
      return;
    }
    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
        return;
      }
      setError(data.error || `Request failed (${res.status})`);
    } catch {
      setError("Could not reach the server. Check that the backend is running.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="space-y-4 p-6 text-center">
          <Badge variant="danger">Invalid reset link.</Badge>
          <Link to="/forgot" className="text-sm font-medium text-primary hover:underline min-h-[44px] inline-flex items-center">
            Request a new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-4 p-6 md:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          Set a new password
        </h1>

        {success ? (
          <div className="space-y-3 text-center">
            <Badge variant="success" className="py-2">
              Password updated. You can now log in.
            </Badge>
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center font-medium text-primary underline-offset-2 hover:underline"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={MIN_LENGTH}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={MIN_LENGTH}
                autoComplete="new-password"
              />
            </div>
            {(clientError || error) && (
              <div className="space-y-2">
                <Badge variant="danger">{clientError || error}</Badge>
                {expired && (
                  <p className="text-sm text-center">
                    <Link to="/forgot" className="font-medium text-primary hover:underline">
                      Request a new reset link
                    </Link>
                  </p>
                )}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              loading={busy}
              disabled={busy || !!clientError || !password || !confirm}
            >
              Update password
            </Button>
          </form>
        )}

        {!success && (
          <p className="text-center text-sm text-muted">
            <Link to="/forgot" className="font-medium text-primary hover:underline min-h-[44px] inline-flex items-center justify-center">
              Forgot your password?
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
