"use client";

import { LOCALES, type Locale } from "@/lib/i18n/config";
import { useAdminI18n } from "@/components/admin/admin-i18n";

const LABELS: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  ru: "RU",
};

export function AdminLangSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, copy } = useAdminI18n();

  return (
    <div
      className={`admin-lang ${className}`}
      role="group"
      aria-label={copy.langSwitch}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`admin-lang-btn ${locale === code ? "active" : ""}`}
          onClick={() => setLocale(code)}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
