"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n";
import { AdminPageShell, useAdminSite } from "@/components/admin/admin-shell";

type IntegrationsResponse = {
  ok: boolean;
  zipUnlocked?: boolean;
  checkoutConfigured?: boolean;
  email?: string;
  error?: string;
};

export default function AdminHomePage() {
  const { copy, locale } = useAdminI18n();
  const { data, loading, error } = useAdminSite();
  const [zipUnlocked, setZipUnlocked] = useState(false);
  const [checkoutConfigured, setCheckoutConfigured] = useState(true);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [buyState, setBuyState] = useState<"ready" | "loading" | "error">("ready");
  const [buyError, setBuyError] = useState("");

  const loadIntegrations = useCallback(async () => {
    try {
      const response = await fetch("/api/owner/integrations", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const json = (await response.json()) as IntegrationsResponse;
      if (!response.ok || !json.ok) return;
      setZipUnlocked(Boolean(json.zipUnlocked));
      setCheckoutConfigured(Boolean(json.checkoutConfigured));
      setOwnerEmail(json.email || "");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  async function startBuyZip() {
    if (!data?.clientId) return;
    setBuyState("loading");
    setBuyError("");
    try {
      const response = await fetch("/api/polar/deployable-zip-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: data.clientId,
          email: ownerEmail || undefined,
          locale,
        }),
      });
      const json = (await response.json()) as { checkout_url?: string; error?: string };
      if (response.ok && json.checkout_url) {
        window.location.href = json.checkout_url;
        return;
      }
      setBuyError(
        checkoutConfigured
          ? json.error || copy.integrations.buyZipError
          : copy.integrations.buyZipCheckoutMissing,
      );
      setBuyState("error");
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : copy.integrations.buyZipError);
      setBuyState("error");
    }
  }

  const buyBusy = buyState === "loading";

  return (
    <AdminPageShell
      title={copy.overview.title}
      description={copy.overview.description}
      businessName={data?.content.businessName}
    >
      {loading ? <p className="admin-muted">{copy.loading}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {data ? (
        <>
          {!zipUnlocked ? (
            <div className="admin-card" style={{ marginBottom: "1rem" }}>
              <p className="admin-muted" style={{ margin: "0 0 0.75rem" }}>
                {copy.integrations.zipLockedHint}
              </p>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={buyBusy}
                onClick={() => void startBuyZip()}
              >
                {buyBusy ? copy.integrations.buyZipLoading : copy.integrations.buyZip}
              </button>
              {buyError ? <p className="admin-error" style={{ marginTop: "0.75rem" }}>{buyError}</p> : null}
            </div>
          ) : (
            <p style={{ marginBottom: "1rem" }}>
              <Link className="admin-link" href="/admin/integrations">
                {copy.overview.openIntegrations}
              </Link>
            </p>
          )}
          <div className="admin-grid-2">
            <div className="admin-card">
              <h2 className="admin-card-title">{data.content.businessName || "Website"}</h2>
              <div className="admin-stack" style={{ fontSize: "0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="admin-muted">{copy.overview.status}</span>
                  <span className={data.paid ? "admin-badge" : "admin-badge admin-badge-muted"}>
                    {data.paid ? copy.overview.paid : copy.overview.demo}
                  </span>
                </div>
                {data.publicSiteUrl ? (
                  <p style={{ margin: 0 }}>
                    {copy.overview.publicSite}{" "}
                    <Link className="admin-link" href={data.publicSiteUrl} target="_blank">
                      {data.publicSiteUrl}
                    </Link>
                  </p>
                ) : (
                  <p className="admin-muted" style={{ margin: 0 }}>
                    {copy.overview.publicSiteMissing}
                  </p>
                )}
                {data.crmUrl ? (
                  <p style={{ margin: 0 }}>
                    {copy.overview.crm}{" "}
                    <Link className="admin-link" href={data.crmUrl} target="_blank">
                      {data.crmUrl}
                    </Link>
                  </p>
                ) : null}
              </div>
            </div>
            <div className="admin-card">
              <h2 className="admin-card-title">{copy.overview.sections}</h2>
              <div className="admin-stack" style={{ fontSize: "0.9rem" }}>
                <Link className="admin-link" href="/admin/content">
                  {copy.nav.content}
                </Link>
                <Link className="admin-link" href="/admin/media">
                  {copy.nav.media}
                </Link>
                <Link className="admin-link" href="/admin/services">
                  {copy.nav.services}
                </Link>
                <Link className="admin-link" href="/admin/jobs">
                  {copy.nav.jobs}
                </Link>
                <Link className="admin-link" href="/admin/contacts">
                  {copy.nav.contacts}
                </Link>
                <Link className="admin-link" href="/admin/integrations">
                  {copy.nav.integrations}
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </AdminPageShell>
  );
}
