import type { Locale } from "@/lib/i18n/config";
import { getBusinessTypeDisplayName } from "@/lib/sector-mapping";

export type DeliveryStepStatusKey = "PENDING" | "RUNNING" | "PASS" | "FAIL";

export type QuestionnaireCopy = {
  loading: string;
  cardTitle: string;
  cardDescription: string;
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  telegram: string;
  whatsapp: string;
  language: string;
  deliveryMethod: string;
  saveQuestionnaire: string;
  saved: string;
  error: string;
  loadError: string;
  deliveryTitle: string;
  deliveryDescription: string;
  generateMvp: string;
  openDeliveryStatus: string;
  deliveryPass: string;
  deliveryFail: string;
  qualityGate: string;
  stepOnboarding: string;
  stepMvpAssembly: string;
  stepTemplateSelection: string;
  stepBuildOrchestrator: string;
  stepReactMvpBuild: string;
  stepV2Finalize: string;
  resultStatus: string;
  resultBusinessName: string;
  resultBusinessType: string;
  resultTemplateId: string;
  resultModules: string;
  downloadPackage: string;
  statuses: Record<DeliveryStepStatusKey, string>;
  languageOptions: Record<"ru" | "de" | "en", string>;
  messages: {
    saveFailed: string;
    saveFailedBeforeDelivery: string;
    deliveryFailed: string;
    savedTo: string;
  };
  businessTypes: Record<string, string>;
  deliveryMethods: Record<string, string>;
};

const COPY: Record<Locale, QuestionnaireCopy> = {
  en: {
    loading: "Loading questionnaire...",
    cardTitle: "Client Questionnaire V1",
    cardDescription:
      "Choose an industry, enter contacts, language, and delivery method. Saves to input/client_onboarding_questionnaire.json.",
    businessName: "Business Name",
    businessType: "Industry",
    email: "E-mail",
    phone: "Phone",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    language: "Language",
    deliveryMethod: "Delivery Method",
    saveQuestionnaire: "Save Questionnaire",
    saved: "Saved",
    error: "Error",
    loadError: "Could not load existing questionnaire.",
    deliveryTitle: "Client MVP Delivery",
    deliveryDescription: "Save the questionnaire, then run the V2 delivery pipeline.",
    generateMvp: "Create MVP",
    openDeliveryStatus: "Open Delivery Status",
    deliveryPass: "Pass",
    deliveryFail: "Fail",
    qualityGate: "Quality Gate",
    stepOnboarding: "Client Onboarding",
    stepMvpAssembly: "MVP Assembly",
    stepTemplateSelection: "Template Selection",
    stepBuildOrchestrator: "Build Orchestrator",
    stepReactMvpBuild: "React MVP Build",
    stepV2Finalize: "Finalize V2 & ZIP",
    resultStatus: "Status",
    resultBusinessName: "Business Name",
    resultBusinessType: "Business Type",
    resultTemplateId: "Template",
    resultModules: "Modules",
    downloadPackage: "Download final_package.zip",
    statuses: {
      PENDING: "Pending",
      RUNNING: "Running",
      PASS: "Pass",
      FAIL: "Fail",
    },
    languageOptions: {
      ru: "Russian",
      de: "German",
      en: "English",
    },
    messages: {
      saveFailed: "Save failed",
      saveFailedBeforeDelivery: "Save failed before delivery",
      deliveryFailed: "Delivery failed",
      savedTo: "Questionnaire saved to {path}",
    },
    businessTypes: {
      health_clinic: "Health Clinic",
      dental_clinic: "Dental Clinic",
      massage_salon: "Massage Salon",
      beauty_salon: "Beauty Salon",
      barbershop: "Barbershop",
      car_service: "Car Service",
      fitness_club: "Fitness Club",
      restaurant: "Restaurant / Cafe",
      real_estate: "Real Estate",
      education: "Education / Courses",
      ecommerce: "E-commerce",
      cleaning_service: "Cleaning Service",
    },
    deliveryMethods: {
      zip: "ZIP archive",
      netlify: "Live deploy link",
      github: "GitHub repository",
    },
  },
  de: {
    loading: "Fragebogen wird geladen...",
    cardTitle: "Kundenfragebogen V1",
    cardDescription:
      "Branche wählen, Kontakte, Sprache und Liefermethode angeben. Speichert in input/client_onboarding_questionnaire.json.",
    businessName: "Firmenname",
    businessType: "Branche",
    email: "E-Mail",
    phone: "Telefon",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    language: "Sprache",
    deliveryMethod: "Liefermethode",
    saveQuestionnaire: "Fragebogen speichern",
    saved: "Gespeichert",
    error: "Fehler",
    loadError: "Vorhandener Fragebogen konnte nicht geladen werden.",
    deliveryTitle: "Kunden-MVP-Lieferung",
    deliveryDescription: "Fragebogen speichern, dann die V2-Lieferpipeline starten.",
    generateMvp: "MVP erstellen",
    openDeliveryStatus: "Lieferstatus öffnen",
    deliveryPass: "Bestanden",
    deliveryFail: "Fehlgeschlagen",
    qualityGate: "Qualitätsprüfung",
    stepOnboarding: "Kunden-Onboarding",
    stepMvpAssembly: "MVP-Zusammenstellung",
    stepTemplateSelection: "Vorlagenauswahl",
    stepBuildOrchestrator: "Build-Orchestrierung",
    stepReactMvpBuild: "React-MVP-Erstellung",
    stepV2Finalize: "V2 abschließen & ZIP",
    resultStatus: "Status",
    resultBusinessName: "Firmenname",
    resultBusinessType: "Branche",
    resultTemplateId: "Vorlage",
    resultModules: "Module",
    downloadPackage: "final_package.zip herunterladen",
    statuses: {
      PENDING: "Ausstehend",
      RUNNING: "Läuft",
      PASS: "Bestanden",
      FAIL: "Fehlgeschlagen",
    },
    languageOptions: {
      ru: "Russisch",
      de: "Deutsch",
      en: "Englisch",
    },
    messages: {
      saveFailed: "Speichern fehlgeschlagen",
      saveFailedBeforeDelivery: "Speichern vor der Lieferung fehlgeschlagen",
      deliveryFailed: "Lieferung fehlgeschlagen",
      savedTo: "Fragebogen gespeichert unter {path}",
    },
    businessTypes: {
      health_clinic: "Gesundheitsklinik",
      dental_clinic: "Zahnklinik",
      massage_salon: "Massagesalon",
      beauty_salon: "Schönheitssalon",
      barbershop: "Friseur / Barbershop",
      car_service: "Autowerkstatt",
      fitness_club: "Fitnessclub",
      restaurant: "Restaurant / Café",
      real_estate: "Immobilien",
      education: "Bildung / Kurse",
      ecommerce: "Online-Shop",
      cleaning_service: "Reinigungsservice",
    },
    deliveryMethods: {
      zip: "ZIP-Archiv",
      netlify: "Live-Deploy-Link",
      github: "GitHub Repository",
    },
  },
  ru: {
    loading: "Загрузка опросника...",
    cardTitle: "Клиентский опросник V1",
    cardDescription:
      "Выберите сферу, укажите контакты, язык и способ получения. Сохраняется в input/client_onboarding_questionnaire.json.",
    businessName: "Название",
    businessType: "Сфера деятельности",
    email: "E-mail",
    phone: "Телефон",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    language: "Язык",
    deliveryMethod: "Способ получения",
    saveQuestionnaire: "Сохранить опросник",
    saved: "Сохранено",
    error: "Ошибка",
    loadError: "Не удалось загрузить существующий опросник.",
    deliveryTitle: "Доставка MVP клиенту",
    deliveryDescription: "Сохраните опросник, затем запустите доставку MVP (V2).",
    generateMvp: "Создать MVP",
    openDeliveryStatus: "Открыть статус доставки",
    deliveryPass: "Успешно",
    deliveryFail: "Ошибка",
    qualityGate: "Контроль качества",
    stepOnboarding: "Подключение клиента",
    stepMvpAssembly: "Сборка MVP",
    stepTemplateSelection: "Выбор шаблона",
    stepBuildOrchestrator: "Оркестратор сборки",
    stepReactMvpBuild: "Сборка React MVP",
    stepV2Finalize: "Финализация V2 и ZIP",
    resultStatus: "Статус",
    resultBusinessName: "Название",
    resultBusinessType: "Сфера",
    resultTemplateId: "Шаблон",
    resultModules: "Модули",
    downloadPackage: "Скачать final_package.zip",
    statuses: {
      PENDING: "Ожидание",
      RUNNING: "Выполняется",
      PASS: "Успешно",
      FAIL: "Ошибка",
    },
    languageOptions: {
      ru: "Русский",
      de: "Немецкий",
      en: "Английский",
    },
    messages: {
      saveFailed: "Не удалось сохранить",
      saveFailedBeforeDelivery: "Не удалось сохранить перед доставкой",
      deliveryFailed: "Доставка не удалась",
      savedTo: "Опросник сохранён в {path}",
    },
    businessTypes: {
      health_clinic: "Клиника здоровья",
      dental_clinic: "Стоматология",
      massage_salon: "Массажный салон",
      beauty_salon: "Салон красоты",
      barbershop: "Барбершоп",
      car_service: "Автосервис",
      fitness_club: "Фитнес-клуб",
      restaurant: "Ресторан / кафе",
      real_estate: "Недвижимость",
      education: "Образование / курсы",
      ecommerce: "Интернет-магазин",
      cleaning_service: "Клининг",
    },
    deliveryMethods: {
      zip: "ZIP-архив",
      netlify: "Ссылка на деплой",
      github: "GitHub репозиторий",
    },
  },
};

const DEFAULT_QUESTIONNAIRE_PATH = "input/client_onboarding_questionnaire.json";

export function getQuestionnaireCopy(locale: Locale): QuestionnaireCopy {
  return COPY[locale] ?? COPY.en;
}

export function formatQuestionnaireMessage(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

export function localizeBusinessType(
  slug: string | undefined,
  copy: QuestionnaireCopy,
): string {
  if (!slug) {
    return "";
  }
  return copy.businessTypes[slug] ?? getBusinessTypeDisplayName(slug);
}

export function localizeStepStatus(
  status: DeliveryStepStatusKey,
  copy: QuestionnaireCopy,
): string {
  return copy.statuses[status] ?? status;
}

export { DEFAULT_QUESTIONNAIRE_PATH };
