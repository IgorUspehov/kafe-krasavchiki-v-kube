"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Factory, Loader2, Sparkles } from "lucide-react";

import { isV2DeliveryReady } from "@/lib/client-delivery-v2/v2-delivery-ui-mapper";
import type { V2StatusPayload } from "@/lib/client-delivery-v2/v2-delivery-ui-mapper";
import {
  FUNNEL_BUSINESS_TYPES,
  getBusinessTypeLabel,
  getClaudeFunnelCopy,
} from "@/lib/i18n/claude-funnel-copy";
import { type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/context";

const DEFAULT_WORKING_HOURS = {
  monday: "09:00-18:00",
  tuesday: "09:00-18:00",
  wednesday: "09:00-18:00",
  thursday: "09:00-18:00",
  friday: "09:00-18:00",
  saturday: "10:00-15:00",
  sunday: "closed",
};

type WizardStep = 1 | 2 | 3 | 4 | "building";
type MvpLanguage = "en" | "de" | "ru";

function buildQuestionnairePayload(name: string, email: string, businessType: string, language: MvpLanguage) {
  return {
    name,
    business_name: name,
    email,
    business_type: businessType,
    language,
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
    social_links: {
      instagram: "",
      facebook: "",
      tiktok: "",
      website: "",
    },
    business_questions: {},
  };
}

function ProgressDots({ step, building }: { step: WizardStep; building: boolean }) {
  const activeIndex = building ? 4 : step === 1 ? 0 : step === 2 ? 1 : step === 3 ? 2 : 3;

  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all duration-500 ${
            index === activeIndex
              ? "w-8 bg-gradient-to-r from-violet-500 to-cyan-400"
              : index < activeIndex
                ? "w-2 bg-violet-400/80"
                : "w-2 bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

function LanguageSwitcher({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  const options: Locale[] = ["en", "de", "ru"];

  return (
    <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {options.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors ${
            locale === code
              ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

export function ClaudeFunnelPage() {
  const router = useRouter();
  const { locale, setLocale } = useTranslation();
  const copy = getClaudeFunnelCopy(locale);

  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState<string>(FUNNEL_BUSINESS_TYPES[0]);
  const [mvpLanguage, setMvpLanguage] = useState<MvpLanguage>("en");
  const [error, setError] = useState<string | null>(null);
  const [buildPhase, setBuildPhase] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPoll(), [clearPoll]);

  useEffect(() => {
    if (step !== "building") {
      return;
    }
    const timer = setInterval(() => {
      setBuildPhase((current) => (current + 1) % copy.buildSteps.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [step, copy.buildSteps.length]);

  async function pollUntilReady() {
    return new Promise<boolean>((resolve) => {
      const check = async () => {
        try {
          const response = await fetch("/api/client-delivery-v2/status");
          if (!response.ok) {
            return;
          }
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

  async function handleGenerate() {
    if (!name.trim() || !email.trim()) {
      setError(copy.errorRequired);
      return;
    }

    setError(null);
    setStep("building");
    setBuildPhase(0);

    try {
      const payload = buildQuestionnairePayload(name.trim(), email.trim(), businessType, mvpLanguage);

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
      if (ready) {
        router.push("/client-preview/latest");
      } else {
        throw new Error(copy.errorDelivery);
      }
    } catch (generateError) {
      clearPoll();
      setStep(4);
      setError(generateError instanceof Error ? generateError.message : copy.errorDelivery);
    }
  }

  function goNext() {
    setError(null);
    if (step === 1) {
      if (!name.trim() || !email.trim()) {
        setError(copy.errorRequired);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
    }
  }

  function goBack() {
    setError(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  }

  const stepLabels = [copy.stepContacts, copy.stepSector, copy.stepLanguage, copy.stepGenerate];

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#0a0a0f] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.18),transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 shadow-lg shadow-violet-500/30">
              <Factory className="size-5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white/90">{copy.brand}</span>
          </div>
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-8">
          <div className="mb-6 space-y-2 text-center">
            {copy.slogan.map((line) => (
              <p
                key={line}
                className="bg-gradient-to-r from-violet-200 via-white to-cyan-200 bg-clip-text text-lg font-medium text-transparent md:text-xl"
              >
                {line}
              </p>
            ))}
          </div>

          <div className="mb-6">
            <ProgressDots step={step} building={step === "building"} />
            {step !== "building" ? (
              <p className="mt-3 text-center text-xs uppercase tracking-widest text-white/50">
                {stepLabels[(step as number) - 1]}
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-4 duration-300">
              <div className="space-y-2">
                <label htmlFor="funnel-name" className="text-sm text-white/70">
                  {copy.nameLabel}
                </label>
                <input
                  id="funnel-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={copy.namePlaceholder}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="funnel-email" className="text-sm text-white/70">
                  {copy.emailLabel}
                </label>
                <input
                  id="funnel-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={copy.emailPlaceholder}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              <button
                type="button"
                onClick={goNext}
                className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:opacity-95"
              >
                {copy.next}
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-4 duration-300">
              <div className="space-y-2">
                <label htmlFor="funnel-sector" className="text-sm text-white/70">
                  {copy.sectorLabel}
                </label>
                <select
                  id="funnel-sector"
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="" disabled className="bg-[#1a1a24]">
                    {copy.sectorPlaceholder}
                  </option>
                  {FUNNEL_BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-[#1a1a24]">
                      {getBusinessTypeLabel(type, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="h-11 flex-1 rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white/80 transition hover:bg-white/10"
                >
                  {copy.back}
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="h-11 flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-violet-600/25"
                >
                  {copy.next}
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-4 duration-300">
              <p className="text-sm text-white/70">{copy.languageLabel}</p>
              <div className="grid gap-3">
                {(
                  [
                    { code: "en" as const, label: copy.languageEn },
                    { code: "de" as const, label: copy.languageDe },
                    { code: "ru" as const, label: copy.languageRu },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setMvpLanguage(option.code)}
                    className={`flex h-12 items-center justify-between rounded-xl border px-4 text-sm transition ${
                      mvpLanguage === option.code
                        ? "border-violet-400/60 bg-violet-500/20 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <span>{option.label}</span>
                    {mvpLanguage === option.code ? (
                      <Sparkles className="size-4 text-cyan-300" />
                    ) : null}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="h-11 flex-1 rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white/80"
                >
                  {copy.back}
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="h-11 flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-sm font-semibold text-white"
                >
                  {copy.next}
                </button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-5 duration-300">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <p>
                  <span className="text-white/50">{copy.nameLabel}:</span> {name}
                </p>
                <p>
                  <span className="text-white/50">{copy.emailLabel}:</span> {email}
                </p>
                <p>
                  <span className="text-white/50">{copy.sectorLabel}:</span>{" "}
                  {getBusinessTypeLabel(businessType, locale)}
                </p>
                <p>
                  <span className="text-white/50">{copy.languageLabel}:</span>{" "}
                  {mvpLanguage === "en"
                    ? copy.languageEn
                    : mvpLanguage === "de"
                      ? copy.languageDe
                      : copy.languageRu}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="h-11 flex-1 rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white/80"
                >
                  {copy.back}
                </button>
                <button
                  type="button"
                  onClick={() => void handleGenerate()}
                  className="h-11 flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-violet-600/30"
                >
                  {copy.generateMvp}
                </button>
              </div>
            </div>
          ) : null}

          {step === "building" ? (
            <div className="animate-in fade-in flex flex-col items-center gap-6 py-6 duration-500">
              <div className="relative flex size-20 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" />
                <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-br from-violet-600/40 to-cyan-500/40" />
                <Loader2 className="relative size-10 animate-spin text-cyan-300" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-lg font-semibold">{copy.buildingTitle}</p>
                <p className="text-sm text-white/50">{copy.buildingSubtitle}</p>
              </div>
              <div className="w-full space-y-2">
                {copy.buildSteps.map((label, index) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-500 ${
                      index === buildPhase
                        ? "bg-violet-500/20 text-white"
                        : index < buildPhase
                          ? "text-white/40 line-through"
                          : "text-white/30"
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full ${
                        index === buildPhase ? "bg-cyan-400 animate-pulse" : "bg-white/20"
                      }`}
                    />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
