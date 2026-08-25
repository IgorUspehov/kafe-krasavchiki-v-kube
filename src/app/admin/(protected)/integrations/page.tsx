"use client";

import { useCallback, useEffect, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n";
import { AdminPageShell, useAdminSite } from "@/components/admin/admin-shell";
import { OWNER_PLATFORM_LINKS } from "@/lib/owner/integrations";

type IntegrationsResponse = {
  ok: boolean;
  clientId?: string;
  distReady?: boolean;
  zipUnlocked?: boolean;
  email?: string;
  checkoutConfigured?: boolean;
  error?: string;
};

type ZipActionState = "ready" | "loading" | "error";

function staticPolarCheckoutUrl(clientId: string, email?: string): string {
  const base =
    process.env.NEXT_PUBLIC_POLAR_CHECKOUT_DEPLOYABLE_ZIP?.trim() ||
    process.env.POLAR_CHECKOUT_DEPLOYABLE_ZIP?.trim() ||
    "";
  if (!base) return "";
  try {
    const url = new URL(base);
    if (clientId) {
      url.searchParams.set("reference_id", clientId);
      url.searchParams.set("metadata[client_id]", clientId);
      url.searchParams.set("metadata[reference_id]", clientId);
      url.searchParams.set("metadata[product_kind]", "deployable_zip");
    }
    if (email?.trim()) {
      url.searchParams.set("customer_email", email.trim());
      url.searchParams.set("prefilled_email", email.trim());
    }
    return url.toString();
  } catch {
    return base;
  }
}

export default function AdminIntegrationsPage() {
  const { copy, locale } = useAdminI18n();
  const { data, loading, error } = useAdminSite();
  const [distReady, setDistReady] = useState<boolean | null>(null);
  const [zipUnlocked, setZipUnlocked] = useState(false);
  const [checkoutConfigured, setCheckoutConfigured] = useState(true);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [statusError, setStatusError] = useState("");
  const [zipState, setZipState] = useState<ZipActionState>("ready");
  const [zipError, setZipError] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/owner/integrations", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const json = (await response.json()) as IntegrationsResponse;
      if (!response.ok || !json.ok) {
        setStatusError(json.error || copy.loadFailed);
        return;
      }
      setStatusError("");
      setDistReady(Boolean(json.distReady));
      setZipUnlocked(Boolean(json.zipUnlocked));
      setCheckoutConfigured(Boolean(json.checkoutConfigured));
      setOwnerEmail(json.email || "");
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : copy.loadFailed);
    }
  }, [copy.loadFailed]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function openPolarCheckout() {
    const clientId = data?.clientId || "";
    setZipState("loading");
    setZipError("");
    try {
      const response = await fetch("/api/polar/deployable-zip-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || undefined,
          email: ownerEmail || undefined,
          locale,
        }),
      });
      const json = (await response.json()) as { checkout_url?: string; error?: string };
      if (response.ok && json.checkout_url) {
        window.open(json.checkout_url, "_blank", "noopener,noreferrer");
        setZipState("ready");
        return;
      }

      const fallback = staticPolarCheckoutUrl(clientId, ownerEmail);
      if (fallback) {
        window.open(fallback, "_blank", "noopener,noreferrer");
        setZipState("ready");
        return;
      }

      setZipError(
        checkoutConfigured
          ? json.error || copy.integrations.buyZipError
          : copy.integrations.buyZipCheckoutMissing,
      );
      setZipState("error");
    } catch (err) {
      const fallback = staticPolarCheckoutUrl(clientId, ownerEmail);
      if (fallback) {
        window.open(fallback, "_blank", "noopener,noreferrer");
        setZipState("ready");
        return;
      }
      setZipError(err instanceof Error ? err.message : copy.integrations.buyZipError);
      setZipState("error");
    }
  }

  async function downloadOwnerZip() {
    setZipState("loading");
    setZipError("");
    try {
      const response = await fetch("/api/owner/deployable-zip", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        let message = copy.integrations.downloadZipError;
        try {
          const json = (await response.json()) as { error?: string; code?: string };
          if (json.code === "DIST_MISSING") {
            message = copy.integrations.downloadZipDistMissing;
          } else if (json.code === "PAYMENT_REQUIRED") {
            message = copy.integrations.zipLockedHint;
            setZipUnlocked(false);
          } else if (json.error) {
            message = json.error;
          }
        } catch {
          /* non-JSON error body */
        }
        setZipError(message);
        setZipState("error");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/i);
      const filename = match?.[1] || "deployable-site.zip";

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setZipState("ready");
      await loadStatus();
    } catch (err) {
      setZipError(err instanceof Error ? err.message : copy.integrations.downloadZipError);
      setZipState("error");
    }
  }

  const zipBusy = zipState === "loading";
  const staticCheckoutHref = staticPolarCheckoutUrl(data?.clientId || "", ownerEmail);

  return (
    <AdminPageShell
      title={copy.integrations.title}
      description={copy.integrations.description}
      businessName={data?.content.businessName}
    >
      {loading ? <p className="admin-muted">{copy.loading}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {statusError ? <p className="admin-error">{statusError}</p> : null}

      <div className="admin-delivery-card">
        <div className="admin-delivery-card-head">
          <h2 className="admin-delivery-card-title">
            {zipUnlocked
              ? copy.integrations.readyTitle
              : copy.integrations.launchTitle}
          </h2>
        </div>

        <ul className="admin-delivery-list">
          {!zipUnlocked ? (
            <li>
              {staticCheckoutHref ? (
                <a
                  className="admin-delivery-row admin-delivery-row--primary"
                  href={staticCheckoutHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => {
                    // Prefer API checkout (correct success URL + metadata); fall back to href.
                    event.preventDefault();
                    void openPolarCheckout();
                  }}
                >
                  <span className="admin-delivery-icon" aria-hidden>
                    📦
                  </span>
                  <span className="admin-delivery-label">
                    {zipBusy ? copy.integrations.buyZipLoading : copy.integrations.buyZip}
                  </span>
                </a>
              ) : (
                <button
                  type="button"
                  className="admin-delivery-row admin-delivery-row--primary"
                  disabled={zipBusy}
                  onClick={() => void openPolarCheckout()}
                >
                  <span className="admin-delivery-icon" aria-hidden>
                    📦
                  </span>
                  <span className="admin-delivery-label">
                    {zipBusy ? copy.integrations.buyZipLoading : copy.integrations.buyZip}
                  </span>
                </button>
              )}
            </li>
          ) : (
            <li>
              <button
                type="button"
                className="admin-delivery-row admin-delivery-row--primary"
                disabled={zipBusy || distReady === false}
                onClick={() => void downloadOwnerZip()}
              >
                <span className="admin-delivery-icon" aria-hidden>
                  📦
                </span>
                <span className="admin-delivery-label">
                  {zipState === "loading"
                    ? copy.integrations.downloadZipLoading
                    : copy.integrations.downloadZip}
                </span>
              </button>
            </li>
          )}

          {OWNER_PLATFORM_LINKS.map((platform) => (
            <li key={platform.id}>
              <a
                className="admin-delivery-row"
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="admin-delivery-icon" aria-hidden>
                  {platform.icon}
                </span>
                <span className="admin-delivery-label">{platform.label}</span>
              </a>
            </li>
          ))}
        </ul>

        {!zipUnlocked ? (
          <p className="admin-muted admin-delivery-msg">{copy.integrations.zipLockedHint}</p>
        ) : null}
        {zipError ? <p className="admin-error admin-delivery-msg">{zipError}</p> : null}
        {zipUnlocked && distReady === false ? (
          <p className="admin-muted admin-delivery-msg">
            {copy.integrations.downloadZipDistMissing}
          </p>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
