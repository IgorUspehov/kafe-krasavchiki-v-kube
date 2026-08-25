export type TariffLang = "en" | "de" | "ru";

export function normalizeTariffLang(value: string | null | undefined): TariffLang {
  const lang = (value || "de").toLowerCase();
  if (lang.startsWith("ru")) return "ru";
  if (lang.startsWith("en")) return "en";
  return "de";
}

export const tariffCopy = {
  en: {
    title: "Choose your plan",
    subtitle: "Pick the option that fits your business. You can change language anytime.",
    back: "Back",
    popular: "Popular",
    crmDemo: {
      name: "Website + CRM + Booking",
      price: "€199",
      period: "/ month",
      description: "Live website + CRM + booking for your niche — continue with Polar checkout.",
      cta: "Pay €199 · Website + CRM + Booking",
      bullets: [
        "Working website + CRM for your niche",
        "Monthly access with booking",
        "Managed in this product (not Factory)",
      ],
    },
    factoryReady: {
      name: "Factory Website + CRM",
      price: "€499",
      period: "",
      description: "Ready live website + CRM, ZIP delivered by email via Factory Website+CRM.",
      cta: "Continue to Factory · €499",
      bullets: [
        "Ready live site + CRM",
        "ZIP by email",
        "Built in Factory Website+CRM",
      ],
    },
    factoryCustom: {
      name: "Individual Website + CRM",
      price: "€999",
      period: "",
      description: "Custom Website + CRM — continue in Factory Website+CRM for an individual build.",
      cta: "Continue to Factory · €999",
      bullets: [
        "Individual build in Factory",
        "Website + CRM tailored to you",
        "Handoff with your business data only",
      ],
    },
    bridgeNote:
      "Factory receives only business name, owner, niche, city, contacts, language, and client ID.",
    missingClient: "Open this page from your demo (client ID required).",
    loading: "Loading…",
  },
  de: {
    title: "Plan wählen",
    subtitle: "Wählen Sie die passende Option. Sprache jederzeit wechselbar.",
    back: "Zurück",
    popular: "Beliebt",
    crmDemo: {
      name: "Website + CRM + Buchung",
      price: "€199",
      period: "/ Monat",
      description: "Live-Website + CRM + Buchung für Ihre Nische — weiter zur Polar-Zahlung.",
      cta: "€199 zahlen · Website + CRM + Buchung",
      bullets: [
        "Funktionierende Website + CRM für Ihre Nische",
        "Monatlicher Zugang mit Buchung",
        "In diesem Produkt (nicht Factory)",
      ],
    },
    factoryReady: {
      name: "Factory Website + CRM",
      price: "€499",
      period: "",
      description: "Fertige Live-Website + CRM, ZIP per E-Mail über Factory Website+CRM.",
      cta: "Weiter zu Factory · €499",
      bullets: [
        "Fertige Live-Website + CRM",
        "ZIP per E-Mail",
        "Erstellt in Factory Website+CRM",
      ],
    },
    factoryCustom: {
      name: "Individuelle Website + CRM",
      price: "€999",
      period: "",
      description:
        "Individuelle Website + CRM — weiter in Factory Website+CRM zur Einzelanfertigung.",
      cta: "Weiter zu Factory · €999",
      bullets: [
        "Individuelle Erstellung in Factory",
        "Website + CRM nach Maß",
        "Übergabe nur mit Ihren Geschäftsdaten",
      ],
    },
    bridgeNote:
      "Factory erhält nur Firmenname, Inhaber, Nische, Stadt, Kontakte, Sprache und client ID.",
    missingClient: "Öffnen Sie diese Seite aus Ihrer Demo (client ID erforderlich).",
    loading: "Laden…",
  },
  ru: {
    title: "Выберите тариф",
    subtitle: "Выберите подходящий вариант. Язык можно сменить в любой момент.",
    back: "Назад",
    popular: "Популярный",
    crmDemo: {
      name: "Сайт + CRM + Бронирование",
      price: "€199",
      period: "/ месяц",
      description: "Живой сайт + CRM + бронирование под вашу нишу — далее оплата через Polar.",
      cta: "Оплатить €199 · Сайт + CRM + Бронирование",
      bullets: [
        "Рабочий сайт + CRM под нишу",
        "Ежемесячный доступ с бронированием",
        "В этом продукте (не Factory)",
      ],
    },
    factoryReady: {
      name: "Factory Website + CRM",
      price: "€499",
      period: "",
      description: "Готовый live-сайт + CRM, ZIP на email через Factory Website+CRM.",
      cta: "Перейти в Factory · €499",
      bullets: [
        "Готовый live-сайт + CRM",
        "ZIP на email",
        "Сборка в Factory Website+CRM",
      ],
    },
    factoryCustom: {
      name: "Индивидуальный Website + CRM",
      price: "€999",
      period: "",
      description:
        "Индивидуальный Website + CRM — переход в Factory Website+CRM для персональной сборки.",
      cta: "Перейти в Factory · €999",
      bullets: [
        "Индивидуальная сборка в Factory",
        "Сайт + CRM под вас",
        "Передача только бизнес-данных",
      ],
    },
    bridgeNote:
      "В Factory передаются только название, владелец, ниша, город, контакты, язык и client ID.",
    missingClient: "Откройте эту страницу из демо (нужен client ID).",
    loading: "Загрузка…",
  },
} as const;

export type TariffContext = {
  clientId: string;
  businessName?: string;
  ownerName?: string;
  niche?: string;
  city?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  language?: string;
  demoUrl?: string;
};
