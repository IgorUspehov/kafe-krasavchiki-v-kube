"use client";

declare global {
  interface Window {
    Paddle: any;
  }
}

import { useSearchParams } from "next/navigation";
import { useState } from "react";

const PROMO_CODE = "serafim01";

type PayLang = "en" | "de" | "ru";

const translations = {
  de: {
    demoReady: "Ihr Website + CRM + Buchung ist fertig!",
    promoButton: "Promo-Code",
    payButton: "Plan wählen",
    paySubline: "€199 / Monat — Website + CRM + Buchung",
    freeButton: "Kostenlos erhalten →",
    redirecting: "Weiterleitung…",
    missingParams: "Geben Sie demo_url, email und name in der URL an.",
    missingDemoUrl: "Fügen Sie den Parameter demo_url zur URL hinzu, um die Vorschau zu sehen.",
    example: "Beispiel: /pay?demo_url=https://example.com&email=anna@example.com&name=Anna",
    promoPlaceholder: "Promo-Code (optional)",
    promoInvalid: "Ungültiger Promo-Code",
  },
  en: {
    demoReady: "Your Website + CRM + Booking is ready!",
    promoButton: "Promo code",
    payButton: "Choose plan",
    paySubline: "€199 / month — Website + CRM + Booking",
    freeButton: "Get for free →",
    redirecting: "Redirecting…",
    missingParams: "Add demo_url, email and name to the URL.",
    missingDemoUrl: "Add the demo_url parameter to the link to see the preview.",
    example: "Example: /pay?demo_url=https://example.com&email=anna@example.com&name=Anna",
    promoPlaceholder: "Promo code (optional)",
    promoInvalid: "Invalid promo code",
  },
  ru: {
    demoReady: "Ваш Сайт + CRM + Бронирование готов!",
    promoButton: "Промокод",
    payButton: "Выбрать тариф",
    paySubline: "€199 / месяц — Сайт + CRM + Бронирование",
    freeButton: "Получить бесплатно →",
    redirecting: "Перенаправляем…",
    missingParams: "Укажите demo_url, email и name в ссылке.",
    missingDemoUrl: "Добавьте параметр demo_url в ссылку, чтобы увидеть превью.",
    example: "Пример: /pay?demo_url=https://example.com&email=anna@example.com&name=Anna",
    promoPlaceholder: "Промо-код (необязательно)",
    promoInvalid: "Неверный промо-код",
  },
} as const;

const actionButtonClass =
  "inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function LanguageSwitcher({
  lang,
  onChange,
}: {
  lang: PayLang;
  onChange: (lang: PayLang) => void;
}) {
  return (
    <div
      className="fixed right-4 top-4 z-50 flex items-center rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-sm sm:right-6 sm:top-6"
      role="group"
      aria-label="Language"
    >
      {(["en", "de", "ru"] as PayLang[]).map((code, index) => (
        <span key={code} className="flex items-center">
          {index > 0 ? <span className="mx-2 text-slate-400">|</span> : null}
          <button
            type="button"
            onClick={() => onChange(code)}
            className={`uppercase tracking-wide transition ${
              lang === code ? "text-violet-600" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  );
}

export function PayPageContent() {
  const searchParams = useSearchParams();
  const demoUrl = searchParams?.get("demo_url")?.trim() ?? "";
  const email = searchParams?.get("email")?.trim() ?? "";
  const name = searchParams?.get("name")?.trim() ?? "";
  const clientId = searchParams?.get("client_id")?.trim() ?? "";

  const [lang, setLang] = useState<PayLang>("de");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [showPromo, setShowPromo] = useState(false);

  const t = translations[lang];
  const hasValidDemoUrl = isValidHttpUrl(demoUrl);
  const canCheckout = hasValidDemoUrl && email && name;
  const promoApplied = promoInput.trim().toLowerCase() === PROMO_CODE;

  function handlePay() {
    setLoading(true);
    setError(null);

    // Promo unlock: only needs a valid demo URL (banner → /pay?demo_url=…).
    if (promoApplied) {
      if (!hasValidDemoUrl) {
        setLoading(false);
        setError(t.missingDemoUrl);
        return;
      }
      void fetch("/api/redeem-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), clientId }),
      })
        .catch(() => undefined)
        .finally(() => {
          window.location.href = demoUrl;
        });
      return;
    }

    if (!canCheckout) {
      setLoading(false);
      setError(t.missingParams);
      return;
    }

    const params = new URLSearchParams();
    if (clientId) params.set("clientId", clientId);
    if (email) params.set("email", email);
    if (name) params.set("ownerName", name);
    if (demoUrl) params.set("demo_url", demoUrl);
    params.set("lang", lang);
    window.location.href = `/tariffs?${params.toString()}`;
  }

  return (
    <main className="min-h-svh bg-white text-slate-900">
      <LanguageSwitcher lang={lang} onChange={setLang} />

      <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {t.demoReady}
          </h1>
          {name ? (
            <p className="mt-3 text-lg text-slate-600">
              {name}
              {email ? ` · ${email}` : ""}
            </p>
          ) : null}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
          {hasValidDemoUrl ? (
            <iframe
              title="Demo preview"
              src={demoUrl}
              className="h-[420px] w-full border-0 bg-white sm:h-[520px]"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          ) : (
            <div className="px-6 py-16 text-center text-slate-600">{t.missingDemoUrl}</div>
          )}
        </div>

        <div className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowPromo((current) => !current)}
              className={actionButtonClass}
            >
              {t.promoButton}
            </button>
            <button
              type="button"
              onClick={() => handlePay()}
              disabled={loading || (!promoApplied && !canCheckout) || (promoApplied && !hasValidDemoUrl)}
              className={actionButtonClass}
            >
              {loading ? t.redirecting : promoApplied ? t.freeButton : t.payButton}
            </button>
          </div>
          {!promoApplied && !loading ? (
            <p className="mt-2 text-center text-sm text-slate-500">{t.paySubline}</p>
          ) : null}

          {showPromo ? (
            <div className="mt-3">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder={t.promoPlaceholder}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                  promoInput && !promoApplied
                    ? "border-red-300 focus:ring-red-200"
                    : promoApplied
                      ? "border-green-400 bg-green-50 text-green-800 focus:ring-green-200"
                      : "border-slate-200 focus:ring-violet-200"
                }`}
              />
              {promoInput && !promoApplied ? (
                <p className="mt-1 text-xs text-red-500">{t.promoInvalid}</p>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="mt-4 text-center text-sm font-medium text-red-600">{error}</p> : null}

          {!canCheckout && !error ? (
            <p className="mt-4 text-center text-sm text-slate-500">{t.example}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
