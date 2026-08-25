"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/context";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  ru: "RU",
};

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      className="flex items-center gap-1 rounded-md border bg-background p-0.5"
      role="group"
      aria-label={t("lang.switch")}
    >
      <Languages className="ml-1.5 size-3.5 text-muted-foreground" />
      {LOCALES.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={locale === code ? "default" : "ghost"}
          className="h-7 min-w-9 px-2 text-xs font-semibold"
          onClick={() => setLocale(code)}
          title={t(`lang.${code}`)}
        >
          {LOCALE_LABELS[code]}
        </Button>
      ))}
    </div>
  );
}
