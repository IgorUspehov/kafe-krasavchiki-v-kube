import type { Locale } from "@/lib/i18n/config";
import type { DeliveryOptionKey } from "@/lib/client-preview/types";

export type DeliveryOptionCopy = {
  label: string;
  description: string;
};

export type PreviewCopy = {
  loading: string;
  pageTitle: string;
  pageDescription: string;
  mvpReadyTitle: string;
  livePreview: string;
  previewUnavailable: string;
  likeQuestion: string;
  yes: string;
  no: string;
  backToQuestionnaire: string;
  backToPreview: string;
  resultTitle: string;
  resultDescription: string;
  availableOptions: string;
  optionUnavailable: string;
  optionAvailable: string;
  approvalRequired: string;
  openPreview: string;
  businessName: string;
  businessType: string;
  template: string;
  modules: string;
  funnelBrand: string;
  funnelSubtitle: string;
  navQuestionnaire: string;
  navPreview: string;
  navResult: string;
  deliveryOptions: Record<DeliveryOptionKey, DeliveryOptionCopy>;
  domainGuideTitle: string;
  domainGuideSubtitle: string;
  domainSteps: string[];
  domainNetlifyHint: string;
  domainBackToResult: string;
  artifactsSyncWarning: string;
  demoFlowQuestionnaireTitle: string;
  demoFlowSphereTitle: string;
  demoFlowManifestTitle: string;
  demoFlowLivePreviewTitle: string;
  demoFlowApprovalTitle: string;
  demoFlowEmail: string;
  demoFlowPhone: string;
  demoFlowLanguage: string;
  demoFlowCategory: string;
  demoFlowSelectedSphere: string;
  demoVideoNotSynced: string;
};

const DELIVERY_OPTIONS_EN: Record<DeliveryOptionKey, DeliveryOptionCopy> = {
  zip: { label: "ZIP", description: "final_package.zip" },
  netlify: { label: "Deploy link", description: "Live deploy link" },
  custom_domain: { label: "Custom domain", description: "Custom domain setup" },
  github: { label: "GitHub", description: "GitHub delivery package" },
  apk: { label: "APK", description: "Capacitor APK foundation" },
  pwa: { label: "PWA", description: "PWA module metadata" },
  readme: { label: "README", description: "Project README" },
  demo_mp4: { label: "demo.mp4", description: "Demo video" },
};

const DELIVERY_OPTIONS_DE: Record<DeliveryOptionKey, DeliveryOptionCopy> = {
  zip: { label: "ZIP", description: "final_package.zip" },
  netlify: { label: "Deploy-Link", description: "Live-Deploy-Link" },
  custom_domain: { label: "Eigene Domain", description: "Domain-Einrichtung" },
  github: { label: "GitHub", description: "GitHub-Lieferpaket" },
  apk: { label: "APK", description: "Capacitor-APK-Grundlage" },
  pwa: { label: "PWA", description: "PWA-Modul-Metadaten" },
  readme: { label: "README", description: "Projekt-README" },
  demo_mp4: { label: "demo.mp4", description: "Demo-Video" },
};

const DELIVERY_OPTIONS_RU: Record<DeliveryOptionKey, DeliveryOptionCopy> = {
  zip: { label: "ZIP", description: "final_package.zip" },
  netlify: { label: "Ссылка на деплой", description: "Ссылка на деплой" },
  custom_domain: { label: "Свой домен", description: "Настройка своего домена" },
  github: { label: "GitHub", description: "Пакет для GitHub" },
  apk: { label: "APK", description: "Основа Capacitor APK" },
  pwa: { label: "PWA", description: "Метаданные PWA-модуля" },
  readme: { label: "README", description: "README проекта" },
  demo_mp4: { label: "demo.mp4", description: "Демо-видео" },
};

const COPY: Record<Locale, PreviewCopy> = {
  ru: {
    loading: "Загрузка…",
    pageTitle: "Live Preview",
    pageDescription: "Просмотрите MVP перед получением артефактов",
    mvpReadyTitle: "Ваш MVP готов",
    livePreview: "Live Preview",
    previewUnavailable: "Preview недоступен: dist не найден. Запустите сборку react_mvp.",
    likeQuestion: "Нравится результат?",
    yes: "ДА",
    no: "НЕТ",
    backToQuestionnaire: "Вернуться к опроснику",
    backToPreview: "Назад к Preview",
    resultTitle: "Ваш MVP готов",
    resultDescription: "Выберите способ получения результата",
    availableOptions: "Доступные варианты",
    optionUnavailable: "Пока недоступно",
    optionAvailable: "Доступно",
    approvalRequired: "Сначала подтвердите preview на экране Live Preview",
    openPreview: "Открыть Live Preview",
    businessName: "Название",
    businessType: "Сфера",
    template: "Шаблон",
    modules: "Модули",
    funnelBrand: "SAAS IDEA AI MVP FACTORY",
    funnelSubtitle: "Клиентский funnel",
    navQuestionnaire: "Опросник",
    navPreview: "Live Preview",
    navResult: "Результат",
    deliveryOptions: DELIVERY_OPTIONS_RU,
    domainGuideTitle: "Подключение своего домена",
    domainGuideSubtitle: "Следуйте шагам, чтобы привязать домен к вашему MVP",
    domainSteps: [
      "Купите домен у регистратора",
      "Откройте панель DNS вашего домена",
      "Добавьте DNS-записи (CNAME www + A @)",
      "Дождитесь проверки DNS и активации SSL",
    ],
    domainNetlifyHint: "Ваш сайт:",
    domainBackToResult: "Назад к результату",
    artifactsSyncWarning: "Артефакты не синхронизированы",
    demoFlowQuestionnaireTitle: "1. Опросник",
    demoFlowSphereTitle: "2. Сфера деятельности",
    demoFlowManifestTitle: "3. Manifest preview",
    demoFlowLivePreviewTitle: "4. Live Preview",
    demoFlowApprovalTitle: "5. Подтверждение",
    demoFlowEmail: "Email",
    demoFlowPhone: "Телефон",
    demoFlowLanguage: "Язык",
    demoFlowCategory: "Категория",
    demoFlowSelectedSphere: "Выбранная сфера",
    demoVideoNotSynced: "Demo video not synced",
  },
  de: {
    loading: "Wird geladen…",
    pageTitle: "Live Preview",
    pageDescription: "MVP vor dem Download ansehen",
    mvpReadyTitle: "Ihr MVP ist bereit",
    livePreview: "Live Preview",
    previewUnavailable: "Preview nicht verfügbar: dist fehlt.",
    likeQuestion: "Gefällt Ihnen das Ergebnis?",
    yes: "JA",
    no: "NEIN",
    backToQuestionnaire: "Zurück zum Fragebogen",
    backToPreview: "Zurück zur Preview",
    resultTitle: "Ihr MVP ist bereit",
    resultDescription: "Wählen Sie die Lieferoption",
    availableOptions: "Verfügbare Optionen",
    optionUnavailable: "Noch nicht verfügbar",
    optionAvailable: "Verfügbar",
    approvalRequired: "Bitte bestätigen Sie zuerst die Live Preview",
    openPreview: "Live Preview öffnen",
    businessName: "Firmenname",
    businessType: "Branche",
    template: "Vorlage",
    modules: "Module",
    funnelBrand: "SAAS IDEA AI MVP FACTORY",
    funnelSubtitle: "Kunden-Funnel",
    navQuestionnaire: "Fragebogen",
    navPreview: "Live Preview",
    navResult: "Ergebnis",
    deliveryOptions: DELIVERY_OPTIONS_DE,
    domainGuideTitle: "Eigene Domain verbinden",
    domainGuideSubtitle: "Folgen Sie diesen Schritten, um Ihre Domain mit dem MVP zu verbinden",
    domainSteps: [
      "Domain beim Registrar kaufen",
      "DNS-Panel Ihrer Domain öffnen",
      "DNS-Einträge hinzufügen (CNAME www + A @)",
      "Auf DNS-Prüfung und SSL-Aktivierung warten",
    ],
    domainNetlifyHint: "Ihre Website:",
    domainBackToResult: "Zurück zum Ergebnis",
    artifactsSyncWarning: "Artefakte sind nicht synchron",
    demoFlowQuestionnaireTitle: "1. Fragebogen",
    demoFlowSphereTitle: "2. Branche",
    demoFlowManifestTitle: "3. Manifest Preview",
    demoFlowLivePreviewTitle: "4. Live Preview",
    demoFlowApprovalTitle: "5. Bestätigung",
    demoFlowEmail: "E-Mail",
    demoFlowPhone: "Telefon",
    demoFlowLanguage: "Sprache",
    demoFlowCategory: "Kategorie",
    demoFlowSelectedSphere: "Gewählte Branche",
    demoVideoNotSynced: "Demo video not synced",
  },
  en: {
    loading: "Loading…",
    pageTitle: "Live Preview",
    pageDescription: "Review your MVP before downloading artifacts",
    mvpReadyTitle: "Your MVP is ready",
    livePreview: "Live Preview",
    previewUnavailable: "Preview unavailable: dist not found.",
    likeQuestion: "Do you like the result?",
    yes: "YES",
    no: "NO",
    backToQuestionnaire: "Back to questionnaire",
    backToPreview: "Back to Preview",
    resultTitle: "Your MVP is ready",
    resultDescription: "Choose how to receive your deliverables",
    availableOptions: "Available options",
    optionUnavailable: "Not available yet",
    optionAvailable: "Available",
    approvalRequired: "Please approve the Live Preview first",
    openPreview: "Open Live Preview",
    businessName: "Business name",
    businessType: "Industry",
    template: "Template",
    modules: "Modules",
    funnelBrand: "SAAS IDEA AI MVP FACTORY",
    funnelSubtitle: "Client Funnel",
    navQuestionnaire: "Questionnaire",
    navPreview: "Live Preview",
    navResult: "Result",
    deliveryOptions: DELIVERY_OPTIONS_EN,
    domainGuideTitle: "Connect your custom domain",
    domainGuideSubtitle: "Follow these steps to connect your domain to your MVP",
    domainSteps: [
      "Buy a domain from a registrar",
      "Open your domain DNS panel",
      "Add DNS records (CNAME www + A @)",
      "Wait for DNS verification and SSL activation",
    ],
    domainNetlifyHint: "Your site:",
    domainBackToResult: "Back to result",
    artifactsSyncWarning: "Artifacts are out of sync",
    demoFlowQuestionnaireTitle: "1. Questionnaire",
    demoFlowSphereTitle: "2. Business sphere",
    demoFlowManifestTitle: "3. Manifest preview",
    demoFlowLivePreviewTitle: "4. Live Preview",
    demoFlowApprovalTitle: "5. Approval",
    demoFlowEmail: "Email",
    demoFlowPhone: "Phone",
    demoFlowLanguage: "Language",
    demoFlowCategory: "Category",
    demoFlowSelectedSphere: "Selected sphere",
    demoVideoNotSynced: "Demo video not synced",
  },
};

export function getPreviewCopy(locale: Locale): PreviewCopy {
  return COPY[locale] ?? COPY.en;
}

export function getDeliveryOptionCopy(
  locale: Locale,
  key: DeliveryOptionKey,
): DeliveryOptionCopy {
  const copy = getPreviewCopy(locale);
  return copy.deliveryOptions[key] ?? COPY.en.deliveryOptions[key];
}
