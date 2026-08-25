import type { UiLang } from "@/client-wizard/copy";

export const payTranslations = {
  ru: {
    payButton: "Выбрать тариф",
    paySubline: "€199 / месяц · Сайт + CRM + Бронирование",
    demoInfo: "⏰ Демо CRM Demo активно 48 часов. Выберите тариф, чтобы продолжить.",
  },
  de: {
    payButton: "Plan wählen",
    paySubline: "€199 / Monat · Website + CRM + Buchung",
    demoInfo: "⏰ Ihr CRM Demo ist 48 Stunden aktiv. Wählen Sie einen Plan, um fortzufahren.",
  },
  en: {
    payButton: "Choose plan",
    paySubline: "€199 / month · Website + CRM + Booking",
    demoInfo: "⏰ Your CRM Demo is active for 48 hours. Choose a plan to continue.",
  },
} as const satisfies Record<UiLang, { payButton: string; paySubline: string; demoInfo: string }>;

export function getPayTranslations(lang: UiLang) {
  return payTranslations[lang] ?? payTranslations.en;
}
