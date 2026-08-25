export type FunnelUiLocale = "en" | "de" | "ru";

export type ClaudeFunnelCopy = {
  brand: string;
  slogan: [string, string, string];
  stepContacts: string;
  stepSector: string;
  stepLanguage: string;
  stepGenerate: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  sectorLabel: string;
  sectorPlaceholder: string;
  languageLabel: string;
  languageEn: string;
  languageDe: string;
  languageRu: string;
  next: string;
  back: string;
  generateMvp: string;
  buildingTitle: string;
  buildingSubtitle: string;
  buildSteps: string[];
  errorSave: string;
  errorDelivery: string;
  errorRequired: string;
};

const BUSINESS_TYPES_EN: Record<string, string> = {
  health_clinic: "Health Clinic",
  dental_clinic: "Dental Clinic",
  beauty_salon: "Beauty Salon",
  barbershop: "Barbershop",
  car_service: "Car Service",
  fitness_club: "Fitness Club",
  restaurant: "Restaurant / Cafe",
  real_estate: "Real Estate",
  education: "Education / Courses",
  ecommerce: "E-commerce",
  cleaning_service: "Cleaning Service",
};

const BUSINESS_TYPES_DE: Record<string, string> = {
  health_clinic: "Gesundheitsklinik",
  dental_clinic: "Zahnklinik",
  beauty_salon: "Schönheitssalon",
  barbershop: "Friseur / Barbershop",
  car_service: "Autowerkstatt",
  fitness_club: "Fitnessclub",
  restaurant: "Restaurant / Café",
  real_estate: "Immobilien",
  education: "Bildung / Kurse",
  ecommerce: "Online-Shop",
  cleaning_service: "Reinigungsservice",
};

const BUSINESS_TYPES_RU: Record<string, string> = {
  health_clinic: "Клиника здоровья",
  dental_clinic: "Стоматология",
  beauty_salon: "Салон красоты",
  barbershop: "Барбершоп",
  car_service: "Автосервис",
  fitness_club: "Фитнес-клуб",
  restaurant: "Ресторан / кафе",
  real_estate: "Недвижимость",
  education: "Образование / курсы",
  ecommerce: "Интернет-магазин",
  cleaning_service: "Клининг",
};

export const FUNNEL_BUSINESS_TYPES = [
  "health_clinic",
  "dental_clinic",
  "beauty_salon",
  "barbershop",
  "car_service",
  "fitness_club",
  "restaurant",
  "real_estate",
  "education",
  "ecommerce",
  "cleaning_service",
] as const;

export const COPY: Record<FunnelUiLocale, ClaudeFunnelCopy> = {
  en: {
    brand: "MVP Factory",
    slogan: ["Without code", "Without developers", "Without AI"],
    stepContacts: "Contacts",
    stepSector: "Business sector",
    stepLanguage: "Language",
    stepGenerate: "Generate MVP",
    nameLabel: "Your name",
    namePlaceholder: "John Smith",
    emailLabel: "Email",
    emailPlaceholder: "you@company.com",
    sectorLabel: "Business sector",
    sectorPlaceholder: "Select sector",
    languageLabel: "MVP language",
    languageEn: "English",
    languageDe: "Deutsch",
    languageRu: "Русский",
    next: "Continue",
    back: "Back",
    generateMvp: "Generate MVP",
    buildingTitle: "Building your MVP",
    buildingSubtitle: "Template selection, React build, packaging…",
    buildSteps: [
      "Saving questionnaire",
      "Running assembly pipeline",
      "Building React MVP",
      "Finalizing delivery package",
    ],
    errorSave: "Could not save questionnaire",
    errorDelivery: "MVP generation failed",
    errorRequired: "Please fill in all fields",
  },
  de: {
    brand: "MVP Factory",
    slogan: ["Ohne Code", "Ohne Entwickler", "Keine KI"],
    stepContacts: "Kontakte",
    stepSector: "Branche",
    stepLanguage: "Sprache",
    stepGenerate: "MVP erstellen",
    nameLabel: "Ihr Name",
    namePlaceholder: "Max Mustermann",
    emailLabel: "E-Mail",
    emailPlaceholder: "sie@firma.de",
    sectorLabel: "Branche",
    sectorPlaceholder: "Branche wählen",
    languageLabel: "MVP-Sprache",
    languageEn: "English",
    languageDe: "Deutsch",
    languageRu: "Русский",
    next: "Weiter",
    back: "Zurück",
    generateMvp: "MVP erstellen",
    buildingTitle: "MVP wird erstellt",
    buildingSubtitle: "Vorlage, React-Build, Paket…",
    buildSteps: [
      "Fragebogen speichern",
      "Assembly-Pipeline starten",
      "React MVP bauen",
      "Lieferpaket finalisieren",
    ],
    errorSave: "Fragebogen konnte nicht gespeichert werden",
    errorDelivery: "MVP-Erstellung fehlgeschlagen",
    errorRequired: "Bitte alle Felder ausfüllen",
  },
  ru: {
    brand: "MVP Factory",
    slogan: ["Без кода", "Без программиста", "Без ИИ"],
    stepContacts: "Контакты",
    stepSector: "Сфера бизнеса",
    stepLanguage: "Язык",
    stepGenerate: "Создать MVP",
    nameLabel: "Ваше имя",
    namePlaceholder: "Иван Иванов",
    emailLabel: "E-mail",
    emailPlaceholder: "you@company.com",
    sectorLabel: "Сфера бизнеса",
    sectorPlaceholder: "Выберите сферу",
    languageLabel: "Язык MVP",
    languageEn: "English",
    languageDe: "Deutsch",
    languageRu: "Русский",
    next: "Далее",
    back: "Назад",
    generateMvp: "Создать MVP",
    buildingTitle: "Создаём ваш MVP",
    buildingSubtitle: "Шаблон, React-сборка, упаковка…",
    buildSteps: [
      "Сохранение опросника",
      "Запуск assembly pipeline",
      "Сборка React MVP",
      "Финализация пакета",
    ],
    errorSave: "Не удалось сохранить опросник",
    errorDelivery: "Ошибка генерации MVP",
    errorRequired: "Заполните все поля",
  },
};

export function getBusinessTypeLabel(
  slug: string,
  uiLocale: FunnelUiLocale,
): string {
  const map =
    uiLocale === "de"
      ? BUSINESS_TYPES_DE
      : uiLocale === "ru"
        ? BUSINESS_TYPES_RU
        : BUSINESS_TYPES_EN;
  return map[slug] ?? slug;
}

export function getClaudeFunnelCopy(uiLocale: FunnelUiLocale): ClaudeFunnelCopy {
  return COPY[uiLocale] ?? COPY.en;
}
