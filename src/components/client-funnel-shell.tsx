"use client";

import Link from "next/link";
import { Factory } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n/context";
import { getPreviewCopy } from "@/lib/i18n/preview-copy";

const FUNNEL_STEP_KEYS = [
  { key: "questionnaire" as const, href: "/client-questionnaire" },
  { key: "preview" as const, href: "/client-preview/latest" },
  { key: "result" as const, href: "/client-result/latest" },
];

export function ClientFunnelShell({
  title,
  description,
  activeStep,
  children,
}: {
  title: string;
  description?: string;
  activeStep?: (typeof FUNNEL_STEP_KEYS)[number]["key"];
  children: React.ReactNode;
}) {
  const { locale } = useTranslation();
  const copy = getPreviewCopy(locale);

  const stepLabels: Record<(typeof FUNNEL_STEP_KEYS)[number]["key"], string> = {
    questionnaire: copy.navQuestionnaire,
    preview: copy.navPreview,
    result: copy.navResult,
  };

  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-muted/20 to-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Factory className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">{copy.funnelBrand}</p>
              <p className="text-xs text-muted-foreground">{copy.funnelSubtitle}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3 md:px-6">
          {FUNNEL_STEP_KEYS.map((step) => {
            const active = step.key === activeStep;
            return (
              <Link
                key={step.key}
                href={step.href}
                className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {stepLabels[step.key]}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6 md:py-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
