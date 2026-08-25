"use client";

import { FormEvent, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AdminI18nProvider, useAdminI18n } from "@/components/admin/admin-i18n";
import { AdminLangSwitcher } from "@/components/admin/admin-lang-switcher";

function buildBypassLoginUrl(clientId: string): string {
  const id = clientId.trim();
  if (!id || typeof window === "undefined") return "";
  return `${window.location.origin}/api/admin/bypass?clientId=${encodeURIComponent(id)}&token=bypass`;
}

function LoginForm() {
  const search = useSearchParams();
  const { copy } = useAdminI18n();
  const errorCode = search?.get("error");
  const clientId = search?.get("clientId")?.trim() || "";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [apiError, setApiError] = useState("");
  const [loginUrl, setLoginUrl] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showDirectLink, setShowDirectLink] = useState(false);

  const bypassUrl = useMemo(() => (clientId ? buildBypassLoginUrl(clientId) : ""), [clientId]);

  const errorText =
    errorCode === "expired"
      ? copy.login.expired
      : errorCode === "used"
        ? copy.login.used
        : errorCode === "invalid"
          ? copy.login.invalid
          : "";

  function revealDirectLink(preferredUrl?: string) {
    const url = (preferredUrl || "").trim() || bypassUrl;
    if (url) {
      setLoginUrl(url);
      setShowDirectLink(true);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setApiError("");
    setEmailSent(false);
    // Keep previous link visible until we have a better one.
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, clientId: clientId || undefined }),
      });

      let data: {
        ok?: boolean;
        error?: string;
        loginUrl?: string;
        emailSent?: boolean;
      } = {};
      try {
        data = (await response.json()) as typeof data;
      } catch {
        data = {};
      }

      const apiLink = typeof data.loginUrl === "string" ? data.loginUrl.trim() : "";

      // Always surface a clickable login link when we have clientId (ZIP / Vercel without Resend).
      if (apiLink || clientId) {
        setEmailSent(Boolean(data.emailSent) && Boolean(apiLink));
        revealDirectLink(apiLink || bypassUrl);
        setStatus("sent");
        return;
      }

      if (!response.ok || !data.ok) {
        setStatus("error");
        setApiError(data.error || "");
        revealDirectLink(bypassUrl);
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setApiError("");
      // Guaranteed fallback for network / API failures.
      revealDirectLink(bypassUrl);
    }
  }

  const displayUrl = loginUrl || (showDirectLink ? bypassUrl : "");

  return (
    <main className="admin-login-wrap">
      <div className="admin-login-lang">
        <AdminLangSwitcher />
      </div>
      <div className="admin-login-card">
        <h1 className="admin-page-title" style={{ fontSize: "1.5rem" }}>
          {copy.login.title}
        </h1>
        <p className="admin-page-desc">{copy.login.description}</p>
        <form className="admin-stack" style={{ marginTop: "1.25rem" }} onSubmit={(event) => void onSubmit(event)}>
          <div>
            <label className="admin-label" htmlFor="email">
              {copy.login.email}
            </label>
            <input
              id="email"
              className="admin-input"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
          {errorText ? <p className="admin-error">{errorText}</p> : null}
          {status === "error" && !displayUrl ? (
            <p className="admin-error">{apiError || copy.login.sendFailed}</p>
          ) : null}
          {status === "sent" && !displayUrl ? (
            <p className="admin-muted">{copy.login.sent}</p>
          ) : null}

          {displayUrl ? (
            <div className="admin-stack" style={{ gap: "0.65rem" }}>
              {status === "error" ? (
                <p className="admin-error" style={{ marginBottom: 0 }}>
                  {apiError || copy.login.sendFailed}
                </p>
              ) : null}
              <p className="admin-muted">
                {emailSent ? copy.login.sentWithLink : copy.login.linkReady}
              </p>
              <a
                className="admin-btn-primary"
                href={displayUrl}
                style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}
              >
                {copy.login.openLink}
              </a>
              <input
                className="admin-input"
                type="text"
                readOnly
                value={displayUrl}
                aria-label={copy.login.openLink}
                onFocus={(event) => event.currentTarget.select()}
                onClick={(event) => event.currentTarget.select()}
                style={{ fontSize: "0.75rem" }}
              />
            </div>
          ) : null}

          <button type="submit" className="admin-btn-primary" style={{ width: "100%" }} disabled={status === "sending"}>
            {status === "sending" ? copy.login.sending : copy.login.send}
          </button>
        </form>

        {/* Always offer direct entry when clientId is already in the URL (Deployable ZIP). */}
        {clientId && !displayUrl ? (
          <div className="admin-stack" style={{ marginTop: "1rem", gap: "0.65rem" }}>
            <button
              type="button"
              className="admin-btn-primary"
              style={{ width: "100%" }}
              onClick={() => revealDirectLink(bypassUrl)}
            >
              {copy.login.openLink}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <AdminI18nProvider>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AdminI18nProvider>
  );
}
