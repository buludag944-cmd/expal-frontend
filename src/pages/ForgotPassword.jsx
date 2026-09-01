import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getApiBaseUrl } from "../apiConfig";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";

const API = getApiBaseUrl();

const SUCCESS_MESSAGE = "If this email exists, a reset link has been sent.";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      await res.json().catch(() => ({}));
      // Always show the same message — backend does not leak account existence.
      setDone(true);
      setNotice(SUCCESS_MESSAGE);
    } catch {
      setNotice("Could not reach the server. Check that the backend is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-4 p-6 md:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted text-center">
          Enter your email and we will send a secure reset link if an account exists.
        </p>
        <p className="text-xs text-muted text-center">
          Signed up with Google? Use <strong>Continue with Google</strong> on the login page — no
          password reset needed.
        </p>

        {done ? (
          <div className="space-y-3">
            <Badge variant="success" className="block w-full justify-center py-2">
              {notice}
            </Badge>
            <p className="text-xs text-muted text-center">
              Check your Inbox and Spam folders. The link is valid for 60 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {notice && !done && <Badge variant="danger">{notice}</Badge>}
            <Button type="submit" className="w-full" loading={busy} disabled={busy}>
              Send reset link
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted pt-2">
          <Link
            to="/"
            className="font-medium text-primary underline-offset-2 hover:underline min-h-[44px] inline-flex items-center"
          >
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
