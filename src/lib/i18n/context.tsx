"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { LOCALE_BUNDLES } from "@/lib/i18n/bundles";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type Locale,
  isLocale,
} from "@/lib/i18n/config";
import { getNestedValue } from "@/lib/i18n/utils";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored && isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    setLocaleState(stored);
    document.documentElement.lang = stored;
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const activeLocale = ready ? locale : DEFAULT_LOCALE;
  const translations = LOCALE_BUNDLES[activeLocale];

  const t = useCallback(
    (key: string) => getNestedValue(translations, key),
    [translations]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return ctx;
}

export function translateStatus(
  t: (key: string) => string,
  status: string | null | undefined
): string {
  if (!status || status === "—") return "—";

  const key = `status.${status.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

export {
  translateFactoryStatus,
  translateLicenseType,
  translatePlanName,
  translateRuntimeModule,
} from "@/lib/i18n/dashboard-labels";
