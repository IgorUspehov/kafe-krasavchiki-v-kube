import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale, isLocale } from "@/lib/i18n/config";

export type AdminCopy = {
  brand: string;
  logout: string;
  loading: string;
  loadFailed: string;
  save: string;
  saving: string;
  saved: string;
  saveFailed: string;
  viewSite: string;
  prevSection: string;
  nextSection: string;
  nav: {
    overview: string;
    content: string;
    media: string;
    services: string;
    jobs: string;
    contacts: string;
    integrations: string;
  };
  overview: {
    title: string;
    description: string;
    status: string;
    paid: string;
    demo: string;
    publicSite: string;
    publicSiteMissing: string;
    crm: string;
    sections: string;
    openIntegrations: string;
  };
  integrations: {
    title: string;
    description: string;
    launchTitle: string;
    readyTitle: string;
    downloadZip: string;
    downloadZipLoading: string;
    downloadZipError: string;
    downloadZipDistMissing: string;
    buyZip: string;
    buyZipLoading: string;
    buyZipError: string;
    buyZipCheckoutMissing: string;
    zipLockedHint: string;
    zipUnlockedHint: string;
  };
  content: {
    title: string;
    description: string;
    businessName: string;
    subtitle: string;
    descriptionField: string;
  };
  media: {
    title: string;
    description: string;
    logo: string;
    noLogo: string;
    chooseFile: string;
    removeLogo: string;
    hero: string;
    noHero: string;
    removeHero: string;
    gallery: string;
    remove: string;
    updated: string;
    uploadFailed: string;
    deleteFailed: string;
  };
  services: {
    title: string;
    description: string;
    catalog: string;
    add: string;
    name: string;
    price: string;
    duration: string;
    remove: string;
  };
  jobs: {
    title: string;
    description: string;
    edit: string;
    create: string;
    newJob: string;
    jobTitle: string;
    jobDescription: string;
    salary: string;
    requirements: string;
    update: string;
    cancel: string;
    editBtn: string;
    deleteBtn: string;
  };
  contacts: {
    title: string;
    description: string;
    phone: string;
    whatsapp: string;
    email: string;
    city: string;
    postalCode: string;
    address: string;
    hours: string;
    social: string;
    days: Record<string, string>;
  };
  login: {
    title: string;
    description: string;
    email: string;
    send: string;
    sending: string;
    sent: string;
    sendFailed: string;
    linkReady: string;
    sentWithLink: string;
    openLink: string;
    expired: string;
    used: string;
    invalid: string;
  };
  langSwitch: string;
};

const EN: AdminCopy = {
  brand: "Client admin",
  logout: "Log out",
  loading: "Loading…",
  loadFailed: "Failed to load",
  save: "Save",
  saving: "Saving…",
  saved: "Saved",
  saveFailed: "Failed to save",
  viewSite: "View site →",
  prevSection: "← Previous",
  nextSection: "Next →",
  nav: {
    overview: "Overview",
    content: "Content",
    media: "Media",
    services: "Services",
    jobs: "Jobs",
    contacts: "Contact",
    integrations: "Integrations",
  },
  overview: {
    title: "Overview",
    description: "Manage the content of your published website.",
    status: "Status",
    paid: "Active / paid",
    demo: "Demo",
    publicSite: "Public website:",
    publicSiteMissing: "Public URL not available yet.",
    crm: "CRM / Booking:",
    sections: "Sections",
    openIntegrations: "Integrations → Deployable ZIP €999",
  },
  integrations: {
    title: "Integrations",
    description: "Download your site and open platforms.",
    launchTitle: "Launch your project",
    readyTitle: "Your project is ready to launch",
    downloadZip: "Download ZIP",
    downloadZipLoading: "Creating ZIP…",
    downloadZipError: "Could not create ZIP. Try again.",
    downloadZipDistMissing: "Site files are not ready yet. Create or republish the site first.",
    buyZip: "Buy ZIP · €999",
    buyZipLoading: "Opening checkout…",
    buyZipError: "Could not start checkout. Try again.",
    buyZipCheckoutMissing:
      "ZIP €999 is not configured on Render. Set POLAR_ACCESS_TOKEN (checkouts:write) or POLAR_CHECKOUT_DEPLOYABLE_ZIP with success URL https://webstudio-muenchen.com/success — not the Factory link.",
    zipLockedHint: "One-time €999 unlocks your personalized static ZIP for any host.",
    zipUnlockedHint: "Payment confirmed — you can download your Deployable ZIP.",
  },
  content: {
    title: "Content",
    description: "Name and description of your website.",
    businessName: "Business name",
    subtitle: "Subtitle",
    descriptionField: "Description",
  },
  media: {
    title: "Media",
    description: "Logo, hero image and gallery.",
    logo: "Logo",
    noLogo: "No logo.",
    chooseFile: "Choose file",
    removeLogo: "Remove logo",
    hero: "Hero image",
    noHero: "No hero image.",
    removeHero: "Remove hero image",
    gallery: "Gallery",
    remove: "Remove",
    updated: "Updated.",
    uploadFailed: "Upload failed",
    deleteFailed: "Delete failed",
  },
  services: {
    title: "Services",
    description: "Names, prices and duration — same catalog as booking.",
    catalog: "Catalog",
    add: "Add service",
    name: "Name",
    price: "Price",
    duration: "Duration",
    remove: "Remove",
  },
  jobs: {
    title: "Jobs",
    description: "Open positions for the public jobs page.",
    edit: "Edit job",
    create: "Create",
    newJob: "New job",
    jobTitle: "Title",
    jobDescription: "Description",
    salary: "Salary",
    requirements: "Requirements",
    update: "Update",
    cancel: "Cancel",
    editBtn: "Edit",
    deleteBtn: "Delete",
  },
  contacts: {
    title: "Contact",
    description: "Phone, address, opening hours and social links.",
    phone: "Phone",
    whatsapp: "WhatsApp",
    email: "Email",
    city: "City",
    postalCode: "Postal code",
    address: "Address",
    hours: "Opening hours",
    social: "Social links",
    days: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    },
  },
  login: {
    title: "Client admin",
    description: "Sign in with the email used when the website was created.",
    email: "Email",
    send: "Send login link",
    sending: "Sending…",
    sent: "If an account exists for this email, we send a login link. Check spam too. Gmail search: in:anywhere from:noreply@webstudio-muenchen.com",
    sendFailed: "Failed to send",
    linkReady: "Email could not be sent. Use this login link:",
    sentWithLink: "We sent a login link by email. You can also open it here:",
    openLink: "Enter admin",
    expired: "This link has expired. Please request a new one.",
    used: "This link has already been used.",
    invalid: "Invalid login link.",
  },
  langSwitch: "Language",
};

const DE: AdminCopy = {
  brand: "Kunden-Admin",
  logout: "Abmelden",
  loading: "Laden…",
  loadFailed: "Laden fehlgeschlagen",
  save: "Speichern",
  saving: "Speichern…",
  saved: "Gespeichert",
  saveFailed: "Speichern fehlgeschlagen",
  viewSite: "Website ansehen →",
  prevSection: "← Zurück",
  nextSection: "Weiter →",
  nav: {
    overview: "Übersicht",
    content: "Inhalt",
    media: "Medien",
    services: "Leistungen",
    jobs: "Stellen",
    contacts: "Kontakt",
    integrations: "Integrationen",
  },
  overview: {
    title: "Übersicht",
    description: "Verwalten Sie den Inhalt Ihrer veröffentlichten Website.",
    status: "Status",
    paid: "Aktiv / bezahlt",
    demo: "Demo",
    publicSite: "Öffentliche Website:",
    publicSiteMissing: "Öffentliche URL noch nicht verfügbar.",
    crm: "CRM / Booking:",
    sections: "Bereiche",
    openIntegrations: "Integrationen → Deployable ZIP €999",
  },
  integrations: {
    title: "Integrationen",
    description: "Website herunterladen und Plattformen öffnen.",
    launchTitle: "Projekt starten",
    readyTitle: "Ihr Projekt ist startklar",
    downloadZip: "ZIP herunterladen",
    downloadZipLoading: "ZIP wird erstellt…",
    downloadZipError: "ZIP konnte nicht erstellt werden. Bitte erneut versuchen.",
    downloadZipDistMissing: "Website-Dateien sind noch nicht bereit. Bitte zuerst veröffentlichen.",
    buyZip: "ZIP kaufen · €999",
    buyZipLoading: "Checkout wird geöffnet…",
    buyZipError: "Checkout konnte nicht gestartet werden. Bitte erneut versuchen.",
    buyZipCheckoutMissing:
      "ZIP €999 ist auf Render nicht konfiguriert. POLAR_ACCESS_TOKEN (checkouts:write) oder POLAR_CHECKOUT_DEPLOYABLE_ZIP mit Success-URL https://webstudio-muenchen.com/success setzen — nicht den Factory-Link.",
    zipLockedHint: "Einmalig €999 schaltet Ihr personalisiertes Static-ZIP für jedes Hosting frei.",
    zipUnlockedHint: "Zahlung bestätigt — Sie können Ihr Deployable ZIP herunterladen.",
  },
  content: {
    title: "Inhalt",
    description: "Name und Beschreibung Ihrer Website.",
    businessName: "Geschäftsname",
    subtitle: "Untertitel",
    descriptionField: "Beschreibung",
  },
  media: {
    title: "Medien",
    description: "Logo, Hauptbild und Galerie.",
    logo: "Logo",
    noLogo: "Kein Logo.",
    chooseFile: "Datei wählen",
    removeLogo: "Logo entfernen",
    hero: "Hauptbild",
    noHero: "Kein Hauptbild.",
    removeHero: "Hauptbild entfernen",
    gallery: "Galerie",
    remove: "Entfernen",
    updated: "Aktualisiert.",
    uploadFailed: "Upload fehlgeschlagen",
    deleteFailed: "Löschen fehlgeschlagen",
  },
  services: {
    title: "Leistungen",
    description: "Namen, Preise und Dauer — derselbe Katalog wie Booking.",
    catalog: "Katalog",
    add: "Leistung hinzufügen",
    name: "Name",
    price: "Preis",
    duration: "Dauer",
    remove: "Entfernen",
  },
  jobs: {
    title: "Stellen",
    description: "Offene Stellen für die öffentliche Job-Seite.",
    edit: "Stelle bearbeiten",
    create: "Erstellen",
    newJob: "Neue Stelle",
    jobTitle: "Titel",
    jobDescription: "Beschreibung",
    salary: "Gehalt",
    requirements: "Anforderungen",
    update: "Aktualisieren",
    cancel: "Abbrechen",
    editBtn: "Bearbeiten",
    deleteBtn: "Löschen",
  },
  contacts: {
    title: "Kontakt",
    description: "Telefon, Adresse, Öffnungszeiten und soziale Links.",
    phone: "Telefon",
    whatsapp: "WhatsApp",
    email: "E-Mail",
    city: "Stadt",
    postalCode: "PLZ",
    address: "Adresse",
    hours: "Öffnungszeiten",
    social: "Social Links",
    days: {
      monday: "Montag",
      tuesday: "Dienstag",
      wednesday: "Mittwoch",
      thursday: "Donnerstag",
      friday: "Freitag",
      saturday: "Samstag",
      sunday: "Sonntag",
    },
  },
  login: {
    title: "Kunden-Admin",
    description: "Melden Sie sich mit der E-Mail an, die bei der Erstellung der Website angegeben wurde.",
    email: "E-Mail",
    send: "Login-Link senden",
    sending: "Senden…",
    sent: "Wenn ein Konto zu dieser E-Mail existiert, senden wir einen Login-Link. Prüfen Sie auch Spam. Suche in Gmail: in:anywhere from:noreply@webstudio-muenchen.com",
    sendFailed: "Senden fehlgeschlagen",
    linkReady: "E-Mail konnte nicht gesendet werden. Nutzen Sie diesen Login-Link:",
    sentWithLink: "Wir haben einen Login-Link per E-Mail gesendet. Sie können ihn auch hier öffnen:",
    openLink: "Admin öffnen",
    expired: "Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen an.",
    used: "Dieser Link wurde bereits verwendet.",
    invalid: "Ungültiger Login-Link.",
  },
  langSwitch: "Sprache",
};

const RU: AdminCopy = {
  brand: "Админ-панель",
  logout: "Выйти",
  loading: "Загрузка…",
  loadFailed: "Не удалось загрузить",
  save: "Сохранить",
  saving: "Сохранение…",
  saved: "Сохранено",
  saveFailed: "Не удалось сохранить",
  viewSite: "Посмотреть сайт →",
  prevSection: "← Назад",
  nextSection: "Далее →",
  nav: {
    overview: "Обзор",
    content: "Контент",
    media: "Медиа",
    services: "Услуги",
    jobs: "Вакансии",
    contacts: "Контакты",
    integrations: "Интеграции",
  },
  overview: {
    title: "Обзор",
    description: "Управляйте содержимым опубликованного сайта.",
    status: "Статус",
    paid: "Активен / оплачен",
    demo: "Демо",
    publicSite: "Публичный сайт:",
    publicSiteMissing: "Публичный URL пока недоступен.",
    crm: "CRM / Бронирование:",
    sections: "Разделы",
    openIntegrations: "Интеграции → Deployable ZIP €999",
  },
  integrations: {
    title: "Интеграции",
    description: "Скачайте сайт и откройте платформы.",
    launchTitle: "Запустить проект",
    readyTitle: "Ваш проект готов к запуску",
    downloadZip: "Скачать ZIP",
    downloadZipLoading: "Создание ZIP…",
    downloadZipError: "Не удалось создать ZIP. Попробуйте снова.",
    downloadZipDistMissing: "Файлы сайта ещё не готовы. Сначала создайте или опубликуйте сайт.",
    buyZip: "Купить ZIP · €999",
    buyZipLoading: "Открываем оплату…",
    buyZipError: "Не удалось открыть оплату. Попробуйте снова.",
    buyZipCheckoutMissing:
      "ZIP €999 не настроен на Render. Добавьте POLAR_ACCESS_TOKEN (checkouts:write) или POLAR_CHECKOUT_DEPLOYABLE_ZIP с success URL https://webstudio-muenchen.com/success — не ссылку Factory.",
    zipLockedHint: "Разовая оплата €999 открывает персональный static ZIP для любого хостинга.",
    zipUnlockedHint: "Оплата подтверждена — можно скачать Deployable ZIP.",
  },
  content: {
    title: "Контент",
    description: "Название и описание вашего сайта.",
    businessName: "Название бизнеса",
    subtitle: "Подзаголовок",
    descriptionField: "Описание",
  },
  media: {
    title: "Медиа",
    description: "Логотип, главное фото и галерея.",
    logo: "Логотип",
    noLogo: "Нет логотипа.",
    chooseFile: "Выбрать файл",
    removeLogo: "Удалить логотип",
    hero: "Главное фото",
    noHero: "Нет главного фото.",
    removeHero: "Удалить главное фото",
    gallery: "Галерея",
    remove: "Удалить",
    updated: "Обновлено.",
    uploadFailed: "Ошибка загрузки",
    deleteFailed: "Ошибка удаления",
  },
  services: {
    title: "Услуги",
    description: "Названия, цены и длительность — тот же каталог, что и в бронировании.",
    catalog: "Каталог",
    add: "Добавить услугу",
    name: "Название",
    price: "Цена",
    duration: "Длительность",
    remove: "Удалить",
  },
  jobs: {
    title: "Вакансии",
    description: "Открытые вакансии для публичной страницы.",
    edit: "Редактировать вакансию",
    create: "Создать",
    newJob: "Новая вакансия",
    jobTitle: "Заголовок",
    jobDescription: "Описание",
    salary: "Зарплата",
    requirements: "Требования",
    update: "Обновить",
    cancel: "Отмена",
    editBtn: "Изменить",
    deleteBtn: "Удалить",
  },
  contacts: {
    title: "Контакты",
    description: "Телефон, адрес, часы работы и соцсети.",
    phone: "Телефон",
    whatsapp: "WhatsApp",
    email: "Email",
    city: "Город",
    postalCode: "Индекс",
    address: "Адрес",
    hours: "Часы работы",
    social: "Соцсети",
    days: {
      monday: "Понедельник",
      tuesday: "Вторник",
      wednesday: "Среда",
      thursday: "Четверг",
      friday: "Пятница",
      saturday: "Суббота",
      sunday: "Воскресенье",
    },
  },
  login: {
    title: "Админ-панель",
    description: "Войдите с email, указанным при создании сайта.",
    email: "Email",
    send: "Отправить ссылку для входа",
    sending: "Отправка…",
    sent: "Если аккаунт с этим email существует, мы отправим ссылку для входа. Проверьте также спам. Поиск в Gmail: in:anywhere from:noreply@webstudio-muenchen.com",
    sendFailed: "Не удалось отправить",
    linkReady: "Письмо не удалось отправить. Используйте эту ссылку для входа:",
    sentWithLink: "Мы отправили ссылку на email. Можно также открыть её здесь:",
    openLink: "Войти в админку",
    expired: "Ссылка истекла. Запросите новую.",
    used: "Эта ссылка уже использована.",
    invalid: "Недействительная ссылка для входа.",
  },
  langSwitch: "Язык",
};

export const ADMIN_COPY: Record<Locale, AdminCopy> = {
  en: EN,
  de: DE,
  ru: RU,
};

export const ADMIN_LOCALE_STORAGE_KEY = "admin-locale";

export function readAdminLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const storedAdmin = window.localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
  if (storedAdmin && isLocale(storedAdmin)) return storedAdmin;
  const storedMain = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (storedMain && isLocale(storedMain)) return storedMain;
  return DEFAULT_LOCALE;
}

export function getAdminCopy(locale: Locale): AdminCopy {
  return ADMIN_COPY[locale] ?? ADMIN_COPY[DEFAULT_LOCALE];
}
