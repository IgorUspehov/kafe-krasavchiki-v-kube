import type { UiLang } from "@/client-wizard/copy";

export const tierTranslations = {
  ru: {
    choosePlan: "Выберите план:",
    popular: "Популярный",
    comingSoon: "Скоро доступно",
    downloadZip: "Скачать ZIP",
    mvpDemo: {
      name: "Сайт + CRM + Бронирование",
      description: "€199 / месяц · Polar checkout",
    },
    mvpPro: {
      name: "Factory Website + CRM",
      description: "€499 · готовый live-сайт + ZIP на email",
    },
    crmFull: {
      name: "Индивидуальный Website + CRM",
      description: "€999 · переход в Factory для индивидуальной сборки",
      contact: "Перейти в Factory · €999",
    },
  },
  de: {
    choosePlan: "Plan wählen:",
    popular: "Beliebt",
    comingSoon: "Bald verfügbar",
    downloadZip: "ZIP herunterladen",
    mvpDemo: {
      name: "Website + CRM + Buchung",
      description: "€199 / Monat · Polar-Checkout",
    },
    mvpPro: {
      name: "Factory Website + CRM",
      description: "€499 · fertige Live-Website + ZIP per E-Mail",
    },
    crmFull: {
      name: "Individuelle Website + CRM",
      description: "€999 · weiter zu Factory für Einzelanfertigung",
      contact: "Weiter zu Factory · €999",
    },
  },
  en: {
    choosePlan: "Choose plan:",
    popular: "Popular",
    comingSoon: "Coming soon",
    downloadZip: "Download ZIP",
    mvpDemo: {
      name: "Website + CRM + Booking",
      description: "€199 / month · Polar checkout",
    },
    mvpPro: {
      name: "Factory Website + CRM",
      description: "€499 · ready live site + ZIP by email",
    },
    crmFull: {
      name: "Individual Website + CRM",
      description: "€999 · continue in Factory for a custom build",
      contact: "Continue to Factory · €999",
    },
  },
} as const satisfies Record<
  UiLang,
  {
    choosePlan: string;
    popular: string;
    comingSoon: string;
    downloadZip: string;
    mvpDemo: { name: string; description: string };
    mvpPro: { name: string; description: string };
    crmFull: { name: string; description: string; contact: string };
  }
>;

export function getTierTranslations(lang: UiLang) {
  return tierTranslations[lang] ?? tierTranslations.en;
}
