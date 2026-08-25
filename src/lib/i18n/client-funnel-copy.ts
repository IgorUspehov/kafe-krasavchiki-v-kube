import type { Locale } from "@/lib/i18n/config";
import type { DeliveryOptionKey } from "@/lib/client-preview/types";

export type ClientFunnelCopy = {
  s1_label: string;
  s1_h: string;
  s1_sub: string;
  lbl_name: string;
  ph_name: string;
  lbl_biz: string;
  ph_biz: string;
  lbl_email: string;
  s2_label: string;
  s2_h: string;
  s2_sub: string;
  s3_label: string;
  s3_h: string;
  s3_sub: string;
  btn_next: string;
  btn_back: string;
  btn_generate: string;
  btn_yes: string;
  btn_no: string;
  btn_restart: string;
  s4_h: string;
  build_steps: string[];
  s5_live: string;
  s5_q: string;
  s_manifest_h: string;
  s_manifest_sub: string;
  btn_continue_preview: string;
  s6_badge: string;
  s6_h: string;
  s6_dl: string;
  dl_domain: string;
  sectors: Array<{ id: string; icon: string; label: string }>;
  deliveryOptions: Record<DeliveryOptionKey, { label: string; description: string }>;
  optionAvailable: string;
  optionUnavailable: string;
  errorRequired: string;
  errorSave: string;
  errorDelivery: string;
};

const DELIVERY_EN: ClientFunnelCopy["deliveryOptions"] = {
  zip: { label: "ZIP", description: "final_package.zip" },
  netlify: { label: "Deploy link", description: "Live deploy link" },
  custom_domain: { label: "Domain", description: "Custom domain" },
  github: { label: "GitHub", description: "GitHub package" },
  apk: { label: "APK", description: "Mobile APK" },
  pwa: { label: "PWA", description: "Progressive Web App" },
  readme: { label: "README", description: "Documentation" },
  demo_mp4: { label: "demo.mp4", description: "Demo video" },
};

const DELIVERY_DE: ClientFunnelCopy["deliveryOptions"] = {
  zip: { label: "ZIP", description: "final_package.zip" },
  netlify: { label: "Deploy-Link", description: "Live-Deploy-Link" },
  custom_domain: { label: "Domain", description: "Eigene Domain" },
  github: { label: "GitHub", description: "GitHub-Paket" },
  apk: { label: "APK", description: "Mobile APK" },
  pwa: { label: "PWA", description: "Progressive Web App" },
  readme: { label: "README", description: "Dokumentation" },
  demo_mp4: { label: "demo.mp4", description: "Demo-Video" },
};

const DELIVERY_RU: ClientFunnelCopy["deliveryOptions"] = {
  zip: { label: "ZIP", description: "final_package.zip" },
  netlify: { label: "Ссылка на деплой", description: "Ссылка на деплой" },
  custom_domain: { label: "Свой домен", description: "Настройка домена" },
  github: { label: "GitHub", description: "Пакет GitHub" },
  apk: { label: "APK", description: "Мобильный APK" },
  pwa: { label: "PWA", description: "Progressive Web App" },
  readme: { label: "README", description: "Документация" },
  demo_mp4: { label: "demo.mp4", description: "Демо-видео" },
};

const COPY: Record<Locale, ClientFunnelCopy> = {
  en: {
    s1_label: "Step 1 of 3",
    s1_h: "Let's get started",
    s1_sub: "Tell us who you are and what your business is called.",
    lbl_name: "Your name",
    ph_name: "Anna Müller",
    lbl_biz: "Business name",
    ph_biz: "Berlin Barber Studio",
    lbl_email: "Email",
    s2_label: "Step 2 of 3",
    s2_h: "What does your business do?",
    s2_sub: "Choose the type that best describes your business.",
    s3_label: "Step 3 of 3",
    s3_h: "Platform language?",
    s3_sub: "The language your clients will use on the platform.",
    btn_next: "Continue",
    btn_back: "Back",
    btn_generate: "Generate MVP",
    btn_yes: "Yes, looks great",
    btn_no: "Regenerate",
    btn_restart: "Start over",
    s4_h: "Building your platform…",
    build_steps: [
      "Analysing your business",
      "Selecting platform modules",
      "Building interface",
      "Connecting services",
      "Preparing preview",
      "Packaging result",
    ],
    s5_live: "Live Preview",
    s5_q: "Do you like the result?",
    s_manifest_h: "Manifest preview",
    s_manifest_sub: "Review the generated MVP manifest before live preview.",
    btn_continue_preview: "Continue to Live Preview",
    s6_badge: "Platform Ready",
    s6_h: "Your MVP is ready",
    s6_dl: "Download your result",
    dl_domain: "Domain",
    sectors: [
      { id: "beauty", icon: "💈", label: "Beauty Salon / Barber" },
      { id: "dental", icon: "🏥", label: "Healthcare / Clinic" },
      { id: "tech", icon: "💻", label: "Technology / Platform" },
      { id: "shop", icon: "🛍️", label: "Retail / E-Commerce" },
      { id: "logistics", icon: "🚚", label: "Logistics / Delivery" },
      { id: "food", icon: "🍽️", label: "Restaurant / Café" },
      { id: "education", icon: "🎓", label: "Education / Courses" },
      { id: "fitness", icon: "💪", label: "Fitness / Wellness" },
      { id: "realestate", icon: "🏠", label: "Real Estate" },
    ],
    deliveryOptions: DELIVERY_EN,
    optionAvailable: "Ready",
    optionUnavailable: "Coming soon",
    errorRequired: "Please fill in all required fields",
    errorSave: "Could not save questionnaire",
    errorDelivery: "MVP generation failed",
  },
  de: {
    s1_label: "Schritt 1 von 3",
    s1_h: "Legen wir los",
    s1_sub: "Sagen Sie uns, wer Sie sind und wie Ihr Unternehmen heißt.",
    lbl_name: "Ihr Name",
    ph_name: "Anna Müller",
    lbl_biz: "Unternehmensname",
    ph_biz: "Berlin Barber Studio",
    lbl_email: "E-Mail",
    s2_label: "Schritt 2 von 3",
    s2_h: "Was macht Ihr Unternehmen?",
    s2_sub: "Wählen Sie den Typ, der Ihr Unternehmen am besten beschreibt.",
    s3_label: "Schritt 3 von 3",
    s3_h: "Plattformsprache?",
    s3_sub: "Die Sprache, die Ihre Kunden auf der Plattform verwenden.",
    btn_next: "Weiter",
    btn_back: "Zurück",
    btn_generate: "MVP generieren",
    btn_yes: "Ja, sieht gut aus",
    btn_no: "Neu generieren",
    btn_restart: "Von vorne",
    s4_h: "Ihre Plattform wird gebaut…",
    build_steps: [
      "Analyse Ihres Unternehmens",
      "Auswahl der Module",
      "Oberfläche wird gebaut",
      "Dienste werden verbunden",
      "Preview wird vorbereitet",
      "Ergebnis wird verpackt",
    ],
    s5_live: "Live-Vorschau",
    s5_q: "Gefällt Ihnen das Ergebnis?",
    s_manifest_h: "Manifest-Vorschau",
    s_manifest_sub: "Prüfen Sie das generierte MVP-Manifest vor der Live-Vorschau.",
    btn_continue_preview: "Weiter zur Live-Vorschau",
    s6_badge: "Plattform bereit",
    s6_h: "Ihr MVP ist fertig",
    s6_dl: "Ergebnis herunterladen",
    dl_domain: "Domain",
    sectors: [
      { id: "beauty", icon: "💈", label: "Salon / Barber" },
      { id: "dental", icon: "🏥", label: "Gesundheit / Klinik" },
      { id: "tech", icon: "💻", label: "Technologie / Plattform" },
      { id: "shop", icon: "🛍️", label: "Handel / E-Commerce" },
      { id: "logistics", icon: "🚚", label: "Logistik / Lieferung" },
      { id: "food", icon: "🍽️", label: "Restaurant / Café" },
      { id: "education", icon: "🎓", label: "Bildung / Kurse" },
      { id: "fitness", icon: "💪", label: "Fitness / Wellness" },
      { id: "realestate", icon: "🏠", label: "Immobilien" },
    ],
    deliveryOptions: DELIVERY_DE,
    optionAvailable: "Bereit",
    optionUnavailable: "Demnächst",
    errorRequired: "Bitte alle Pflichtfelder ausfüllen",
    errorSave: "Fragebogen konnte nicht gespeichert werden",
    errorDelivery: "MVP-Erstellung fehlgeschlagen",
  },
  ru: {
    s1_label: "Шаг 1 из 3",
    s1_h: "Начнём",
    s1_sub: "Расскажите, кто вы и как называется ваш бизнес.",
    lbl_name: "Ваше имя",
    ph_name: "Анна Мюллер",
    lbl_biz: "Название бизнеса",
    ph_biz: "Berlin Barber Studio",
    lbl_email: "Email",
    s2_label: "Шаг 2 из 3",
    s2_h: "Чем занимается ваш бизнес?",
    s2_sub: "Выберите тип, который лучше всего описывает ваш бизнес.",
    s3_label: "Шаг 3 из 3",
    s3_h: "Язык платформы?",
    s3_sub: "Язык, который ваши клиенты будут использовать на платформе.",
    btn_next: "Продолжить",
    btn_back: "Назад",
    btn_generate: "Создать MVP",
    btn_yes: "Да, отлично",
    btn_no: "Пересобрать",
    btn_restart: "Начать заново",
    s4_h: "Строим вашу платформу…",
    build_steps: [
      "Анализ бизнеса",
      "Выбор модулей",
      "Сборка интерфейса",
      "Подключение сервисов",
      "Подготовка preview",
      "Упаковка результата",
    ],
    s5_live: "Live Preview",
    s5_q: "Нравится результат?",
    s_manifest_h: "Manifest preview",
    s_manifest_sub: "Проверьте manifest MVP перед Live Preview.",
    btn_continue_preview: "Перейти к Live Preview",
    s6_badge: "Платформа готова",
    s6_h: "Ваш MVP готов",
    s6_dl: "Скачать результат",
    dl_domain: "Домен",
    sectors: [
      { id: "beauty", icon: "💈", label: "Салон / Barber" },
      { id: "dental", icon: "🏥", label: "Здоровье / Клиника" },
      { id: "tech", icon: "💻", label: "Технологии / Платформа" },
      { id: "shop", icon: "🛍️", label: "Розница / E-Commerce" },
      { id: "logistics", icon: "🚚", label: "Логистика / Доставка" },
      { id: "food", icon: "🍽️", label: "Ресторан / Кафе" },
      { id: "education", icon: "🎓", label: "Образование / Курсы" },
      { id: "fitness", icon: "💪", label: "Фитнес / Велнес" },
      { id: "realestate", icon: "🏠", label: "Недвижимость" },
    ],
    deliveryOptions: DELIVERY_RU,
    optionAvailable: "Готово",
    optionUnavailable: "Скоро",
    errorRequired: "Заполните все обязательные поля",
    errorSave: "Не удалось сохранить опросник",
    errorDelivery: "Ошибка генерации MVP",
  },
};

export function getClientFunnelCopy(locale: Locale): ClientFunnelCopy {
  return COPY[locale] ?? COPY.en;
}
