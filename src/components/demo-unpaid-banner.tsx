"use client";

import { useEffect, useState } from "react";

type DemoUnpaidBannerProps = {
  clientId: string;
  checkoutUrl: string;
  /** Initial language from client manifest (overridden by CRM iframe postMessage). */
  language?: string;
};

const COPY = {
  en: {
    text: "Demo version. Choose a plan to continue.",
    cta: "Choose plan",
    promoCta: "Apply promo code",
  },
  de: {
    text: "Demo-Version. Wählen Sie einen Plan, um fortzufahren.",
    cta: "Plan wählen",
    promoCta: "Promo-Code einlösen",
  },
  ru: {
    text: "Демо-версия. Выберите тариф, чтобы продолжить.",
    cta: "Выбрать тариф",
    promoCta: "Применить промокод",
  },
} as const;

function normalizeLang(language: string | undefined): keyof typeof COPY {
  const lang = (language || "de").toLowerCase();
  if (lang.startsWith("ru")) return "ru";
  if (lang.startsWith("en")) return "en";
  return "de";
}

/** Top bar for unpaid CRM demos on /demo and /d routes. */
export function DemoUnpaidBanner({ clientId, checkoutUrl, language }: DemoUnpaidBannerProps) {
  const [lang, setLang] = useState(() => normalizeLang(language));
  const [promoHref, setPromoHref] = useState("/pay");
  const copy = COPY[lang];

  useEffect(() => {
    setLang(normalizeLang(language));
  }, [language]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeof window !== "undefined") {
      params.set("demo_url", window.location.href);
    }
    if (clientId) {
      params.set("client_id", clientId);
    }
    setPromoHref(`/pay?${params.toString()}`);
  }, [clientId]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: string }).type !== "crm-demo-language") return;
      const next = (data as { language?: string }).language;
      if (typeof next !== "string") return;
      setLang(normalizeLang(next));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0.75rem",
        padding: "0.65rem 1rem",
        background: "linear-gradient(90deg, #0f172a 0%, #1e3a5f 100%)",
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.9rem",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.35)",
      }}
    >
      <span style={{ textAlign: "center", maxWidth: "42rem" }}>{copy.text}</span>
      <a
        href={checkoutUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          background: "#22c55e",
          color: "#052e16",
          fontWeight: 700,
          textDecoration: "none",
          borderRadius: "999px",
          padding: "0.4rem 1rem",
          whiteSpace: "nowrap",
        }}
      >
        {copy.cta}
      </a>
      <a
        href={promoHref}
        style={{
          background: "#f8fafc",
          color: "#0f172a",
          fontWeight: 700,
          textDecoration: "none",
          borderRadius: "999px",
          padding: "0.4rem 1rem",
          whiteSpace: "nowrap",
        }}
      >
        {copy.promoCta}
      </a>
    </div>
  );
}
