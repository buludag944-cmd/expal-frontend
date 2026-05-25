import React, { useEffect, useState } from "react";
import { getApiBaseUrl } from "../apiConfig";
import { resendVerification } from "../lib/resendVerification";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Input from "./ui/Input";

/**
 * Resend verification UI.
 * - inline: link under login 403; uses initialEmail, no extra form
 * - defaultOpen: small form on verify page (invalid/expired token)
 */
export default function ResendVerification({ initialEmail = "", defaultOpen = false, inline = false }) {
  const [showForm, setShowForm] = useState(defaultOpen && !inline);
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const runResend = async (address) => {
    setNotice("");
    setNoticeIsError(false);
    setBusy(true);
    try {
      const API = getApiBaseUrl();
      const msg = await resendVerification(API, address);
      setNoticeIsError(false);
      setNotice(
        `${msg} Check Inbox and Spam/Promotions.`
      );
    } catch (err) {
      setNoticeIsError(true);
      setNotice(err.message || "Could not resend verification email.");
    } finally {
      setBusy(false);
    }
  };

  const handleInlineClick = () => {
    runResend(initialEmail || email);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    runResend(email);
  };

  if (inline) {
    const disabled = busy || !(initialEmail || email).trim();
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleInlineClick}
          disabled={disabled}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {busy ? "Sending…" : "Resend verification email"}
        </button>
        {notice && (
          <Badge variant={noticeIsError ? "danger" : "success"} className="block w-fit">
            {notice}
          </Badge>
        )}
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => {
          setShowForm(true);
          setNotice("");
          setNoticeIsError(false);
        }}
        className="text-sm font-medium text-primary underline-offset-2 hover:underline min-h-[44px]"
      >
        Resend verification email
      </button>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="mt-4 space-y-3 text-left">
      <p className="text-sm text-muted">
        Enter your email to receive a new verification link (valid for 24 hours).
      </p>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" className="w-full" loading={busy} disabled={busy}>
        Resend
      </Button>
      {notice && (
        <Badge variant={noticeIsError ? "danger" : "success"} className="block w-fit">
          {notice}
        </Badge>
      )}
    </form>
  );
}
