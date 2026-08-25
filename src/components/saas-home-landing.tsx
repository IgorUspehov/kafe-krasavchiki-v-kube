"use client";

import Link from "next/link";
import {
  Search,
  CalendarCheck,
  TrendingUp,
  Globe,
  Smartphone,
  Shield,
  Zap,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  CreditCard,
  Rocket,
  Users,
  ShoppingCart,
  Phone,
  Scissors,
  Dumbbell,
  Stethoscope,
  Heart,
  UtensilsCrossed,
  Coffee,
  Hotel,
  Car,
  CircleDot,
  Droplets,
  Building2,
  Scale,
  Calculator,
  GraduationCap,
  Truck,
  ShoppingBag,
  Monitor,
  Wrench,
} from "lucide-react";

import {
  LANGS,
  LANG_LABELS,
  translations,
  type Lang,
} from "@/lib/i18n/landing-copy";
import { useTranslation } from "@/lib/i18n/context";
import { LANDING_NICHE_SLUGS } from "@/lib/niche-sectors";

const NICHES_ICONS = [
  Scissors,
  Wrench,
  Heart,
  Dumbbell,
  Globe,
  Stethoscope,
  Shield,
  UtensilsCrossed,
  Coffee,
  Hotel,
  Car,
  CircleDot,
  Droplets,
  Building2,
  Scale,
  Calculator,
  GraduationCap,
  Truck,
  ShoppingBag,
  Monitor,
];

const NICHES_COLORS = [
  { color: "text-pink-500", bg: "bg-pink-50" },
  { color: "text-slate-600", bg: "bg-slate-50" },
  { color: "text-rose-500", bg: "bg-rose-50" },
  { color: "text-orange-500", bg: "bg-orange-50" },
  { color: "text-teal-500", bg: "bg-teal-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-blue-500", bg: "bg-blue-50" },
  { color: "text-amber-600", bg: "bg-amber-50" },
  { color: "text-yellow-700", bg: "bg-yellow-50" },
  { color: "text-violet-500", bg: "bg-violet-50" },
  { color: "text-gray-600", bg: "bg-gray-100" },
  { color: "text-zinc-600", bg: "bg-zinc-50" },
  { color: "text-sky-500", bg: "bg-sky-50" },
  { color: "text-emerald-600", bg: "bg-emerald-50" },
  { color: "text-indigo-600", bg: "bg-indigo-50" },
  { color: "text-green-600", bg: "bg-green-50" },
  { color: "text-purple-500", bg: "bg-purple-50" },
  { color: "text-orange-600", bg: "bg-orange-50" },
  { color: "text-red-500", bg: "bg-red-50" },
  { color: "text-blue-600", bg: "bg-blue-50" },
];

const HOW_ICONS = [ClipboardList, Zap, Eye, CreditCard];

const BENEFITS_ICONS = [Zap, Rocket, Smartphone, Shield, Globe, TrendingUp];

const STATS_ICONS = [Users, Phone, ShoppingCart];

const PROBLEM_ICONS = [Search, CalendarCheck, Eye, Users];

export function SaasHomeLanding() {
  const { locale, setLocale } = useTranslation();
  const lang = locale as Lang;
  const t = translations[lang] ?? translations.de;

  const niches = t.niches.map((label, i) => ({
    icon: NICHES_ICONS[i],
    label,
    slug: LANDING_NICHE_SLUGS[i] ?? null,
    color: NICHES_COLORS[i].color,
    bg: NICHES_COLORS[i].bg,
  }));

  return (
    <div className="bg-white font-sans text-[var(--color-fg,#0f172a)]">
      {/* Language switcher — bottom-right on mobile so it doesn't cover hero/problem text */}
      <div
        className="fixed right-3 bottom-20 z-50 flex gap-0.5 rounded-full border border-gray-200 bg-white/95 px-2 py-1 shadow-md backdrop-blur sm:top-4 sm:right-4 sm:bottom-auto sm:gap-1 sm:px-3 sm:py-1.5"
        role="group"
        aria-label={t.langLabel}
      >
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={`rounded-full px-2 py-1 text-xs font-semibold transition-all sm:px-2.5 sm:text-sm ${
              lang === l
                ? "bg-orange-500 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      {/* HERO */}
      <section className="relative flex min-h-svh flex-col overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        {/* decorative blobs */}
        <div className="absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 pt-16 pb-20 sm:py-16 lg:grid-cols-2 lg:py-24">
          {/* Left */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/20 px-4 py-1.5">
              <Zap className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-semibold tracking-widest text-orange-300 uppercase">
                {t.heroBadge}
              </span>
            </div>

            <h1 className="mb-4 text-6xl leading-tight font-black text-white lg:text-7xl">
              {t.heroTitle1}
              <br />
              <span className="text-orange-500">{t.heroTitle2}</span>
              <br />
              {t.heroTitle3}
            </h1>

            <p className="mb-3 text-xl font-medium text-gray-200 lg:text-2xl">
              {t.heroSubtitle}{" "}
              <span className="font-bold text-orange-400">
                {t.heroSubtitleHighlight}
              </span>
            </p>
            <p className="mb-8 text-base text-gray-300 lg:text-lg">{t.heroDescription}</p>

            {/* Price badge */}
            <div className="mb-8 inline-flex items-center gap-4 rounded-2xl bg-orange-500 px-6 py-4 shadow-xl shadow-orange-500/30">
              <div>
                <div className="text-sm font-semibold tracking-wider text-white/90 uppercase">
                  {t.priceMonthly}
                </div>
                <div className="text-5xl leading-none font-black text-white">
                  {t.priceValue}
                </div>
              </div>
              <div className="border-l border-white/30 pl-4">
                <div className="text-base font-semibold text-white">
                  {t.priceSiteCrm}
                </div>
                <div className="text-sm text-white/80">{t.priceConfigured}</div>
              </div>
            </div>

            <div className="flex justify-center">
              <Link
                href="/client"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-8 py-4 text-xl font-bold text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-105 hover:bg-orange-600 hover:shadow-orange-500/50 sm:w-auto"
              >
                <Rocket className="h-6 w-6" />
                {t.heroBtnPrimary}
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              {t.heroCheckmarks.map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 text-base text-gray-300"
                >
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — mock screen */}
          <div className="hidden justify-center lg:flex">
            <div className="relative w-full max-w-sm">
              {/* phone mockup */}
              <div className="rotate-1 rounded-[2.5rem] border border-gray-700 bg-gray-800 p-3 shadow-2xl">
                <div className="overflow-hidden rounded-[2rem] bg-white">
                  {/* status bar */}
                  <div className="bg-amber-400 px-5 py-3">
                    <div className="text-sm font-black text-gray-900">
                      {t.mockTitle}
                    </div>
                    <div className="text-xs text-gray-900/80">
                      {t.mockSubtitle}
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {t.mockStats.map(([v, l]) => (
                        <div
                          key={l}
                          className="rounded-xl bg-gray-50 p-3 text-center"
                        >
                          <div className="text-2xl font-black text-gray-900">
                            {v}
                          </div>
                          <div className="text-xs text-gray-600">{l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {t.mockEvents.map(([time, event, status]) => (
                        <div
                          key={time}
                          className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs"
                        >
                          <span className="w-10 text-gray-500">{time}</span>
                          <span className="flex-1 px-2 text-gray-800">
                            {event}
                          </span>
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* badges */}
              <div className="-left-8 top-16 absolute flex -rotate-3 items-center gap-1.5 rounded-2xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 shadow-xl">
                <Zap className="h-4 w-4 text-orange-500" />
                {t.heroSubtitleHighlight}
              </div>
              <div className="-right-6 bottom-24 absolute flex rotate-2 items-center gap-1.5 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-xl">
                <CheckCircle2 className="h-4 w-4" /> {t.ctaTitle1}
              </div>
            </div>
          </div>
        </div>

        {/* scroll indicator */}
        <div className="relative z-10 flex shrink-0 justify-center pb-8 pt-4">
          <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
            <span>{t.scrollDown}</span>
            <ChevronRight className="h-4 w-4 rotate-90" />
          </div>
        </div>
      </section>

      {/* NICHES */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-bold tracking-widest text-orange-500 uppercase">
              {t.nichesEyebrow}
            </p>
            <h2 className="text-4xl font-black text-gray-900 lg:text-5xl">
              {t.nichesTitle}
            </h2>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {niches.map(({ icon: Icon, label, slug, color, bg }) => (
              <Link
                key={label}
                href={slug ? `/client?niche=${slug}` : "/client"}
                className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${bg}`}
                >
                  <Icon className={`h-7 w-7 ${color}`} />
                </div>
                <span className="text-center text-sm leading-tight font-semibold text-gray-800 group-hover:text-gray-950 lg:text-base">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="bg-gray-950 py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="mb-3 text-sm font-bold tracking-widest text-orange-500 uppercase">
            {t.problemEyebrow}
          </p>
          <h2 className="mb-12 text-4xl font-black text-white lg:text-6xl">
            {t.problemTitle1}
            <br />
            <span className="text-orange-500">{t.problemTitle2}</span>
          </h2>

          <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.problems.map(({ text }, i) => {
              const Icon = PROBLEM_ICONS[i];
              return (
                <div
                  key={text}
                  className="flex flex-col items-start gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                    <Icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <p className="text-left text-base font-medium text-gray-200">
                    {text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-orange-500/20 bg-orange-500/10 p-6 sm:p-8">
            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-6">
              {t.stats.map(({ value, label }, i) => {
                const Icon = STATS_ICONS[i];
                return (
                  <div key={label} className="min-w-0 text-center">
                    <Icon className="mx-auto mb-1 h-6 w-6 text-orange-400" />
                    <div className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                      {value}
                    </div>
                    <div className="text-base text-gray-300">{label}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-2xl font-black text-white">
              {t.problemQuestion}{" "}
              <span className="text-orange-500">
                {t.problemQuestionHighlight}
              </span>
            </p>
            <p className="mt-2 text-base text-gray-300">{t.problemAnswer}</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-bold tracking-widest text-orange-500 uppercase">
              {t.howEyebrow}
            </p>
            <h2 className="text-4xl font-black text-gray-900 lg:text-5xl">
              {t.howTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-gray-600">{t.howSubtitle}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.howSteps.map(({ title, desc }, step) => {
              const Icon = HOW_ICONS[step];
              return (
                <div key={step} className="relative">
                  {step < 3 && (
                    <div className="absolute top-8 left-full z-0 hidden h-0.5 w-full bg-gradient-to-r from-orange-200 to-transparent lg:block" />
                  )}
                  <div className="group relative z-10 rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all duration-300 hover:border-orange-200 hover:shadow-lg">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 transition-transform duration-200 group-hover:scale-110">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-sm font-black text-white">
                      {step + 1}
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                    <p className="text-base text-gray-600">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/client"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-10 py-4 text-xl font-bold text-white shadow-lg shadow-orange-500/20 transition-all duration-200 hover:scale-105 hover:bg-orange-600"
            >
              <ClipboardList className="h-6 w-6" />
              {t.howBtn}
              <ChevronRight className="h-5 w-5" />
            </Link>
            <p className="mt-3 text-base text-gray-500">{t.howBtnHint}</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-bold tracking-widest text-orange-500 uppercase">
              {t.featuresEyebrow}
            </p>
            <h2 className="text-4xl font-black text-gray-900 lg:text-5xl">
              {t.featuresTitle}
            </h2>
          </div>

          <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
            {t.features.map((f) => (
              <div
                key={f}
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 transition-all duration-200 hover:border-orange-200 hover:shadow-sm"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                <span className="text-base font-medium text-gray-800">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS grid */}
      <section className="bg-gray-950 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-bold tracking-widest text-orange-500 uppercase">
              {t.benefitsEyebrow}
            </p>
            <h2 className="text-4xl font-black text-white lg:text-5xl">
              {t.benefitsTitle}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.benefits.map(({ title, desc }, i) => {
              const Icon = BENEFITS_ICONS[i];
              return (
                <div
                  key={title}
                  className="flex gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-all duration-300 hover:border-orange-500/30"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                    <Icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-bold text-white">{title}</h3>
                    <p className="text-base text-gray-300">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-lg px-6">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-bold tracking-widest text-orange-500 uppercase">
              {t.pricingEyebrow}
            </p>
            <h2 className="text-4xl font-black text-gray-900 lg:text-5xl">
              {t.pricingTitle}
            </h2>
          </div>

          <div className="overflow-hidden rounded-3xl bg-gray-950 shadow-2xl">
            <div className="relative bg-orange-500 px-8 pt-8 pb-12 text-center">
              <div className="mb-1 text-base font-semibold text-white/90">
                {t.pricingMonthly}
              </div>
              <div className="text-8xl leading-none font-black text-white">
                {t.priceValue}
              </div>
              <div className="mt-2 text-base text-white/80">
                {t.pricingPerMonth}
              </div>
              <div className="mt-3 text-base font-semibold text-white">
                {t.priceSiteCrm}
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border-4 border-orange-500 bg-gray-950 px-4 py-1.5 text-sm font-bold whitespace-nowrap text-orange-400">
                {t.pricingDemoFree}
              </div>
            </div>

            <div className="px-8 pt-10 pb-8">
              <div className="mb-8 space-y-3">
                {t.pricingItems.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" />
                    <span className="text-base text-gray-200">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/client"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-5 text-xl font-black text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-[1.02] hover:bg-orange-600"
              >
                <Rocket className="h-6 w-6" />
                {t.pricingBtn}
              </Link>
              <Link
                href="/tariffs"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-700 py-4 text-base font-bold text-gray-200 transition-all duration-200 hover:border-orange-500/50 hover:bg-gray-900 hover:text-white"
              >
                <CreditCard className="h-5 w-5" />
                {t.pricingPayBtn}
              </Link>
              <p className="mt-3 text-center text-sm text-gray-400">
                {t.pricingHint}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-orange-500 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-4xl font-black text-white lg:text-5xl">
            {t.ctaTitle1}
            <br />
            <span className="text-gray-900">{t.ctaTitle2}</span>
          </h2>
          <p className="mb-8 text-lg text-white/80">{t.ctaSubtitle}</p>
          <Link
            href="/client"
            className="inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-10 py-5 text-xl font-black text-white shadow-xl transition-all duration-200 hover:scale-105 hover:bg-gray-800"
          >
            <Rocket className="h-6 w-6 text-orange-400" />
            {t.ctaBtn}
            <ChevronRight className="h-5 w-5" />
          </Link>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/80">
            {t.ctaCheckmarks.map((text) => (
              <div key={text} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-white" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 bg-gray-950 py-8 pb-20 sm:pb-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-bold text-white">Web Studio IHOR KRIAZHEV München</span>
          </div>
          <p className="text-xs text-gray-500">{t.footerTagline}</p>
          <div className="flex gap-3 text-xs text-gray-500">
            {LANGS.map((l, i) => (
              <span key={l}>
                {LANG_LABELS[l]}
                {i < LANGS.length - 1 && <span> · </span>}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
