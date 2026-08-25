"use client";

import Link from "next/link";

import { LOCALES, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/context";

const COPY: Record<
  Locale,
  {
    headline: string;
    benefits: [string, string, string];
    cta: string;
  }
> = {
  ru: {
    headline: "Персональная CRM-система",
    benefits: ["Без кода", "Без разработчиков", "Результат за 1 минуту"],
    cta: "Выбери нишу — получи MVP →",
  },
  de: {
    headline: "Persönliches CRM-System",
    benefits: ["Ohne Code", "Ohne Entwickler", "Ergebnis in 1 Minute"],
    cta: "Wähle deine Nische — erhalte MVP →",
  },
  en: {
    headline: "Personal CRM system",
    benefits: ["No code", "No developers", "Result in 1 minute"],
    cta: "Choose your niche — get MVP →",
  },
};

function LandingLanguageSwitcher({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-black/80 p-1 backdrop-blur-sm"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
            locale === code
              ? "bg-orange-500 text-black"
              : "text-orange-200/70 hover:text-orange-400"
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function LandingPage() {
  const { locale, setLocale, ready } = useTranslation();
  const activeLocale = ready ? locale : "ru";
  const copy = COPY[activeLocale];

  return (
    <main className="relative min-h-svh bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(249,115,22,0.18)_0%,_transparent_55%)]" />

      <header className="absolute right-0 top-0 z-10 p-4 sm:p-6">
        <LandingLanguageSwitcher locale={activeLocale} onChange={setLocale} />
      </header>

      <div className="relative mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400">
          <span aria-hidden className="text-lg">
            ⚡
          </span>
          MVP Factory
        </div>

        <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          {copy.headline}
        </h1>

        <ul className="mt-10 flex w-full max-w-md flex-col gap-4 text-left sm:max-w-lg">
          {copy.benefits.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 px-5 py-4 text-lg font-semibold text-white sm:text-xl"
            >
              <span aria-hidden className="text-2xl">
                ✅
              </span>
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/client"
          className="mt-12 inline-flex w-full max-w-lg items-center justify-center rounded-2xl bg-orange-500 px-8 py-5 text-lg font-bold tracking-wide text-black shadow-lg shadow-orange-500/30 transition hover:bg-orange-400 hover:shadow-orange-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:text-xl"
        >
          {copy.cta}
        </Link>
      </div>
    </main>
  );
}
