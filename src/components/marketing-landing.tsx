"use client";

import Link from "next/link";
import { useState } from "react";
import { POLAR_CHECKOUT_WEBSTUDIO_199 } from "@/lib/polar/constants";

type Lang = "de" | "en" | "ru";

const COPY: Record<
  Lang,
  {
    heroTitle: string;
    heroSubtitle: string;
    heroCta: string;
    processEyebrow: string;
    processTitle: string;
    steps: { icon: string; title: string; description: string }[];
    featuresEyebrow: string;
    featuresTitle: string;
    features: string[];
    nichesEyebrow: string;
    nichesTitle: string;
    niches: { icon: string; label: string }[];
    priceEyebrow: string;
    priceTitle: string;
    priceAmount: string;
    priceNote: string;
    priceName: string;
    demoNote: string;
    priceCta: string;
  }
> = {
  de: {
    heroTitle: "Website + CRM + Buchung in 3 Minuten",
    heroSubtitle:
      "Fertiges Website + CRM + Buchung für Ihr Business. €199 / Monat — Website + CRM + Buchung.",
    heroCta: "Jetzt testen →",
    processEyebrow: "Prozess",
    processTitle: "So funktioniert's",
    steps: [
      {
        icon: "📝",
        title: "Fragebogen ausfüllen",
        description: "3 Fragen zu Ihrem Business",
      },
      {
        icon: "⚙️",
        title: "System erstellt Ihr Website + CRM + Buchung",
        description: "Automatisch für Ihre Branche",
      },
      {
        icon: "🚀",
        title: "Link erhalten — Ihr Website + CRM + Buchung ist online",
        description: "Eindeutige URL",
      },
    ],
    featuresEyebrow: "Leistungen",
    featuresTitle: "Was ist in Website + CRM + Buchung enthalten",
    features: [
      "Business-Verwaltungspanel",
      "Kunden, Termine, Leistungen",
      "Galerie mit Fotos Ihrer Branche",
      "Sprachumschaltung EN/DE/RU",
      "Eindeutige URL",
    ],
    nichesEyebrow: "Branchen",
    nichesTitle: "Branchen",
    niches: [
      { icon: "💇", label: "Friseursalon" },
      { icon: "🍽️", label: "Restaurant" },
      { icon: "💪", label: "Fitness" },
      { icon: "🦷", label: "Zahnarztpraxis" },
      { icon: "💆", label: "Massage" },
      { icon: "🚗", label: "Autowerkstatt" },
      { icon: "🏨", label: "Hotel" },
      { icon: "📚", label: "Bildung" },
      { icon: "🚛", label: "Logistik" },
      { icon: "🛒", label: "Online-Shop" },
      { icon: "💻", label: "Technologie" },
    ],
    priceEyebrow: "Preis",
    priceTitle: "Preis",
    priceAmount: "€199",
    priceNote: "/ Monat",
    priceName: "Website + CRM + Buchung",
    demoNote: "Demo 48 Stunden kostenlos",
    priceCta: "Jetzt testen →",
  },
  en: {
    heroTitle: "Website + CRM + Booking in 3 minutes",
    heroSubtitle:
      "Ready-made Website + CRM + Booking for your business. €199 / month — Website + CRM + Booking.",
    heroCta: "Try now →",
    processEyebrow: "Process",
    processTitle: "How it works",
    steps: [
      {
        icon: "📝",
        title: "Fill out the questionnaire",
        description: "3 questions about your business",
      },
      {
        icon: "⚙️",
        title: "The system builds your Website + CRM + Booking",
        description: "Automatically tailored to your niche",
      },
      {
        icon: "🚀",
        title: "Get a link — your Website + CRM + Booking is live",
        description: "Unique URL",
      },
    ],
    featuresEyebrow: "Features",
    featuresTitle: "What's included in Website + CRM + Booking",
    features: [
      "Business management panel",
      "Clients, appointments, services",
      "Gallery with photos for your niche",
      "Language switch EN/DE/RU",
      "Unique URL",
    ],
    nichesEyebrow: "Industries",
    nichesTitle: "Industries",
    niches: [
      { icon: "💇", label: "Beauty salon" },
      { icon: "🍽️", label: "Restaurant" },
      { icon: "💪", label: "Fitness" },
      { icon: "🦷", label: "Dental clinic" },
      { icon: "💆", label: "Massage" },
      { icon: "🚗", label: "Car service" },
      { icon: "🏨", label: "Hotel" },
      { icon: "📚", label: "Education" },
      { icon: "🚛", label: "Logistics" },
      { icon: "🛒", label: "E-commerce" },
      { icon: "💻", label: "Technology" },
    ],
    priceEyebrow: "Pricing",
    priceTitle: "Pricing",
    priceAmount: "€199",
    priceNote: "/ month",
    priceName: "Website + CRM + Booking",
    demoNote: "Free demo for 48 hours",
    priceCta: "Try now →",
  },
  ru: {
    heroTitle: "Сайт + CRM + Бронирование за 3 минуты",
    heroSubtitle:
      "Готовый Сайт + CRM + Бронирование для вашего бизнеса. €199 / месяц — Сайт + CRM + Бронирование.",
    heroCta: "Попробовать →",
    processEyebrow: "Процесс",
    processTitle: "Как работает",
    steps: [
      {
        icon: "📝",
        title: "Заполните анкету",
        description: "3 вопроса о вашем бизнесе",
      },
      {
        icon: "⚙️",
        title: "Система собирает ваш Сайт + CRM + Бронирование",
        description: "Автоматически под вашу нишу",
      },
      {
        icon: "🚀",
        title: "Получаете ссылку — ваш Сайт + CRM + Бронирование уже онлайн",
        description: "Уникальный URL",
      },
    ],
    featuresEyebrow: "Возможности",
    featuresTitle: "Что входит в Сайт + CRM + Бронирование",
    features: [
      "Панель управления бизнесом",
      "Клиенты, записи, услуги",
      "Галерея с фото вашей ниши",
      "Переключение языков EN/DE/RU",
      "Уникальный URL",
    ],
    nichesEyebrow: "Ниши",
    nichesTitle: "Ниши",
    niches: [
      { icon: "💇", label: "Салон красоты" },
      { icon: "🍽️", label: "Ресторан" },
      { icon: "💪", label: "Фитнес" },
      { icon: "🦷", label: "Стоматология" },
      { icon: "💆", label: "Массаж" },
      { icon: "🚗", label: "Автосервис" },
      { icon: "🏨", label: "Отель" },
      { icon: "📚", label: "Образование" },
      { icon: "🚛", label: "Логистика" },
      { icon: "🛒", label: "Интернет-магазин" },
      { icon: "💻", label: "Технологии" },
    ],
    priceEyebrow: "Цена",
    priceTitle: "Цена",
    priceAmount: "€199",
    priceNote: "/ месяц",
    priceName: "Сайт + CRM + Бронирование",
    demoNote: "Демо бесплатно 48 часов",
    priceCta: "Попробовать →",
  },
};

const LANGS: Lang[] = ["en", "de", "ru"];

function SectionTitle({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {children}
      </h2>
    </div>
  );
}

function CtaButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-8 py-4 text-lg font-bold text-slate-900 shadow-lg shadow-amber-500/30 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 sm:px-10 sm:py-5 sm:text-xl"
    >
      {children}
    </Link>
  );
}

function LanguageSwitcher({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (lang: Lang) => void;
}) {
  return (
    <div
      className="fixed right-4 top-4 z-50 flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2 py-1.5 text-sm font-semibold backdrop-blur-sm sm:right-6 sm:top-6"
      role="group"
      aria-label="Language"
    >
      {LANGS.map((code, index) => (
        <span key={code} className="flex items-center">
          {index > 0 ? <span className="mx-1 text-white/40">|</span> : null}
          <button
            type="button"
            onClick={() => onChange(code)}
            className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition ${
              lang === code
                ? "bg-amber-500 text-slate-900"
                : "text-white/80 hover:text-white"
            }`}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  );
}

export function MarketingLanding() {
  const [lang, setLang] = useState<Lang>("de");
  const t = COPY[lang];

  return (
    <div className="min-h-svh bg-white text-slate-900">
      <LanguageSwitcher lang={lang} onChange={setLang} />

      <section
        className="relative flex min-h-[72vh] items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/og-image.png')" }}
      >
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">
            Web Studio IHOR KRIAZHEV München
          </p>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            {t.heroSubtitle}
          </p>
          <div className="mt-10">
            <CtaButton href={POLAR_CHECKOUT_WEBSTUDIO_199}>{t.heroCta}</CtaButton>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow={t.processEyebrow}>{t.processTitle}</SectionTitle>
          <ol className="mt-14 grid gap-8 sm:grid-cols-3">
            {t.steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-200/60 transition hover:shadow-xl"
              >
                <span aria-hidden className="text-5xl">
                  {step.icon}
                </span>
                <span className="mt-4 flex size-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <SectionTitle eyebrow={t.featuresEyebrow}>{t.featuresTitle}</SectionTitle>
          <ul className="mt-12 space-y-3">
            {t.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4 text-base font-medium text-slate-800 shadow-md shadow-slate-100 sm:text-lg"
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                >
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow={t.nichesEyebrow}>{t.nichesTitle}</SectionTitle>
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {t.niches.map((niche) => (
              <div
                key={niche.label}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center shadow-lg shadow-slate-200/60 transition hover:border-slate-300 hover:shadow-xl"
              >
                <span aria-hidden className="text-4xl">
                  {niche.icon}
                </span>
                <span className="text-sm font-semibold text-slate-800 sm:text-base">
                  {niche.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-lg px-6">
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/80">
            <SectionTitle eyebrow={t.priceEyebrow}>{t.priceTitle}</SectionTitle>
            <p className="mt-8 text-6xl font-extrabold tracking-tight text-slate-900">
              {t.priceAmount}
            </p>
            <p className="mt-2 text-lg font-medium text-slate-500">{t.priceNote}</p>
            <p className="mt-3 text-base font-semibold text-slate-800">{t.priceName}</p>
            <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-base font-semibold text-amber-900">
              {t.demoNote}
            </p>
            <div className="mt-10">
              <CtaButton href={POLAR_CHECKOUT_WEBSTUDIO_199}>{t.priceCta}</CtaButton>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-900 py-12 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
          <p>
            <span className="font-semibold text-white">Web Studio IHOR KRIAZHEV München</span>
            {" | München, Deutschland | "}
            <a
              href="mailto:list.uspeh2022@gmail.com"
              className="text-amber-400 underline-offset-4 hover:underline"
            >
              list.uspeh2022@gmail.com
            </a>
          </p>
          <nav className="flex flex-wrap gap-8">
            <Link
              href="/agb"
              className="text-slate-300 underline-offset-4 hover:text-white hover:underline"
            >
              AGB
            </Link>
            <Link
              href="/datenschutz"
              className="text-slate-300 underline-offset-4 hover:text-white hover:underline"
            >
              Datenschutz
            </Link>
            <Link
              href="/impressum"
              className="text-slate-300 underline-offset-4 hover:text-white hover:underline"
            >
              Impressum
            </Link>
            <Link
              href="/widerrufsbelehrung"
              className="text-slate-300 underline-offset-4 hover:text-white hover:underline"
            >
              Widerrufsbelehrung
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
