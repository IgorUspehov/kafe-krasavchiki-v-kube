"use client";

import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AdminI18nProvider, useAdminI18n } from "@/components/admin/admin-i18n";
import { AdminLangSwitcher } from "@/components/admin/admin-lang-switcher";

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

  const errorText =
    errorCode === "expired"
      ? copy.login.expired
      : errorCode === "used"
        ? copy.login.used
        : errorCode === "invalid"
          ? copy.login.invalid
          : "";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setApiError("");
    setLoginUrl("");
    setEmailSent(false);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, clientId: clientId || undefined }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        loginUrl?: string;
        emailSent?: boolean;
      };

      const link = typeof data.loginUrl === "string" ? data.loginUrl.trim() : "";
      // Prefer on-screen magic link over hard failure (Resend missing on Vercel / ZIP).
      if (link) {
        setLoginUrl(link);
        setEmailSent(Boolean(data.emailSent));
        setStatus("sent");
        return;
      }

      if (!response.ok || !data.ok) {
        setStatus("error");
        setApiError(data.error || "");
        return;
      }
      setEmailSent(Boolean(data.emailSent));
      setStatus("sent");
    } catch {
      setStatus("error");
      setApiError("");
    }
  }

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
          {status === "error" ? (
            <p className="admin-error">{apiError || copy.login.sendFailed}</p>
          ) : null}
          {status === "sent" && !loginUrl ? (
            <p className="admin-muted">{copy.login.sent}</p>
          ) : null}
          {loginUrl ? (
            <div className="admin-stack" style={{ gap: "0.65rem" }}>
              <p className="admin-muted">
                {emailSent ? copy.login.sentWithLink : copy.login.linkReady}
              </p>
              <a
                className="admin-btn-primary"
                href={loginUrl}
                style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}
              >
                {copy.login.openLink}
              </a>
              <input
                className="admin-input"
                type="text"
                readOnly
                value={loginUrl}
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
