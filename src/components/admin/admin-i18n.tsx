"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ADMIN_LOCALE_STORAGE_KEY,
  getAdminCopy,
  type AdminCopy,
} from "@/lib/admin/i18n";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type Locale,
  isLocale,
} from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/context";

type AdminI18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  copy: AdminCopy;
  ready: boolean;
};

const AdminI18nContext = createContext<AdminI18nValue | null>(null);

function resolveAdminLocale(): Locale {
  const storedAdmin = window.localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
  if (storedAdmin && isLocale(storedAdmin)) return storedAdmin;
  const storedMain = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (storedMain && isLocale(storedMain)) return storedMain;
  return DEFAULT_LOCALE;
}

function persistAdminLocale(next: Locale) {
  window.localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, next);
  window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  document.documentElement.lang = next;
}

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const { setLocale: setMainLocale } = useTranslation();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = resolveAdminLocale();
    setLocaleState(next);
    persistAdminLocale(next);
    setMainLocale(next);
    setReady(true);
  }, [setMainLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      persistAdminLocale(next);
      setMainLocale(next);
    },
    [setMainLocale],
  );

  const copy = useMemo(() => getAdminCopy(ready ? locale : DEFAULT_LOCALE), [locale, ready]);

  const value = useMemo(
    () => ({ locale, setLocale, copy, ready }),
    [locale, setLocale, copy, ready],
  );

  return <AdminI18nContext.Provider value={value}>{children}</AdminI18nContext.Provider>;
}

export function useAdminI18n() {
  const ctx = useContext(AdminI18nContext);
  if (!ctx) {
    throw new Error("useAdminI18n must be used within AdminI18nProvider");
  }
  return ctx;
}
