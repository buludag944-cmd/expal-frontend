import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiBaseUrl } from "../apiConfig";
import ResendVerification from "../components/ResendVerification";
import Badge from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";

const API = getApiBaseUrl();

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

function isResendEligibleError(message) {
  if (!message) return false;
  return (
    message.includes("Verification link expired") ||
    message.includes("Invalid or expired verification link")
  );
}

export default function VerifyEmail() {
  const { token: tokenParam } = useParams();
  const token = useMemo(() => normalizeTokenFromRoute(tokenParam), [tokenParam]);
  const [message, setMessage] = useState("Verifying your email…");
  const [ok, setOk] = useState(null);

  useEffect(() => {
    if (!token) {
      setOk(false);
      setMessage("Missing verification link.");
      return undefined;
    }

    let cancelled = false;
    fetch(`${API}/api/auth/verify/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) {
          setOk(true);
          setMessage(data.message || "Account activated!");
        } else {
          setOk(false);
          setMessage(data.error || `Verification failed (${res.status})`);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOk(false);
          setMessage("Could not reach the server.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const showResend = ok === false && (isResendEligibleError(message) || !token);

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-4 pt-8 text-center">
        <h2 className="page-title">Email verification</h2>
        <Badge
          variant={ok === true ? "success" : ok === false ? "danger" : "default"}
          className="text-sm"
        >
          {message}
        </Badge>
        {showResend && (
          <div className="text-left space-y-3 pt-2">
            {isResendEligibleError(message) && (
              <p className="text-sm text-muted text-center">
                This link is invalid or has expired. Request a new verification email below.
              </p>
            )}
            <ResendVerification defaultOpen />
          </div>
        )}
        {ok === true && (
          <p className="pt-2">
            <Link
              to="/"
              className="font-medium text-primary underline-offset-2 hover:underline min-h-[44px] inline-flex items-center"
            >
              Go to login
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
