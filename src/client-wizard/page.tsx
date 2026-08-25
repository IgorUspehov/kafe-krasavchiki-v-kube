"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { markLandingReturnReload } from "@/lib/landing-navigation";
import { isWizardSectorId } from "@/lib/niche-sectors";

import {
  buildQuestionnairePayload,
  fetchPreviewLatest,
  saveQuestionnaire,
  SECTOR_TO_BUSINESS_TYPE,
} from "@/client-wizard/api";
import { getCopy, type UiLang } from "@/client-wizard/copy";
import { getPayTranslations } from "@/client-wizard/pay-translations";
import { getTierTranslations } from "@/client-wizard/tier-translations";
import { buildFactoryBridgeApiPath, buildTariffsPagePath } from "@/lib/tariffs/urls";
import { DEFAULT_BUSINESS_TYPE } from "@/lib/sector-mapping";
import { useTranslation } from "@/lib/i18n/context";
import { executeRecaptcha } from "@/lib/recaptcha/client";
import type { ResultApiResponse, StepId } from "@/client-wizard/types";

import "@/client-wizard/styles.css";

const LEMONSQUEEZY_STORE_HOST = "https://mvpfactory.lemonsqueezy.com";
const LEMONSQUEEZY_VARIANT_MVP_DEMO = "1801729";
const LEMONSQUEEZY_VARIANT_MVP_PRO = "1807661";
const LEMONSQUEEZY_VARIANT_CRM_FULL = "1807671";

const SUPPORT_EMAIL = "support@mvpfactory.de";
const PAYMENT_POLL_INTERVAL_MS = 3000;
const PAYMENT_POLL_MAX_ATTEMPTS = 20;
/** Wait for CF edge 200 + embed CSP (522/XFO window can last ~1–2 min). */
const LIVE_PREVIEW_PROBE_INTERVAL_MS = 2_000;
const LIVE_PREVIEW_PROBE_MAX_ATTEMPTS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BUILD_COUNTDOWN_SEC = 60;

function formatBuildCountdown(secondsLeft: number): string {
  const clamped = Math.max(0, Math.min(BUILD_COUNTDOWN_SEC, secondsLeft));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Live Preview iframe may only load Railway readable demo URLs
 * (`/demo/{slug}?clientId=…`). Never mount ephemeral `{hash}.*.pages.dev` —
 * those deployments are pruned and show "refused to connect" in the iframe.
 */
function isReadableDemoPreviewUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return parsed.pathname.startsWith("/demo/");
  } catch {
    return false;
  }
}

function isEphemeralPagesPreviewUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    // Wizard must not iframe pages.dev / netlify — only Railway `/demo/{slug}`.
    return host.endsWith(".pages.dev") || host.endsWith(".netlify.app");
  } catch {
    return false;
  }
}

function PaymentReturnScreen({
  mode,
  clientId,
  checkoutId,
}: {
  mode: "processing" | "error";
  clientId: string;
  checkoutId: string;
}) {
  const { locale, setLocale } = useTranslation();
  const lang = locale as UiLang;
  const [timedOut, setTimedOut] = useState(false);
  const copy = getCopy(lang);

  const pollSiteReady = useCallback(async (): Promise<boolean> => {
    const params = new URLSearchParams();
    if (clientId) params.set("clientId", clientId);
    if (checkoutId) params.set("checkout_id", checkoutId);

    if (params.size > 0) {
      try {
        const response = await fetch(`/api/crm-demo/claim-payment?${params.toString()}`);
        if (response.ok) {
          const data = (await response.json()) as { ready?: boolean; siteUrl?: string };
          if (data.ready && data.siteUrl) {
            window.location.href = data.siteUrl;
            return true;
          }
        }
      } catch {
        /* retry on next interval */
      }

      try {
        const statusParams = new URLSearchParams();
        if (clientId) statusParams.set("clientId", clientId);
        if (checkoutId) statusParams.set("checkout_id", checkoutId);
        const response = await fetch(`/api/client-site-status?${statusParams.toString()}`);
        if (response.ok) {
          const data = (await response.json()) as { ready?: boolean; siteUrl?: string };
          if (data.ready && data.siteUrl) {
            window.location.href = data.siteUrl;
            return true;
          }
        }
      } catch {
        /* retry on next interval */
      }
    }

    if (checkoutId) {
      try {
        const lookupParams = new URLSearchParams({ checkout_id: checkoutId });
        const response = await fetch(`/api/checkout-lookup?${lookupParams.toString()}`, {
          redirect: "manual",
        });
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("Location");
          if (location && !location.includes("payment=processing") && !location.includes("payment=error")) {
            window.location.href = location;
            return true;
          }
        }
      } catch {
        /* retry on next interval */
      }
    }

    return false;
  }, [checkoutId, clientId]);

  useEffect(() => {
    if (mode !== "processing" || timedOut) {
      return;
    }

    let attempts = 0;
    let cancelled = false;

    const runPoll = async () => {
      if (cancelled || timedOut) {
        return;
      }

      const redirected = await pollSiteReady();
      if (redirected || cancelled) {
        return;
      }

      attempts += 1;
      if (attempts >= PAYMENT_POLL_MAX_ATTEMPTS) {
        setTimedOut(true);
      }
    };

    void runPoll();
    const timer = window.setInterval(() => {
      void runPoll();
    }, PAYMENT_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [mode, pollSiteReady, timedOut]);

  const title =
    mode === "error"
      ? copy.s_payment_error_title
      : timedOut
        ? copy.s_processing_timeout_title
        : copy.s_processing_title;

  const subtitle =
    mode === "error"
      ? copy.s_payment_error_sub
      : timedOut
        ? copy.s_processing_timeout_sub
        : copy.s_processing_sub;

  return (
    <div className="mf-root">
      <div className="shell">
        <div className="glow" />

        <div className="ui-lang">
          {(["en", "de", "ru"] as UiLang[]).map((code) => (
            <button
              key={code}
              type="button"
              className={`ui-lang-btn ${lang === code ? "active" : ""}`}
              onClick={() => setLocale(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="step active">
            <div className="step-h" style={{ marginBottom: 12 }}>
              {title}
            </div>
            <p className="step-sub" style={{ marginBottom: 24 }}>
              {subtitle}
            </p>

            {mode === "processing" && !timedOut ? (
              <p className="step-sub" style={{ fontWeight: 600 }}>
                …
              </p>
            ) : null}

            {mode === "error" || timedOut ? (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="btn-primary"
                style={{ display: "inline-flex", justifyContent: "center", marginTop: 8 }}
              >
                {copy.s_processing_contact}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: "s1" | "s2" }) {
  const dots = step === "s1" ? ["active", ""] : ["done", "active"];

  return (
    <div className="progress">
      {dots.map((state, index) => (
        <div key={index} className={`progress-dot ${state}`.trim()} />
      ))}
    </div>
  );
}

function WizardStepNav({
  children,
  layout = "split",
}: {
  children: ReactNode;
  layout?: "split" | "triple" | "single";
}) {
  const layoutClass =
    layout === "triple"
      ? "wizard-step-nav wizard-step-nav--triple"
      : layout === "single"
        ? "wizard-step-nav wizard-step-nav--single"
        : "wizard-step-nav";

  return <div className={layoutClass}>{children}</div>;
}

function buildPreviewBodyHtml(
  name: string,
  sector: { icon: string; label: string },
  langAttr: string,
): string {
  return `<span class="preview-line-h">&lt;!-- ${name} --&gt;</span>
<span class="preview-line-g">&lt;html lang="${langAttr}"&gt;</span>
<span class="preview-line-y">  &lt;head&gt;</span>
    &lt;title&gt;${name}&lt;/title&gt;
    &lt;link rel="manifest" href="/manifest.json"&gt;
<span class="preview-line-y">  &lt;/head&gt;</span>
<span class="preview-line-y">  &lt;body&gt;</span>
<span class="preview-line-h">    &lt;!-- ${sector.icon} ${sector.label} Platform --&gt;</span>
    &lt;nav&gt;${name}&lt;/nav&gt;
    &lt;main&gt;...&lt;/main&gt;
    &lt;script src="/app.js"&gt;&lt;/script&gt;
<span class="preview-line-y">  &lt;/body&gt;</span>
<span class="preview-line-g">&lt;/html&gt;</span>`;
}

function resolveDeliveryOption(
  result: ResultApiResponse | null,
  key: string,
): { available: boolean; href?: string } {
  if (!result?.delivery_options) {
    return { available: false, href: undefined };
  }
  const option = result.delivery_options.find((item) => item.key === key);
  if (!option?.available || !option.href) {
    return { available: false, href: undefined };
  }
  return { available: true, href: option.href };
}

function DeliveryLink({
  result,
  optionKey,
  id,
  children,
}: {
  result: ResultApiResponse | null;
  optionKey: string;
  id?: string;
  children: ReactNode;
}) {
  if (!result?.delivery_options) {
    return (
      <div className="dl-btn disabled" id={id}>
        {children}
      </div>
    );
  }

  const { available, href } = resolveDeliveryOption(result, optionKey);

  if (!available || !href) {
    return (
      <div className="dl-btn disabled" id={id}>
        {children}
      </div>
    );
  }

  const external = href.startsWith("http");

  return (
    <a
      href={href}
      id={id}
      className="dl-btn"
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      download={optionKey === "zip" ? "final_package.zip" : undefined}
    >
      {children}
    </a>
  );
}

function buildPayHref(input: {
  demoUrl: string;
  siteId?: string;
  clientId?: string;
  email: string;
  name: string;
  variantId?: string;
}) {
  const variantId = input.variantId ?? LEMONSQUEEZY_VARIANT_MVP_DEMO;

  if (variantId === LEMONSQUEEZY_VARIANT_MVP_DEMO) {
    const params = new URLSearchParams();
    params.set("demo_url", input.demoUrl);
    if (input.siteId) {
      params.set("site_id", input.siteId);
    }
    if (input.clientId) {
      params.set("client_id", input.clientId);
      params.set("clientId", input.clientId);
    }
    params.set("email", input.email);
    params.set("name", input.name);
    params.set("ownerName", input.name);
    return buildTariffsPagePath({
      clientId: input.clientId,
      email: input.email,
      ownerName: input.name,
      demoUrl: input.demoUrl,
    });
  }

  if (variantId === LEMONSQUEEZY_VARIANT_MVP_PRO) {
    return buildFactoryBridgeApiPath({
      clientId: input.clientId,
      tier: "factory_ready",
    });
  }

  if (variantId === LEMONSQUEEZY_VARIANT_CRM_FULL) {
    return buildFactoryBridgeApiPath({
      clientId: input.clientId,
      tier: "factory_custom",
    });
  }

  const params = new URLSearchParams();
  params.set("checkout[email]", input.email);
  params.set("checkout[name]", input.name);
  params.set("checkout[custom][demo_url]", input.demoUrl);
  if (input.siteId) {
    params.set("checkout[custom][site_id]", input.siteId);
  }
  if (input.clientId) {
    params.set("checkout[custom][client_id]", input.clientId);
  }
  if (input.clientId && typeof window !== "undefined") {
    params.set(
      "checkout[product_options][redirect_url]",
      `${window.location.origin}/success?clientId=${encodeURIComponent(input.clientId)}&tier=mvp_pro&email=${encodeURIComponent(input.email)}`,
    );
  }
  return `${LEMONSQUEEZY_STORE_HOST}/buy/${variantId}?${params.toString()}`;
}

function resolveDemoUrl(
  deployMeta: { demoUrl: string } | null,
  pendingRedirectUrl: string | null,
  result: ResultApiResponse | null,
): string | null {
  if (deployMeta?.demoUrl) {
    return deployMeta.demoUrl;
  }
  if (pendingRedirectUrl) {
    return pendingRedirectUrl;
  }
  const netlify = resolveDeliveryOption(result, "netlify");
  return netlify.href ?? null;
}

function PricingTiersBlock({
  payHref,
  payHrefPro,
  payHrefFull,
  lang,
  clientId,
  email,
}: {
  payHref: string;
  payHrefPro: string;
  payHrefFull: string;
  lang: UiLang;
  clientId?: string;
  email?: string;
}) {
  const payCopy = getPayTranslations(lang);
  const tierCopy = getTierTranslations(lang);
  const [proDownloadToken, setProDownloadToken] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || !email?.trim()) {
      setProDownloadToken(null);
      return;
    }

    let cancelled = false;

    const pollStatus = async () => {
      try {
        const params = new URLSearchParams({
          clientId,
          email: email.trim(),
        });
        const response = await fetch(`/api/mvp-pro/status?${params.toString()}`);
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { ready?: boolean; downloadToken?: string };
        if (!cancelled && data.ready && data.downloadToken) {
          setProDownloadToken(data.downloadToken);
        }
      } catch {
        /* ignore polling errors */
      }
    };

    void pollStatus();
    const timer = window.setInterval(() => {
      void pollStatus();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [clientId, email]);

  const handleDownloadProZip = () => {
    if (!clientId || !proDownloadToken) {
      return;
    }
    const params = new URLSearchParams({
      clientId,
      token: proDownloadToken,
    });
    window.open(`/api/download-zip?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  /** Factory €499 / €999 cards — keep code, hide from public UI for now. */
  const showFactoryTariffCards = false;

  return (
    <div className="pricing-tiers-section">
      <hr className="pricing-tiers-divider" />
      <h3 className="pricing-tiers-title">{tierCopy.choosePlan}</h3>
      <div className="pricing-tiers-grid">
        <article className="pricing-tier-card">
          <div className="pricing-tier-icon" aria-hidden>
            ⚡
          </div>
          <h4 className="pricing-tier-name">{tierCopy.mvpDemo.name}</h4>
          <div className="pricing-tier-price">€199</div>
          <p className="pricing-tier-desc">{tierCopy.mvpDemo.description}</p>
          <div className="pricing-tier-cta">
            <Link href={payHref} className="pricing-tier-btn pricing-tier-btn--primary">
              {payCopy.payButton}
            </Link>
            <p className="pricing-tier-pay-subline">{payCopy.paySubline}</p>
          </div>
        </article>

        {showFactoryTariffCards ? (
          <>
            <article className="pricing-tier-card pricing-tier-card--popular">
              <span className="pricing-tier-badge">{tierCopy.popular}</span>
              <div className="pricing-tier-icon" aria-hidden>
                🚀
              </div>
              <h4 className="pricing-tier-name">{tierCopy.mvpPro.name}</h4>
              <div className="pricing-tier-price">€499</div>
              <p className="pricing-tier-desc">{tierCopy.mvpPro.description}</p>
              {proDownloadToken && clientId ? (
                <button type="button" className="pricing-tier-btn pricing-tier-btn--primary" onClick={handleDownloadProZip}>
                  {tierCopy.downloadZip}
                </button>
              ) : (
                <a
                  href={payHrefPro}
                  className="pricing-tier-btn"
                  target="_blank"
                  rel="noreferrer"
                >
                  €499
                </a>
              )}
            </article>

            <article className="pricing-tier-card">
              <div className="pricing-tier-icon" aria-hidden>
                💎
              </div>
              <h4 className="pricing-tier-name">{tierCopy.crmFull.name}</h4>
              <div className="pricing-tier-price">€999</div>
              <p className="pricing-tier-desc">{tierCopy.crmFull.description}</p>
              <a
                href={payHrefFull}
                className="pricing-tier-btn"
                target="_blank"
                rel="noreferrer"
              >
                {tierCopy.crmFull.contact}
              </a>
            </article>
          </>
        ) : null}
      </div>
    </div>
  );
}

function buildQuestionnairePayloadFromWizard(input: {
  name: string;
  businessName: string;
  email: string;
  businessType: string;
  language: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  postalCode: string;
  city: string;
  address: string;
  sectorId: string | null;
}) {
  return {
    ...buildQuestionnairePayload(input),
    phone: input.phone,
    whatsapp: input.whatsapp,
    telegram: input.telegram,
    postal_code: input.postalCode,
    city: input.city,
    address: input.address,
    sector_id: input.sectorId ?? "",
  };
}

export function ClientWizardPage() {
  useEffect(() => {
    markLandingReturnReload();
  }, []);

  const searchParams = useSearchParams();
  const payment =
    searchParams?.get("payment") ||
    (searchParams?.has("payment-processing") ? "processing" : null);
  const paymentClientId = searchParams?.get("clientId")?.trim() ?? "";
  const paymentCheckoutId =
    searchParams?.get("checkout_id")?.trim() ||
    searchParams?.get("customer_session_token")?.trim() ||
    "";

  if (payment === "processing" || payment === "error") {
    return (
      <PaymentReturnScreen
        mode={payment}
        clientId={paymentClientId}
        checkoutId={paymentCheckoutId}
      />
    );
  }

  return <ClientWizardFlow />;
}

function ClientWizardFlow() {
  const searchParams = useSearchParams();
  const { locale, setLocale } = useTranslation();
  const lang = locale as UiLang;
  const copy = getCopy(lang);

  const urlClientId = searchParams?.get("clientId")?.trim() ?? "";

  const [step, setStep] = useState<StepId>("s1");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [contactTelegram, setContactTelegram] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const nicheFromUrl = searchParams?.get("niche")?.trim() ?? "";
  const nicheLocked = isWizardSectorId(nicheFromUrl);
  const [selSector, setSelSector] = useState<string | null>(() =>
    nicheLocked ? nicheFromUrl : null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [buildSecondsLeft, setBuildSecondsLeft] = useState(BUILD_COUNTDOWN_SEC);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);
  const [deployMeta, setDeployMeta] = useState<{
    demoUrl: string;
    publicSiteUrl?: string;
    siteId?: string;
    clientId?: string;
    slug?: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("—");
  const [previewSub, setPreviewSub] = useState("—");
  const [autoAdvancedToPreview, setAutoAdvancedToPreview] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoValidated, setPromoValidated] = useState(false);
  const [promoError, setPromoError] = useState(false);
  const [promoChecking, setPromoChecking] = useState(false);
  const [livePreviewIframeSrc, setLivePreviewIframeSrc] = useState<string | null>(null);
  const [livePreviewWarming, setLivePreviewWarming] = useState(false);

  // Drop stale deploy preview if the URL clientId does not match this session's build.
  useEffect(() => {
    if (!urlClientId || !deployMeta?.clientId) return;
    if (deployMeta.clientId === urlClientId) return;
    setPendingRedirectUrl(null);
    setDeployMeta(null);
    setLivePreviewIframeSrc(null);
    setStep("s1");
  }, [urlClientId, deployMeta?.clientId]);

  // Prefer Railway `/demo/{slug}` only — never fall back to pages.dev / netlify hashes.
  const livePreviewUrl = (() => {
    const candidates = [pendingRedirectUrl, deployMeta?.demoUrl, previewUrl];
    for (const candidate of candidates) {
      if (candidate && isReadableDemoPreviewUrl(candidate)) {
        return candidate;
      }
    }
    return "";
  })();
  const hasPromoInput = promoInput.trim().length > 0;

  useEffect(() => {
    if (step !== "s5") {
      return;
    }

    let active = true;
    const sector = copy.sectors.find((item) => item.id === selSector);

    setPreviewTitle(name.trim() || "—");
    setPreviewSub(sector ? `${sector.icon} ${sector.label}` : "—");
    const railwayPreview =
      (pendingRedirectUrl && isReadableDemoPreviewUrl(pendingRedirectUrl) && pendingRedirectUrl) ||
      (deployMeta?.demoUrl && isReadableDemoPreviewUrl(deployMeta.demoUrl) && deployMeta.demoUrl) ||
      "";
    setPreviewUrl(railwayPreview);

    void (async () => {
      try {
        const preview = await fetchPreviewLatest();
        if (!active) {
          return;
        }
        if (!preview.ok) {
          return;
        }
        // Never adopt pages.dev / netlify preview_url into wizard Live Preview state.
        if (preview.preview_url && isReadableDemoPreviewUrl(preview.preview_url)) {
          setPreviewUrl(preview.preview_url);
        }
        if (preview.business_name) {
          setPreviewTitle(preview.business_name);
        }
        if (preview.business_type) {
          const matchedSector = copy.sectors.find(
            (item) => SECTOR_TO_BUSINESS_TYPE[item.id] === preview.business_type,
          );
          setPreviewSub(
            matchedSector
              ? `${matchedSector.icon} ${matchedSector.label}`
              : preview.business_type,
          );
        }
      } catch {
        /* keep fallback preview from wizard state */
      }
    })();

    return () => {
      active = false;
    };
  }, [copy.sectors, deployMeta, name, pendingRedirectUrl, selSector, step]);

  useEffect(() => {
    if (step !== "s5" || !isReadableDemoPreviewUrl(livePreviewUrl)) {
      setLivePreviewIframeSrc(null);
      setLivePreviewWarming(false);
      return;
    }

    let cancelled = false;
    setLivePreviewIframeSrc(null);
    setLivePreviewWarming(true);

    const clientId = deployMeta?.clientId;

    void (async () => {
      for (let attempt = 0; attempt < LIVE_PREVIEW_PROBE_MAX_ATTEMPTS; attempt++) {
        if (cancelled) {
          return;
        }

        try {
          const params = new URLSearchParams({ url: livePreviewUrl });
          if (clientId) {
            params.set("clientId", clientId);
          }
          const response = await fetch(`/api/preview-site-ready?${params.toString()}`);
          if (response.ok) {
            const data = (await response.json()) as { ready?: boolean };
            if (data.ready) {
              if (!cancelled) {
                // Guard again: never mount a pages.dev hash even if probe returned ready.
                if (isEphemeralPagesPreviewUrl(livePreviewUrl)) {
                  console.error("[wizard] refusing ephemeral pages.dev Live Preview URL", livePreviewUrl);
                  setLivePreviewWarming(false);
                  return;
                }
                setLivePreviewIframeSrc(livePreviewUrl);
                setLivePreviewWarming(false);
              }
              return;
            }
          }
        } catch {
          /* retry on next interval */
        }

        if (attempt < LIVE_PREVIEW_PROBE_MAX_ATTEMPTS - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, LIVE_PREVIEW_PROBE_INTERVAL_MS));
        }
      }

      // Do not mount iframe until probe confirms embed headers (avoid 522 + XFO SAMEORIGIN).
      if (!cancelled) {
        setLivePreviewWarming(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deployMeta?.clientId, livePreviewUrl, step]);

  const goTo = useCallback((id: StepId) => {
    setStep(id);
  }, []);

  useEffect(() => {
    if (step !== "s4" || isGenerating || !pendingRedirectUrl || autoAdvancedToPreview) {
      return;
    }
    setAutoAdvancedToPreview(true);
    goTo("s5");
  }, [autoAdvancedToPreview, goTo, isGenerating, pendingRedirectUrl, step]);

  useEffect(() => {
    if (!isGenerating) {
      setBuildSecondsLeft(BUILD_COUNTDOWN_SEC);
      return;
    }
    setBuildSecondsLeft(BUILD_COUNTDOWN_SEC);
    const startedAt = Date.now();
    const tick = () => {
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      setBuildSecondsLeft(Math.max(0, BUILD_COUNTDOWN_SEC - elapsedSec));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [isGenerating]);

  const [nameErr, setNameErr] = useState(false);
  const [businessNameErr, setBusinessNameErr] = useState(false);
  const [emailErr, setEmailErr] = useState(false);
  const [phoneErr, setPhoneErr] = useState(false);
  const [whatsappErr, setWhatsappErr] = useState(false);
  const [telegramErr, setTelegramErr] = useState(false);
  const [postalErr, setPostalErr] = useState(false);
  const [cityErr, setCityErr] = useState(false);
  const [addressErr, setAddressErr] = useState(false);
  const [sectorErr, setSectorErr] = useState(false);
  const [agbAccepted, setAgbAccepted] = useState(false);

  const runBuild = useCallback(
    async (
      contactName: string,
      companyName: string,
      selectedSector: string,
      contacts: {
        phone: string;
        whatsapp: string;
        telegram: string;
        postalCode: string;
        city: string;
        address: string;
      },
    ) => {
      const buildStartedAt = Date.now();
      setIsGenerating(true);

      const businessType = SECTOR_TO_BUSINESS_TYPE[selectedSector] ?? DEFAULT_BUSINESS_TYPE;
      const languageCode = lang;
      const payload = {
        ...buildQuestionnairePayloadFromWizard({
          name: contactName,
          businessName: companyName,
          email: email.trim(),
          businessType,
          language: languageCode,
          phone: contacts.phone,
          whatsapp: contacts.whatsapp,
          telegram: contacts.telegram,
          postalCode: contacts.postalCode,
          city: contacts.city,
          address: contacts.address,
          sectorId: selectedSector,
        }),
        terms_accepted: agbAccepted,
        privacy_accepted: agbAccepted,
      };

      try {
        const recaptchaToken = await executeRecaptcha("submit_questionnaire");
        const data = await saveQuestionnaire(payload, recaptchaToken);
        console.log("[wizard] API response:", data);
        const slug = data.slug?.trim() || "";
        const clientId = data.clientId?.trim() || "";

        let demoPath = "";
        if (slug && clientId) {
          demoPath = `/demo/${encodeURIComponent(slug)}?clientId=${encodeURIComponent(clientId)}`;
        } else if (data.redirectUrl?.trim()) {
          demoPath = data.redirectUrl.trim();
        }
        if (!demoPath) {
          throw new Error("No redirect URL returned");
        }

        // Keep the 01:00…00:00 board visible for the full timer even if API finishes early.
        // Then open /demo with the unpaid tariff + promo banner (not paid share links).
        const elapsedMs = Date.now() - buildStartedAt;
        const remainingMs = BUILD_COUNTDOWN_SEC * 1000 - elapsedMs;
        if (remainingMs > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remainingMs));
        }

        console.log("[wizard] navigation target:", demoPath);
        window.location.assign(demoPath);
      } catch (error) {
        console.error("POST /api/client-questionnaire failed:", error);
        console.log("[wizard] navigation target:", "s4 (build error, staying on build screen)");
        setIsGenerating(false);
      }
    },
    [agbAccepted, email, lang],
  );

  function goRestart() {
    setIsGenerating(false);
    setPendingRedirectUrl(null);
    setDeployMeta(null);
    setSelSector(null);
    setName("");
    setBusinessName("");
    setEmail("");
    setContactPhone("");
    setContactWhatsapp("");
    setContactTelegram("");
    setPostalCode("");
    setCity("");
    setAddress("");
    for (const id of ["f-phone", "f-whatsapp", "f-telegram"]) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.value = "";
    }
    setAgbAccepted(false);
    setNameErr(false);
    setBusinessNameErr(false);
    setEmailErr(false);
    setPhoneErr(false);
    setWhatsappErr(false);
    setTelegramErr(false);
    setPostalErr(false);
    setCityErr(false);
    setAddressErr(false);
    setAutoAdvancedToPreview(false);
    setShowPromo(false);
    setPromoInput("");
    setLivePreviewIframeSrc(null);
    setLivePreviewWarming(false);
    goTo("s1");
  }

  function go1() {
    const sectorFromSelect =
      (document.getElementById("sector-select") as HTMLSelectElement | null)?.value.trim() || null;
    const selectedSector = selSector || sectorFromSelect;

    if (!selectedSector) {
      setSectorErr(true);
      setTimeout(() => setSectorErr(false), 800);
      return;
    }
    if (!agbAccepted) {
      return;
    }

    if (!selSector && selectedSector) {
      setSelSector(selectedSector);
    }

    void executeRecaptcha("wizard_step_1");
    goTo("s2");
  }

  function go2() {
    const trimmedName = name.trim();
    const trimmedBusinessName = businessName.trim();
    const trimmedEmail = email.trim();
    const phone = (document.getElementById("f-phone") as HTMLInputElement | null)?.value.trim() ?? "";
    const whatsapp = (document.getElementById("f-whatsapp") as HTMLInputElement | null)?.value.trim() ?? "";
    const telegram = (document.getElementById("f-telegram") as HTMLInputElement | null)?.value.trim() ?? "";
    const trimmedPostal = postalCode.trim();
    const trimmedCity = city.trim();
    const trimmedAddress = address.trim();

    const nameInvalid = !trimmedName;
    const businessInvalid = !trimmedBusinessName;
    const emailInvalid = !trimmedEmail || !EMAIL_RE.test(trimmedEmail);
    const phoneInvalid = !phone;
    const whatsappInvalid = !whatsapp;
    const telegramInvalid = !telegram;
    const postalInvalid = !trimmedPostal;
    const cityInvalid = !trimmedCity;
    const addressInvalid = !trimmedAddress;

    setNameErr(nameInvalid);
    setBusinessNameErr(businessInvalid);
    setEmailErr(emailInvalid);
    setPhoneErr(phoneInvalid);
    setWhatsappErr(whatsappInvalid);
    setTelegramErr(telegramInvalid);
    setPostalErr(postalInvalid);
    setCityErr(cityInvalid);
    setAddressErr(addressInvalid);

    if (
      nameInvalid ||
      businessInvalid ||
      emailInvalid ||
      phoneInvalid ||
      whatsappInvalid ||
      telegramInvalid ||
      postalInvalid ||
      cityInvalid ||
      addressInvalid
    ) {
      return;
    }

    const selectedSector = selSector;
    if (!selectedSector) {
      setSectorErr(true);
      setTimeout(() => setSectorErr(false), 800);
      goTo("s1");
      return;
    }

    setContactPhone(phone);
    setContactWhatsapp(whatsapp);
    setContactTelegram(telegram);
    setPostalCode(trimmedPostal);
    setCity(trimmedCity);
    setAddress(trimmedAddress);

    console.log("[wizard] selectedSector:", selectedSector);
    console.log("[wizard] submit start");
    console.log("[wizard] navigation target:", "s4");
    void executeRecaptcha("wizard_step_2");
    goTo("s4");
    void runBuild(trimmedName, trimmedBusinessName, selectedSector, {
      phone,
      whatsapp,
      telegram,
      postalCode: trimmedPostal,
      city: trimmedCity,
      address: trimmedAddress,
    });
  }

  function handleYes() {
    setShowPromo(false);
    setPromoInput("");
    setPromoValidated(false);
    setPromoError(false);
    goTo("s6");
  }

  async function handlePayOrUnlock() {
    if (hasPromoInput) {
      setPromoChecking(true);
      setPromoError(false);
      try {
        const response = await fetch("/api/redeem-promo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: promoInput.trim(),
            clientId: deployMeta?.clientId?.trim() || "",
          }),
        });
        const data = (await response.json()) as { valid?: boolean };
        if (response.ok && data.valid) {
          setPromoValidated(true);
          const slug = deployMeta?.slug?.trim() || "";
          const clientId = deployMeta?.clientId?.trim() || "";
          if (slug && clientId) {
            window.location.assign(
              `/demo/${encodeURIComponent(slug)}?clientId=${encodeURIComponent(clientId)}`,
            );
            return;
          }
          if (deployMeta?.demoUrl) {
            window.location.assign(deployMeta.demoUrl);
            return;
          }
        } else {
          setPromoValidated(false);
          setPromoError(true);
        }
      } catch {
        setPromoValidated(false);
        setPromoError(true);
      } finally {
        setPromoChecking(false);
      }
      return;
    }

    const params = new URLSearchParams();
    if (deployMeta?.clientId) params.set("clientId", deployMeta.clientId);
    if (email.trim()) params.set("email", email.trim());
    if (name.trim()) params.set("ownerName", name.trim());
    if (businessName.trim()) params.set("businessName", businessName.trim());
    if (city.trim()) params.set("city", city.trim());
    if (contactPhone.trim()) params.set("phone", contactPhone.trim());
    if (contactWhatsapp.trim()) params.set("whatsapp", contactWhatsapp.trim());
    if (selSector) params.set("niche", selSector);
    params.set("lang", lang);
    params.set("language", lang);
    if (deployMeta?.demoUrl) params.set("demo_url", deployMeta.demoUrl);
    window.location.href = `/tariffs?${params.toString()}`;
  }

  const stepClass = (id: StepId) => (step === id ? "step active" : "step");
  const confirmedSector = nicheLocked
    ? copy.sectors.find((item) => item.id === nicheFromUrl)
    : null;
  const canProceedStep1 = agbAccepted && Boolean(selSector);

  return (
    <div className="mf-root" data-step={step} lang={lang} translate="no">
      <div className="shell">
        <div className="glow" />

        <div className="ui-lang">
          {(["en", "de", "ru"] as UiLang[]).map((code) => (
            <button
              key={code}
              type="button"
              className={`ui-lang-btn ${lang === code ? "active" : ""}`}
              onClick={() => setLocale(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="card">
          {/* STEP 1 — Business sector (two-column layout) */}
          <div className={`${stepClass("s1")} s1-split`} id="s1">
            <aside className="s1-panel s1-panel-left" aria-hidden={step !== "s1"}>
              <div className="s1-left-inner">
                <div className="s1-left-progress">
                  <div className="s1-left-bars">
                    <span className="s1-left-bar active" />
                    <span className="s1-left-bar" />
                  </div>
                  <span className="s1-left-step-label">{copy.s1_label}</span>
                </div>
                <h2 className="s1-left-headline">
                  <span className="s1-left-h1">{copy.s1_headline1}</span>
                  <span className="s1-left-h2">{copy.s1_headline2}</span>
                  <span className="s1-left-h3">{copy.s1_headline3}</span>
                </h2>
                <div className="s1-flow-grid">
                  {copy.s1_flow_steps.map((item) => (
                    <div key={item.n} className="s1-flow-card">
                      <span className="s1-flow-num">{item.n}</span>
                      <div>
                        <div className="s1-flow-label">{item.label}</div>
                        <div className="s1-flow-sub">{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="s1-benefits-box">
                  <div className="s1-benefits-title">{copy.s1_what_you_get}</div>
                  <ul className="s1-benefits-list">
                    {copy.s1_benefits.map((item) => (
                      <li key={item.title}>
                        <span className="s1-benefit-check" aria-hidden>
                          ✓
                        </span>
                        <span>
                          <strong>{item.title}</strong>
                          <span className="s1-benefit-sub">{item.sub}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="s1-price-row">
                    <div>
                      <div className="s1-price-label">{copy.s1_price_label}</div>
                      <div className="s1-price-value">{copy.s1_price}</div>
                    </div>
                    <div className="s1-price-aside">
                      <div className="s1-ready">{copy.s1_ready_in}</div>
                      <div className="s1-price-desc">{copy.s1_price_desc}</div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <div className="s1-panel s1-panel-right">
              <div className="s1-right-inner">
                <ProgressBar step="s1" />
                <div className="step-label">{copy.s1_label}</div>
                <div className="step-h">{copy.s1_h}</div>
                <div className="step-motivation">{copy.s1_motivation}</div>
                {confirmedSector ? (
                  <div className="niche-confirm">
                    <span className="niche-confirm-icon" aria-hidden>
                      {confirmedSector.icon}
                    </span>
                    <span className="niche-confirm-label">{confirmedSector.label}</span>
                  </div>
                ) : (
                  <>
                    <div className="step-sub">{copy.s1_sub}</div>
                    <select
                      className={`inp ${sectorErr ? "err" : ""}`}
                      id="sector-select"
                      value={selSector ?? ""}
                      onChange={(e) => setSelSector(e.target.value || null)}
                      style={{ fontSize: 15, padding: "14px 16px", marginBottom: 8 }}
                    >
                      <option value="">{copy.s1_placeholder}</option>
                      {copy.sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.icon} {sector.label}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <label className="agb-row">
                  <input
                    type="checkbox"
                    id="agb-checkbox"
                    checked={agbAccepted}
                    onChange={(e) => setAgbAccepted(e.target.checked)}
                  />
                  <span>
                    {copy.agb_accept}{" "}
                    <a href="/agb" target="_blank" rel="noreferrer" className="agb-link">
                      {copy.agb_terms}
                    </a>{" "}
                    {copy.agb_and}{" "}
                    <a href="/datenschutz" target="_blank" rel="noreferrer" className="agb-link">
                      {copy.agb_privacy}
                    </a>
                  </span>
                </label>
                <WizardStepNav>
                  <Link href="/" className="btn-back btn-nav-secondary">
                    <span>{copy.btn_back}</span>
                  </Link>
                  <button
                    type="button"
                    className="btn-primary btn-nav-primary"
                    onClick={go1}
                    disabled={!canProceedStep1}
                  >
                    <span>{copy.btn_next}</span>
                  </button>
                </WizardStepNav>
              </div>
            </div>
          </div>

          {/* STEP 2 — Personal details */}
          <div className={stepClass("s2")} id="s2">
            <ProgressBar step="s2" />
            <div className="step-label">{copy.s2_label}</div>
            <div className="step-h step-h-intro">{copy.s2_h}</div>
            <div className="step-motivation">{copy.s2_motivation}</div>
            <div className="field">
              <label className="inp-label" htmlFor="f-name">
                {copy.lbl_name}
              </label>
              <input
                id="f-name"
                className={`inp ${nameErr ? "err shake" : ""}`}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameErr(false);
                }}
                placeholder={copy.ph_name}
                autoComplete="name"
              />
              {nameErr ? <p className="field-err">{copy.err_name}</p> : null}
            </div>
            <div className="field">
              <label className="inp-label" htmlFor="f-biz">
                {copy.lbl_biz}
              </label>
              <input
                id="f-biz"
                className={`inp ${businessNameErr ? "err shake" : ""}`}
                type="text"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  setBusinessNameErr(false);
                }}
                placeholder={copy.ph_biz}
                autoComplete="organization"
              />
              {businessNameErr ? <p className="field-err">{copy.err_biz}</p> : null}
            </div>
            <div className="field">
              <label className="inp-label" htmlFor="f-email">
                {copy.lbl_email}
              </label>
              <input
                id="f-email"
                className={`inp ${emailErr ? "err shake" : ""}`}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailErr(false);
                }}
                placeholder="anna@example.com"
              />
              {emailErr ? <p className="field-err">{copy.err_email}</p> : null}
            </div>
            <div className="field">
              <label className="inp-label" htmlFor="f-phone">
                Phone
              </label>
              <input
                id="f-phone"
                className={`inp ${phoneErr ? "err shake" : ""}`}
                type="tel"
                placeholder="+49 152..."
                onInput={() => setPhoneErr(false)}
              />
              {phoneErr ? <p className="field-err">{copy.err_phone}</p> : null}
            </div>
            <div className="field">
              <label className="inp-label" htmlFor="f-whatsapp">
                WhatsApp
              </label>
              <input
                id="f-whatsapp"
                className={`inp ${whatsappErr ? "err shake" : ""}`}
                type="tel"
                placeholder="+49 152..."
                onInput={() => setWhatsappErr(false)}
              />
              {whatsappErr ? <p className="field-err">{copy.err_whatsapp}</p> : null}
            </div>
            <div className="field">
              <label className="inp-label" htmlFor="f-postal">
                {copy.lbl_postal}
              </label>
              <input
                id="f-postal"
                className={`inp ${postalErr ? "err shake" : ""}`}
                type="text"
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                  setPostalErr(false);
                }}
                placeholder={copy.ph_postal}
                autoComplete="postal-code"
              />
              {postalErr ? <p className="field-err">{copy.err_postal}</p> : null}
            </div>
            <div className="field">
              <label className="inp-label" htmlFor="f-city">
                {copy.lbl_city}
              </label>
              <input
                id="f-city"
                className={`inp ${cityErr ? "err shake" : ""}`}
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setCityErr(false);
                }}
                placeholder={copy.ph_city}
                autoComplete="address-level2"
              />
              {cityErr ? <p className="field-err">{copy.err_city}</p> : null}
            </div>
            <div className="field">
              <label className="inp-label" htmlFor="f-address">
                {copy.lbl_address}
              </label>
              <input
                id="f-address"
                className={`inp ${addressErr ? "err shake" : ""}`}
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setAddressErr(false);
                }}
                placeholder={copy.ph_address}
                autoComplete="street-address"
              />
              {addressErr ? <p className="field-err">{copy.err_address}</p> : null}
            </div>
            <div className="field">
              <label className="inp-label" htmlFor="f-telegram">
                Telegram
              </label>
              <input
                id="f-telegram"
                className={`inp ${telegramErr ? "err shake" : ""}`}
                type="text"
                placeholder="@username"
                onInput={() => setTelegramErr(false)}
              />
              {telegramErr ? <p className="field-err">{copy.err_telegram}</p> : null}
            </div>
            <WizardStepNav>
              <button type="button" className="btn-back btn-nav-secondary" onClick={() => goTo("s1")}>
                <span>{copy.btn_back}</span>
              </button>
              <button type="button" className="btn-primary btn-nav-primary" onClick={go2}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{copy.btn_generate}</span>
              </button>
            </WizardStepNav>
          </div>

          {/* STEP 4 */}
          <div className={stepClass("s4")} id="s4">
            <div className="build-wrap">
              {isGenerating ? <div className="build-spinner" id="build-spinner" /> : null}
              <div className="step-h" style={{ textAlign: "center" }}>
                ⚡ {copy.s4_h}
              </div>
              <div className="step-sub" style={{ textAlign: "center", marginBottom: 0 }} id="s4-biz-name">
                {name.trim()}
              </div>
              {isGenerating ? (
                <>
                  <p className="step-sub" style={{ textAlign: "center", marginTop: 12 }}>
                    {copy.s4_generating}
                  </p>
                  <div className="build-countdown" aria-live="polite" aria-atomic="true">
                    <div className="build-countdown-board">
                      <span className="build-countdown-digits">
                        {formatBuildCountdown(buildSecondsLeft)}
                      </span>
                    </div>
                    <p className="build-countdown-label">
                      {buildSecondsLeft > 0
                        ? copy.s4_publishing.replace("{n}", String(buildSecondsLeft))
                        : copy.s4_countdown_finishing}
                    </p>
                  </div>
                  <div className="build-progress" aria-hidden="true">
                    <div
                      className={`build-progress-bar ${buildSecondsLeft === 0 ? "is-finishing" : "is-timed"}`}
                      style={{
                        width: `${Math.min(
                          100,
                          ((BUILD_COUNTDOWN_SEC - buildSecondsLeft) / BUILD_COUNTDOWN_SEC) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </>
              ) : pendingRedirectUrl ? (
                <p className="step-sub" style={{ textAlign: "center", marginTop: 12, fontWeight: 600 }}>
                  {copy.s4_build_done}
                </p>
              ) : null}
            </div>
          </div>

          {/* STEP 5 */}
          <div className={stepClass("s5")} id="s5">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span
                className="pd"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#10B981",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>{copy.s5_live}</span>
            </div>
            <div className="step-h" style={{ marginBottom: 6 }} id="s5-title">
              {previewTitle}
            </div>
            <div className="step-sub" id="s5-sub">
              {previewSub}
            </div>
            <div className="preview-frame wizard-live-preview-frame" style={{ padding: 0, overflow: "hidden" }}>
              {livePreviewWarming ? (
                <div className="wizard-live-preview-loading" aria-live="polite">
                  <div className="build-spinner" />
                  <p>{copy.s5_preview_warming}</p>
                </div>
              ) : null}
              {livePreviewIframeSrc ? (
                <iframe
                  title="Live CRM Demo preview"
                  src={livePreviewIframeSrc}
                  className="wizard-live-preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              ) : null}
            </div>

            <div className="step-sub" style={{ marginBottom: 16 }}>
              {copy.s5_q}
            </div>
            <WizardStepNav layout="triple">
              <button type="button" className="btn-back btn-nav-secondary" onClick={() => goTo("s4")}>
                <span>{copy.btn_back}</span>
              </button>
              <button type="button" className="btn-yes btn-nav-choice" onClick={() => void handleYes()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>{copy.btn_yes}</span>
              </button>
              <button type="button" className="btn-no btn-nav-choice" onClick={goRestart}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                </svg>
                <span>{copy.btn_no}</span>
              </button>
            </WizardStepNav>
          </div>

          {/* STEP 6 */}
          <div className={stepClass("s6")} id="s6">
            <div className="step-h" style={{ marginBottom: 8 }}>
              {copy.s6_pay_h}
            </div>
            <div className="step-sub" style={{ marginBottom: 20 }}>
              {previewTitle}
            </div>
            <div className="wizard-pay-actions">
              <button
                type="button"
                className="wizard-pay-action-btn"
                onClick={() => setShowPromo((current) => !current)}
              >
                {copy.s6_promo_button}
              </button>
              <button
                type="button"
                className="wizard-pay-action-btn"
                onClick={() => void handlePayOrUnlock()}
                disabled={promoChecking}
              >
                {hasPromoInput ? copy.s6_promo_unlock : copy.s6_pay_button}
              </button>
            </div>
            {!hasPromoInput ? (
              <p className="step-sub" style={{ marginTop: 8, textAlign: "center" }}>
                {copy.s6_pay_subline}
              </p>
            ) : null}
            {showPromo ? (
              <div style={{ marginTop: 12 }}>
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value);
                    setPromoValidated(false);
                    setPromoError(false);
                  }}
                  placeholder={copy.s6_promo_placeholder}
                  className={`inp ${promoError ? "err" : ""}`}
                  style={
                    promoValidated
                      ? { borderColor: "#22c55e", background: "#f0fdf4" }
                      : undefined
                  }
                  disabled={promoChecking}
                />
                {promoError ? (
                  <p className="step-sub" style={{ marginTop: 8, color: "#ef4444" }}>
                    {copy.s6_promo_invalid}
                  </p>
                ) : null}
              </div>
            ) : null}
            <WizardStepNav layout="single">
              <button type="button" className="btn-back btn-nav-secondary" onClick={() => goTo("s5")}>
                <span>{copy.btn_back}</span>
              </button>
            </WizardStepNav>
          </div>
        </div>
      </div>
    </div>
  );
}
