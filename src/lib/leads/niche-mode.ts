import type { LeadFormMode, LeadLang } from "@/lib/leads/types";
import {
  getSectorModel,
  getSectorModelByBusinessType,
  pickLocalized,
  type SectorModel,
} from "@/lib/niches/sector-models";

/**
 * Explicit sectorId / businessType → form mode.
 * No substring heuristics (e.g. includes("shop")).
 */
export function resolveLeadFormMode(
  businessTypeOrSector: string,
  sectorId?: string | null,
): LeadFormMode {
  if (sectorId) {
    const bySector = getSectorModel(sectorId);
    if (bySector) return bySector.mode;
  }
  const raw = String(businessTypeOrSector || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/_crm$/, "");
  const asSector = getSectorModel(raw);
  if (asSector) return asSector.mode;
  const byBt = getSectorModelByBusinessType(raw);
  if (byBt) return byBt.mode;
  return "inquiry";
}

export function resolveSectorModelForLead(
  businessType: string,
  sectorId?: string | null,
): SectorModel | null {
  if (sectorId) {
    const bySector = getSectorModel(sectorId);
    if (bySector) return bySector;
  }
  const raw = String(businessType || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/_crm$/, "");
  return getSectorModel(raw) || getSectorModelByBusinessType(raw);
}

export function normalizeLeadLang(value: string | null | undefined): LeadLang {
  const lang = (value || "de").toLowerCase();
  if (lang.startsWith("ru")) return "ru";
  if (lang.startsWith("en")) return "en";
  return "de";
}

export const leadFormCopy = {
  en: {
    appointmentCta: "Book now",
    orderCta: "Place order",
    reservationCta: "Reserve a table",
    inquiryCta: "Send inquiry",
    titleAppointment: "Book an appointment",
    titleOrder: "Place an order",
    titleReservation: "Make a reservation",
    titleInquiry: "Send an inquiry",
    name: "Name",
    phone: "Phone",
    service: "Service / Product",
    servicePlaceholder: "Select…",
    comment: "Comment",
    preferredAt: "Preferred date / time (optional)",
    preferredDate: "Preferred date (optional)",
    preferredTime: "Preferred time (optional)",
    submit: "Submit",
    sending: "Sending…",
    success: "Thank you! We received your request.",
    errorGeneric: "Could not send. Please try again.",
    errorNetwork: "Connection problem. Please try again.",
    errorRequired: "Name and phone are required.",
    errorPhone: "Please enter a valid phone number.",
    openCrm: "Open CRM",
    site: "Website",
  },
  de: {
    appointmentCta: "Termin buchen",
    orderCta: "Bestellung aufgeben",
    reservationCta: "Tisch reservieren",
    inquiryCta: "Anfrage senden",
    titleAppointment: "Termin buchen",
    titleOrder: "Bestellung aufgeben",
    titleReservation: "Reservierung",
    titleInquiry: "Anfrage senden",
    name: "Name",
    phone: "Telefon",
    service: "Leistung / Produkt",
    servicePlaceholder: "Auswählen…",
    comment: "Kommentar",
    preferredAt: "Wunschtermin (optional)",
    preferredDate: "Wunschdatum (optional)",
    preferredTime: "Wunschuhrzeit (optional)",
    submit: "Absenden",
    sending: "Senden…",
    success: "Danke! Wir haben Ihre Anfrage erhalten.",
    errorGeneric: "Senden fehlgeschlagen. Bitte erneut versuchen.",
    errorNetwork: "Verbindungsproblem. Bitte erneut versuchen.",
    errorRequired: "Name und Telefon sind erforderlich.",
    errorPhone: "Bitte gültige Telefonnummer eingeben.",
    openCrm: "CRM öffnen",
    site: "Website",
  },
  ru: {
    appointmentCta: "Записаться",
    orderCta: "Оформить заказ",
    reservationCta: "Забронировать столик",
    inquiryCta: "Оставить заявку",
    titleAppointment: "Записаться",
    titleOrder: "Оформить заказ",
    titleReservation: "Бронирование",
    titleInquiry: "Оставить заявку",
    name: "Имя",
    phone: "Телефон",
    service: "Услуга / Товар",
    servicePlaceholder: "Выберите…",
    comment: "Комментарий",
    preferredAt: "Предпочтительная дата/время (необязательно)",
    preferredDate: "Предпочтительная дата (необязательно)",
    preferredTime: "Предпочтительное время (необязательно)",
    submit: "Отправить",
    sending: "Отправка…",
    success: "Спасибо! Заявка получена.",
    errorGeneric: "Не удалось отправить. Попробуйте ещё раз.",
    errorNetwork: "Проблема со связью. Попробуйте ещё раз.",
    errorRequired: "Имя и телефон обязательны.",
    errorPhone: "Укажите корректный телефон.",
    openCrm: "Открыть CRM",
    site: "Сайт",
  },
} as const;

export function leadStatusLabel(language: LeadLang): string {
  if (language === "ru") return "Новая заявка";
  if (language === "de") return "Neuer Lead";
  return "New lead";
}

export function ctaForMode(
  mode: LeadFormMode,
  language: LeadLang,
  model?: SectorModel | null,
): string {
  if (model) return pickLocalized(model.publicCta, language);
  const t = leadFormCopy[language];
  if (mode === "appointment") return t.appointmentCta;
  if (mode === "order") return t.orderCta;
  if (mode === "reservation") return t.reservationCta;
  return t.inquiryCta;
}

export function titleForMode(
  mode: LeadFormMode,
  language: LeadLang,
  model?: SectorModel | null,
): string {
  if (model) {
    // Title mirrors CTA intent for niche-specific flows.
    return pickLocalized(model.publicCta, language);
  }
  const t = leadFormCopy[language];
  if (mode === "appointment") return t.titleAppointment;
  if (mode === "order") return t.titleOrder;
  if (mode === "reservation") return t.titleReservation;
  return t.titleInquiry;
}
