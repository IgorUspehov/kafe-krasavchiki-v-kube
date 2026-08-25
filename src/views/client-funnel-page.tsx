"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  RefreshCw,
  Zap,
} from "lucide-react";

import { markPreviewApproved } from "@/lib/client-preview/approval-storage";
import type { ClientPreviewPayload } from "@/lib/client-preview/types";
import {
  FUNNEL_LANGUAGES,
  languageToApiCode,
  sectorToBusinessType,
  type FunnelLanguageId,
  type FunnelSectorId,
} from "@/lib/client-funnel/constants";
import { isV2DeliveryReady } from "@/lib/client-delivery-v2/v2-delivery-ui-mapper";
import type { V2StatusPayload } from "@/lib/client-delivery-v2/v2-delivery-ui-mapper";
import { type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/context";
import { getClientFunnelCopy } from "@/lib/i18n/client-funnel-copy";

import "@/styles/client-funnel.css";

type FunnelStep = "contacts" | "sector" | "language" | "build" | "preview";

const DEFAULT_WORKING_HOURS = {
  monday: "09:00-18:00",
  tuesday: "09:00-18:00",
  wednesday: "09:00-18:00",
  thursday: "09:00-18:00",
  friday: "09:00-18:00",
  saturday: "10:00-15:00",
  sunday: "closed",
};

function buildPayload(
  name: string,
  businessName: string,
  email: string,
  sectorId: string,
  languageId: string,
) {
  return {
    name,
    business_name: businessName,
    email,
    business_type: sectorToBusinessType(sectorId),
    language: languageToApiCode(languageId),
    phone: "",
    telegram: "",
    whatsapp: "",
    address: "",
    website: "",
    logo: "assets/logo.png",
    currency: "EUR",
    plan_id: "free",
    plan: "Free",
    amount: 0,
    payment_status: "FREE",
    terms_accepted: true,
    privacy_accepted: true,
    accepted_at: new Date().toISOString(),
    working_hours: DEFAULT_WORKING_HOURS,
    social_links: { instagram: "", facebook: "", tiktok: "", website: "" },
    business_questions: {},
  };
}

function LogoIcon() {
  return (
    <div className="client-funnel-logo">
      <div className="client-funnel-logo-icon">
        <Layers className="size-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="client-funnel-logo-name">Web Studio IHOR KRIAZHEV München</span>
    </div>
  );
}

function ProgressBar({ step }: { step: FunnelStep }) {
  const index =
    step === "contacts"
      ? 0
      : step === "sector"
        ? 1
        : step === "language"
          ? 2
          : step === "build" || step === "preview"
            ? 3
            : 0;

  return (
    <div className="client-funnel-progress">
      {[0, 1, 2].map((dot) => (
        <div
          key={dot}
          className={`client-funnel-progress-dot ${
            dot < index ? "done" : dot === index ? "active" : ""
          }`}
        />
      ))}
    </div>
  );
}

function UiLangSwitcher({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  const options: Locale[] = ["en", "de", "ru"];
  return (
    <div className="client-funnel-ui-lang">
      {options.map((code) => (
        <button
          key={code}
          type="button"
          className={`client-funnel-ui-lang-btn ${locale === code ? "active" : ""}`}
          onClick={() => onChange(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function ClientFunnelPage() {
  const router = useRouter();
  const { locale, setLocale } = useTranslation();
  const copy = getClientFunnelCopy(locale);

  const [step, setStep] = useState<FunnelStep>("contacts");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [sectorId, setSectorId] = useState<FunnelSectorId | null>(null);
  const [languageId, setLanguageId] = useState<FunnelLanguageId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buildPhase, setBuildPhase] = useState(0);
  const [buildDone, setBuildDone] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<ClientPreviewPayload | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPoll(), [clearPoll]);

  useEffect(() => {
    if (step !== "build") return;
    const timer = setInterval(() => {
      setBuildPhase((current) => Math.min(current + 1, copy.build_steps.length - 1));
    }, 900);
    return () => clearInterval(timer);
  }, [step, copy.build_steps.length]);

  async function pollUntilReady(): Promise<boolean> {
    return new Promise((resolve) => {
      const check = async () => {
        try {
          const response = await fetch("/api/client-delivery-v2/status");
          if (!response.ok) return;
          const statusPayload = (await response.json()) as V2StatusPayload;
          if (isV2DeliveryReady(statusPayload)) {
            clearPoll();
            resolve(true);
          }
        } catch {
          /* keep polling */
        }
      };
      void check();
      pollRef.current = setInterval(() => void check(), 2000);
    });
  }

  async function loadPreview() {
    const response = await fetch("/api/client-preview/latest");
    const data = (await response.json()) as ClientPreviewPayload;
    if (response.ok && data.ok) {
      setPreviewPayload(data);
    }
  }

  async function runGenerate() {
    setError(null);
    setStep("build");
    setBuildPhase(0);
    setBuildDone(false);

    try {
      const payload = buildPayload(
        name.trim(),
        businessName.trim(),
        email.trim(),
        sectorId ?? "dental",
        languageId ?? "en",
      );

      const saveResponse = await fetch("/api/client-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const saveResult = (await saveResponse.json()) as { ok?: boolean; error?: string };
      if (!saveResponse.ok || !saveResult.ok) {
        throw new Error(saveResult.error ?? copy.errorSave);
      }

      const runResponse = await fetch("/api/client-delivery-v2/run", { method: "POST" });
      if (!runResponse.ok) {
        const runError = (await runResponse.json()) as { error?: string };
        throw new Error(runError.error ?? copy.errorDelivery);
      }

      const ready = await pollUntilReady();
      if (!ready) throw new Error(copy.errorDelivery);

      setBuildPhase(copy.build_steps.length - 1);
      setBuildDone(true);
      await loadPreview();
      setStep("preview");
    } catch (generateError) {
      clearPoll();
      setStep("language");
      setError(generateError instanceof Error ? generateError.message : copy.errorDelivery);
    }
  }

  function handleYes() {
    if (!previewPayload?.preview_id) return;
    markPreviewApproved(previewPayload.preview_id);
    router.push(`/client-result/${encodeURIComponent(previewPayload.preview_id)}`);
  }

  function handleRestart() {
    clearPoll();
    setStep("contacts");
    setName("");
    setBusinessName("");
    setEmail("");
    setSectorId(null);
    setLanguageId(null);
    setError(null);
    setBuildPhase(0);
    setBuildDone(false);
    setPreviewPayload(null);
  }

  const sectorLabel = copy.sectors.find((s) => s.id === sectorId);
  const langLabel = FUNNEL_LANGUAGES.find((l) => l.id === languageId)?.label ?? "";

  return (
    <div className="client-funnel-root">
      <div className="client-funnel-shell">
        <div className="client-funnel-glow" />
        <UiLangSwitcher locale={locale} onChange={setLocale} />

        <div className="client-funnel-card">
          {step === "contacts" ? (
            <div className="client-funnel-step-panel" key="contacts">
              <LogoIcon />
              <ProgressBar step="contacts" />
              <div className="client-funnel-step-label">{copy.s1_label}</div>
              <div className="client-funnel-step-h">{copy.s1_h}</div>
              <div className="client-funnel-step-sub">{copy.s1_sub}</div>
              {error ? <div className="client-funnel-error">{error}</div> : null}
              <div className="client-funnel-field">
                <label className="client-funnel-inp-label" htmlFor="cf-name">
                  {copy.lbl_name}
                </label>
                <input
                  id="cf-name"
                  className="client-funnel-inp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.ph_name}
                />
              </div>
              <div className="client-funnel-field">
                <label className="client-funnel-inp-label" htmlFor="cf-biz">
                  {copy.lbl_biz}
                </label>
                <input
                  id="cf-biz"
                  className="client-funnel-inp"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={copy.ph_biz}
                />
              </div>
              <div className="client-funnel-field">
                <label className="client-funnel-inp-label" htmlFor="cf-email">
                  {copy.lbl_email}
                </label>
                <input
                  id="cf-email"
                  type="email"
                  className="client-funnel-inp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anna@example.com"
                />
              </div>
              <button
                type="button"
                className="client-funnel-btn-primary"
                onClick={() => {
                  if (!name.trim() || !businessName.trim() || !email.includes("@")) {
                    setError(copy.errorRequired);
                    return;
                  }
                  setError(null);
                  setStep("sector");
                }}
              >
                {copy.btn_next}
                <ArrowRight className="size-4" />
              </button>
            </div>
          ) : null}

          {step === "sector" ? (
            <div className="client-funnel-step-panel" key="sector">
              <LogoIcon />
              <ProgressBar step="sector" />
              <div className="client-funnel-step-label">{copy.s2_label}</div>
              <div className="client-funnel-step-h">{copy.s2_h}</div>
              <div className="client-funnel-step-sub">{copy.s2_sub}</div>
              {error ? <div className="client-funnel-error">{error}</div> : null}
              <div className="client-funnel-sector-grid">
                {copy.sectors.map((sector) => (
                  <button
                    key={sector.id}
                    type="button"
                    className={`client-funnel-sector-btn ${sectorId === sector.id ? "sel" : ""}`}
                    onClick={() => setSectorId(sector.id as FunnelSectorId)}
                  >
                    <span>{sector.icon}</span>
                    {sector.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="client-funnel-btn-primary"
                style={{ marginTop: 20 }}
                onClick={() => {
                  if (!sectorId) {
                    setError(copy.errorRequired);
                    return;
                  }
                  setError(null);
                  setStep("language");
                }}
              >
                {copy.btn_next}
                <ArrowRight className="size-4" />
              </button>
              <button type="button" className="client-funnel-btn-back" onClick={() => setStep("contacts")}>
                <ArrowLeft className="size-3.5" />
                {copy.btn_back}
              </button>
            </div>
          ) : null}

          {step === "language" ? (
            <div className="client-funnel-step-panel" key="language">
              <LogoIcon />
              <ProgressBar step="language" />
              <div className="client-funnel-step-label">{copy.s3_label}</div>
              <div className="client-funnel-step-h">{copy.s3_h}</div>
              <div className="client-funnel-step-sub">{copy.s3_sub}</div>
              {error ? <div className="client-funnel-error">{error}</div> : null}
              <div className="client-funnel-lang-grid">
                {FUNNEL_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    className={`client-funnel-lang-pill ${languageId === lang.id ? "sel" : ""}`}
                    onClick={() => setLanguageId(lang.id)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="client-funnel-btn-primary"
                style={{ marginTop: 24 }}
                onClick={() => {
                  if (!languageId) {
                    setError(copy.errorRequired);
                    return;
                  }
                  void runGenerate();
                }}
              >
                <Zap className="size-4" />
                {copy.btn_generate}
              </button>
              <button type="button" className="client-funnel-btn-back" onClick={() => setStep("sector")}>
                <ArrowLeft className="size-3.5" />
                {copy.btn_back}
              </button>
            </div>
          ) : null}

          {step === "build" ? (
            <div className="client-funnel-step-panel" key="build">
              <LogoIcon />
              <div className="client-funnel-build-wrap">
                <div className={`client-funnel-build-spinner ${buildDone ? "done" : ""}`} />
                <div className="client-funnel-step-h" style={{ textAlign: "center" }}>
                  {copy.s4_h}
                </div>
                <div className="client-funnel-step-sub" style={{ textAlign: "center", marginBottom: 0 }}>
                  {businessName}
                </div>
                <div className="client-funnel-build-steps">
                  {copy.build_steps.map((label, index) => (
                    <div
                      key={label}
                      className={`client-funnel-build-step ${
                        index < buildPhase ? "done" : index === buildPhase ? "active" : ""
                      }`}
                    >
                      <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {index < buildPhase ? <Check className="size-3 text-emerald-500" /> : null}
                      </div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === "preview" ? (
            <div className="client-funnel-step-panel" key="preview">
              <LogoIcon />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <span className="client-funnel-live-dot" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>{copy.s5_live}</span>
              </div>
              <div className="client-funnel-step-h" style={{ marginBottom: 6 }}>
                {businessName}
              </div>
              <div className="client-funnel-step-sub">
                {sectorLabel ? `${sectorLabel.icon} ${sectorLabel.label}` : ""} · {langLabel}
              </div>
              <div className="client-funnel-preview-frame">
                {previewPayload?.preview_url ? (
                  <iframe
                    title={copy.s5_live}
                    src={previewPayload.preview_url}
                    className="client-funnel-preview-iframe"
                  />
                ) : (
                  <div style={{ padding: 24, color: "#71717a", textAlign: "center" }}>{copy.errorDelivery}</div>
                )}
              </div>
              <div className="client-funnel-step-sub" style={{ marginBottom: 16 }}>
                {copy.s5_q}
              </div>
              <div className="client-funnel-decision">
                <button type="button" className="client-funnel-btn-yes" onClick={handleYes}>
                  <Check className="size-4" />
                  {copy.btn_yes}
                </button>
                <button type="button" className="client-funnel-btn-no" onClick={handleRestart}>
                  <RefreshCw className="size-4" />
                  {copy.btn_no}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
