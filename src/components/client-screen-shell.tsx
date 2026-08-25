"use client";

import { type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/context";

function UiLangSwitcher({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  const options: Locale[] = ["en", "de", "ru"];
  return (
    <div className="client-funnel-ui-lang" style={{ position: "static" }}>
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

export function ClientScreenShell({
  children,
  header,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
}) {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="client-funnel-root min-h-svh">
      <div className="relative flex min-h-svh flex-col">
        <div className="client-funnel-glow" />
        <div className="absolute top-4 right-4 z-20">
          <UiLangSwitcher locale={locale} onChange={setLocale} />
        </div>
        {header}
        <div className="relative z-10 flex-1">{children}</div>
      </div>
    </div>
  );
}
