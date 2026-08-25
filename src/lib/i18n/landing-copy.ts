import type { Locale } from "@/lib/i18n/config";

export type Lang = Locale;

export const LANGS: Lang[] = ["de", "en", "ru"];

export const LANG_LABELS: Record<Lang, string> = {
  de: "DE",
  en: "EN",
  ru: "RU",
};

export type Translation = {
  // language switcher aria
  langLabel: string;

  // hero
  heroBadge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroTitle3: string;
  heroSubtitle: string;
  heroSubtitleHighlight: string;
  heroDescription: string;
  priceMonthly: string;
  priceValue: string;
  priceSiteCrm: string;
  priceConfigured: string;
  heroBtnPrimary: string;
  heroBtnSecondary: string;
  heroCheckmarks: string[];

  // phone mockup
  mockTitle: string;
  mockSubtitle: string;
  mockStats: [string, string][];
  mockEvents: [string, string, string][];

  // scroll indicator
  scrollDown: string;

  // problem section
  problemEyebrow: string;
  problemTitle1: string;
  problemTitle2: string;
  problems: { text: string }[];
  stats: { value: string; label: string }[];
  problemQuestion: string;
  problemQuestionHighlight: string;
  problemAnswer: string;

  // how it works
  howEyebrow: string;
  howTitle: string;
  howSubtitle: string;
  howSteps: { title: string; desc: string }[];
  howBtn: string;
  howBtnHint: string;

  // features
  featuresEyebrow: string;
  featuresTitle: string;
  features: string[];

  // niches
  nichesEyebrow: string;
  nichesTitle: string;
  niches: string[];

  nichesTitleParts: string[];

  // benefits
  benefitsEyebrow: string;
  benefitsTitle: string;
  benefits: { title: string; desc: string }[];

  // pricing
  pricingEyebrow: string;
  pricingTitle: string;
  pricingMonthly: string;
  pricingPerMonth: string;
  pricingDemoFree: string;
  pricingItems: string[];
  pricingBtn: string;
  pricingPayBtn: string;
  pricingHint: string;

  // final CTA
  ctaTitle1: string;
  ctaTitle2: string;
  ctaSubtitle: string;
  ctaBtn: string;
  ctaCheckmarks: string[];

  // footer
  footerTagline: string;
};

const de: Translation = {
  langLabel: 'Sprache',

  heroBadge: 'WEB STUDIO IHOR KRIAZHEV MÜNCHEN',
  heroTitle1: 'VERLIEREN SIE',
  heroTitle2: 'KEINE',
  heroTitle3: 'KUNDEN MEHR!',
  heroSubtitle: 'Website + CRM + Buchung — in',
  heroSubtitleHighlight: '3 Minuten',
  heroDescription: 'Füllen Sie einen kurzen Fragebogen aus → erhalten Sie eine Live-Demo → zahlen Sie nur, wenn es Ihnen gefällt',
  priceMonthly: 'Monatlich',
  priceValue: '€199',
  priceSiteCrm: 'Website + CRM + Buchung',
  priceConfigured: 'vollständig eingerichtet',
  heroBtnPrimary: 'Demo kostenlos starten',
  heroBtnSecondary: 'Website-Demos ansehen',
  heroCheckmarks: ['Keine technischen Kenntnisse', 'Demo ist kostenlos', 'Zahlung nach Ansicht'],

  mockTitle: 'Website + CRM — Fitness Club',
  mockSubtitle: 'Igor Kriazhev · 312 heute',
  mockStats: [
    ['312', 'Kunden'],
    ['47', 'Termine heute'],
    ['€840', 'Umsatz'],
    ['6', 'Freie Plätze'],
  ],
  mockEvents: [
    ['12:30', 'Neuer Termin', 'Wartet'],
    ['10:00', 'Erinnerung gesendet', 'Fertig'],
    ['08:45', 'Zahlung erhalten', '€120'],
  ],

  scrollDown: 'nach unten scrollen',

  problemEyebrow: 'Das ist Ihr Geld',
  problemTitle1: '1000 Personen suchen täglich nach Dienstleistungen.',
  problemTitle2: 'Werden sie Sie finden?',
  problems: [
    { text: 'Sie werden im Internet nicht gefunden' },
    { text: 'Kunden können nicht online buchen' },
    { text: 'Niemand kennt Ihre Leistungen' },
    { text: 'Ihre Services sind stark — aber wer weiß das?' },
  ],
  stats: [
    { value: '1000', label: 'Kunden' },
    { value: '1000', label: 'Anrufe' },
    { value: '1000', label: 'Bestellungen' },
  ],
  problemQuestion: 'Wie viel davon bekommen',
  problemQuestionHighlight: 'Sie?',
  problemAnswer: 'Eine Website + CRM löst alles',

  howEyebrow: 'Prozess',
  howTitle: 'So funktioniert es',
  howSubtitle: 'Demo ist kostenlos. Zahlung erst, nachdem Sie das Ergebnis gesehen haben.',
  howSteps: [
    { title: 'Fragebogen ausfüllen', desc: 'Einige Fragen zu Ihrem Business — ohne technisches Wissen' },
    { title: 'System erstellt Website + CRM', desc: 'In 3 Minuten — fertige Website + CRM für Ihre Nische' },
    { title: 'Live-Demo ansehen', desc: 'Sie sehen das fertige Ergebnis vor der Zahlung' },
    { title: 'Zahlen und Website erhalten', desc: '€199 / Monat — und Ihre Website + CRM sind einsatzbereit' },
  ],
  howBtn: 'Fragebogen ausfüllen — kostenlos',
  howBtnHint: 'Dauert 2–3 Minuten. Ohne Registrierung.',

  featuresEyebrow: 'Funktionen',
  featuresTitle: 'Was in Website + CRM + Buchung enthalten ist',
  features: [
    'Professionelle Website für Ihre Nische',
    'CRM — Kunden, Termine, Leistungen',
    'Online-Buchung und Terminverwaltung',
    'Automatische Kundenerinnerungen',
    'Galerie mit Fotos Ihrer Nische',
    'Sprachumschaltung EN / DE / RU',
    'Analytics-Dashboard und Statistiken',
    'Eindeutige URL',
    'Mobil optimiert — funktioniert auf jedem Gerät',
  ],

  nichesEyebrow: 'Nischen',
  nichesTitle: '20 fertige Nischen • Start in 3 Minuten • ohne Programmierer',
  nichesTitleParts: ['20 fertige Nischen', 'Start in 3 Minuten', 'ohne Programmierer'],
  niches: [
    'Beauty-Salon',
    'Barbershop',
    'Massagestudio',
    'Fitnessstudio',
    'Yoga-Studio',
    'Zahnarztpraxis',
    'Medizinische Klinik',
    'Restaurant',
    'Café',
    'Hotel',
    'Autowerkstatt',
    'Reifendienst',
    'Autowäsche',
    'Immobilienagentur',
    'Anwaltskanzlei',
    'Buchhaltungsservice',
    'Bildungszentrum',
    'Logistik & Transport',
    'Online-Shop',
    'IT & Technologie',
  ],

  benefitsEyebrow: 'Warum wir',
  benefitsTitle: 'Eine Website löst alles',
  benefits: [
    { title: 'Keine technischen Kenntnisse', desc: 'Füllen Sie einfach den Fragebogen aus' },
    { title: 'Fertig in 3 Minuten', desc: 'Schneller als eine Tasse Kaffee' },
    { title: 'Auf jedem Gerät', desc: 'Mobil optimiert' },
    { title: 'Sicher und zuverlässig', desc: 'Cloud-basierte Datenspeicherung' },
    { title: 'Eindeutige URL', desc: '' },
    { title: 'Mehr Buchungen', desc: 'Online-Buchung 24/7' },
  ],

  pricingEyebrow: 'Preis',
  pricingTitle: 'Website + CRM + Buchung',
  pricingMonthly: 'Monatliche Zahlung',
  pricingPerMonth: '/ Monat',
  pricingDemoFree: 'Demo vor Zahlung',
  pricingItems: [
    'Website + CRM + Buchung vollständig eingerichtet',
    'Demo kostenlos, Zahlung nach Ansicht',
    'Fertig in 3 Minuten per Fragebogen',
    'Monatliche Wartung inklusive',
    'Technischer Support',
    'Updates und Verbesserungen',
  ],
  pricingBtn: 'Demo kostenlos starten',
  pricingPayBtn: 'Plan wählen',
  pricingHint: 'Ohne Registrierung · Demo kostenlos · Zahlung €199/Monat erst nach Ansicht',

  ctaTitle1: 'FERTIG!',
  ctaTitle2: 'Website + CRM in 3 Minuten',
  ctaSubtitle: 'Füllen Sie den Fragebogen aus → erhalten Sie eine Live-Demo → zahlen Sie nur, wenn es Ihnen gefällt',
  ctaBtn: 'Website starten',
  ctaCheckmarks: [
    'Keine technischen Kenntnisse',
    'Start in 3 Minuten',
    'Auf allen Geräten',
    'Sicher und zuverlässig',
    'Mehr Verkäufe und Buchungen',
  ],

  footerTagline: 'Website + CRM in 3 Minuten · €199 / Monat',
};

const en: Translation = {
  langLabel: 'Language',

  heroBadge: 'WEB STUDIO IHOR KRIAZHEV MÜNCHEN',
  heroTitle1: 'STOP',
  heroTitle2: 'LOSING',
  heroTitle3: 'CUSTOMERS!',
  heroSubtitle: 'Website + CRM + Booking — in',
  heroSubtitleHighlight: '3 minutes',
  heroDescription: 'Fill out a short questionnaire → get a live Demo → pay only if you like it',
  priceMonthly: 'Monthly',
  priceValue: '€199',
  priceSiteCrm: 'Website + CRM + Booking',
  priceConfigured: 'fully configured',
  heroBtnPrimary: 'Launch Demo for free',
  heroBtnSecondary: 'View site demos',
  heroCheckmarks: ['No technical skills', 'Demo is free', 'Pay after viewing'],

  mockTitle: 'Website + CRM — Fitness Club',
  mockSubtitle: 'Igor Kriazhev · 312 today',
  mockStats: [
    ['312', 'Customers'],
    ['47', 'Bookings today'],
    ['€840', 'Revenue'],
    ['6', 'Available slots'],
  ],
  mockEvents: [
    ['12:30', 'New booking', 'Pending'],
    ['10:00', 'Reminder sent', 'Done'],
    ['08:45', 'Payment received', '€120'],
  ],

  scrollDown: 'scroll down',

  problemEyebrow: 'This is your money',
  problemTitle1: '1000 people search for services daily.',
  problemTitle2: 'Will they find you?',
  problems: [
    { text: "You're not found on the internet" },
    { text: 'Customers cannot book online' },
    { text: 'No one knows your capabilities' },
    { text: 'Your services are strong — but who knows?' },
  ],
  stats: [
    { value: '1000', label: 'customers' },
    { value: '1000', label: 'calls' },
    { value: '1000', label: 'orders' },
  ],
  problemQuestion: 'How much of it goes to',
  problemQuestionHighlight: 'you?',
  problemAnswer: 'One website + CRM solves everything',

  howEyebrow: 'Process',
  howTitle: 'How it works',
  howSubtitle: 'Demo is free. Payment only after you see the result.',
  howSteps: [
    { title: 'Fill out the questionnaire', desc: 'A few questions about your business — no technical knowledge' },
    { title: 'System builds Website + CRM', desc: 'In 3 minutes — a ready website + CRM for your niche' },
    { title: 'Watch the live Demo', desc: 'You see the finished result before paying' },
    { title: 'Pay and get your website', desc: '€199 / month — and your website + CRM are ready to go' },
  ],
  howBtn: 'Fill out the questionnaire — free',
  howBtnHint: 'Takes 2–3 minutes. No registration.',

  featuresEyebrow: 'Features',
  featuresTitle: 'What\'s included in Website + CRM + Booking',
  features: [
    'Professional website for your niche',
    'CRM — customers, bookings, services',
    'Online booking and schedule management',
    'Automatic customer reminders',
    'Gallery with photos of your niche',
    'Language switching EN / DE / RU',
    'Analytics dashboard and statistics',
    'Unique URL',
    'Mobile-friendly — works on any device',
  ],

  nichesEyebrow: 'Niches',
  nichesTitle: '20 ready niches • launch in 3 minutes • no programmers',
  nichesTitleParts: ['20 ready niches', 'launch in 3 minutes', 'no programmers'],
  niches: [
    'Beauty salon',
    'Barbershop',
    'Massage studio',
    'Fitness club',
    'Yoga studio',
    'Dentistry',
    'Medical clinic',
    'Restaurant',
    'Café',
    'Hotel',
    'Auto repair',
    'Tire service',
    'Car wash',
    'Real estate agency',
    'Law firm',
    'Accounting services',
    'Education center',
    'Logistics & transport',
    'Online store',
    'IT & technology',
  ],

  benefitsEyebrow: 'Why us',
  benefitsTitle: 'One website solves everything',
  benefits: [
    { title: 'No technical skills', desc: 'Just fill out the questionnaire' },
    { title: 'Ready in 3 minutes', desc: 'Faster than a cup of coffee' },
    { title: 'On any device', desc: 'Mobile-friendly' },
    { title: 'Secure and reliable', desc: 'Cloud-based data storage' },
    { title: 'Unique URL', desc: '' },
    { title: 'More bookings', desc: 'Online booking 24/7' },
  ],

  pricingEyebrow: 'Price',
  pricingTitle: 'Website + CRM + Booking',
  pricingMonthly: 'Monthly payment',
  pricingPerMonth: '/ month',
  pricingDemoFree: 'Demo before payment',
  pricingItems: [
    'Website + CRM + Booking fully configured',
    'Demo is free, payment after viewing',
    'Ready in 3 minutes via questionnaire',
    'Monthly maintenance included',
    'Technical support',
    'Updates and improvements',
  ],
  pricingBtn: 'Launch Demo for free',
  pricingPayBtn: 'Choose plan',
  pricingHint: 'No registration · Demo free · Payment €199/month only after viewing',

  ctaTitle1: 'READY!',
  ctaTitle2: 'Website + CRM in 3 minutes',
  ctaSubtitle: 'Fill out the questionnaire → get a live Demo → pay only if you like it',
  ctaBtn: 'Launch website',
  ctaCheckmarks: [
    'No technical skills',
    'Launch in 3 minutes',
    'On any device',
    'Secure and reliable',
    'More sales and bookings',
  ],

  footerTagline: 'Website + CRM in 3 minutes · €199 / month',
};

const ru: Translation = {
  langLabel: 'Язык',

  heroBadge: 'WEB STUDIO IHOR KRIAZHEV MÜNCHEN',
  heroTitle1: 'ПЕРЕСТАНЬ',
  heroTitle2: 'ТЕРЯТЬ',
  heroTitle3: 'КЛИЕНТОВ!',
  heroSubtitle: 'Сайт + CRM + Бронирование — за',
  heroSubtitleHighlight: '3 минуты',
  heroDescription: 'Заполните короткий опросник → получите живое Демо → оплатите только если понравится',
  priceMonthly: 'Ежемесячно',
  priceValue: '€199',
  priceSiteCrm: 'Сайт + CRM + Бронирование',
  priceConfigured: 'полностью настроены',
  heroBtnPrimary: 'Запустить Демо бесплатно',
  heroBtnSecondary: 'Посмотреть демо сайтов',
  heroCheckmarks: ['Без технических знаний', 'Демо — бесплатно', 'Оплата после просмотра'],

  mockTitle: 'Сайт + CRM — Fitness Club',
  mockSubtitle: 'Igor Kriazhev · 312 сегодня',
  mockStats: [
    ['312', 'Клиентов'],
    ['47', 'Записей сегодня'],
    ['€840', 'Выручка'],
    ['6', 'Свободных мест'],
  ],
  mockEvents: [
    ['12:30', 'Новая запись', 'Ожидает'],
    ['10:00', 'Напоминание отправлено', 'Готово'],
    ['08:45', 'Оплата получена', '€120'],
  ],

  scrollDown: 'прокрутите вниз',

  problemEyebrow: 'Это твои деньги',
  problemTitle1: '1000 человек ежедневно ищут услуги.',
  problemTitle2: 'Найдут ли они именно тебя?',
  problems: [
    { text: 'Тебя не находят в интернете' },
    { text: 'Клиенты не могут записаться онлайн' },
    { text: 'Не знают всех твоих возможностей' },
    { text: 'Твои услуги сильные — но кто об этом знает?' },
  ],
  stats: [
    { value: '1000', label: 'клиентов' },
    { value: '1000', label: 'звонков' },
    { value: '1000', label: 'заказов' },
  ],
  problemQuestion: 'А сколько достаётся',
  problemQuestionHighlight: 'тебе?',
  problemAnswer: 'Один сайт + CRM решает всё',

  howEyebrow: 'Процесс',
  howTitle: 'Как это работает',
  howSubtitle: 'Демо — бесплатно. Оплата только после того, как вы увидите результат.',
  howSteps: [
    { title: 'Заполните опросник', desc: 'Несколько вопросов о вашем бизнесе — без технических знаний' },
    { title: 'Система собирает Сайт + CRM', desc: 'За 3 минуты — готовый сайт + CRM под вашу нишу' },
    { title: 'Смотрите живое Демо', desc: 'Вы видите готовый результат до оплаты' },
    { title: 'Оплачиваете и получаете сайт', desc: '€199 / месяц — и ваш сайт + CRM уже работают' },
  ],
  howBtn: 'Заполнить опросник — это бесплатно',
  howBtnHint: 'Займёт 2–3 минуты. Без регистрации.',

  featuresEyebrow: 'Возможности',
  featuresTitle: 'Что входит в Сайт + CRM + Бронирование',
  features: [
    'Профессиональный сайт под вашу нишу',
    'CRM — клиенты, записи, услуги',
    'Онлайн-запись и управление расписанием',
    'Автоматические напоминания клиентам',
    'Галерея с фото вашей ниши',
    'Переключение языков EN / DE / RU',
    'Панель аналитики и статистика',
    'Уникальный URL',
    'Мобильная адаптация — работает на любом устройстве',
  ],

  nichesEyebrow: 'Ниши',
  nichesTitle: '20 готовых ниш • запуск за 3 минуты • без программистов',
  nichesTitleParts: ['20 готовых ниш', 'запуск за 3 минуты', 'без программистов'],
  niches: [
    'Салон красоты',
    'Барбершоп',
    'Массажный салон',
    'Фитнес-клуб',
    'Йога-студия',
    'Стоматология',
    'Медицинская клиника',
    'Ресторан',
    'Кафе',
    'Отель',
    'Автосервис',
    'Шиномонтаж',
    'Автомойка',
    'Агентство недвижимости',
    'Юридическая фирма',
    'Бухгалтерские услуги',
    'Образовательный центр',
    'Логистика и перевозки',
    'Интернет-магазин',
    'IT и технологии',
  ],

  benefitsEyebrow: 'Почему мы',
  benefitsTitle: 'Один сайт решает всё',
  benefits: [
    { title: 'Без технических знаний', desc: 'Просто заполните опросник' },
    { title: 'Готово за 3 минуты', desc: 'Быстрее, чем чашка кофе' },
    { title: 'На любом устройстве', desc: 'Мобильная адаптация' },
    { title: 'Безопасно и надёжно', desc: 'Облачное хранение данных' },
    { title: 'Уникальный URL', desc: '' },
    { title: 'Рост записей', desc: 'Онлайн-запись 24/7' },
  ],

  pricingEyebrow: 'Цена',
  pricingTitle: 'Сайт + CRM + Бронирование',
  pricingMonthly: 'Ежемесячная оплата',
  pricingPerMonth: '/ месяц',
  pricingDemoFree: 'Демо перед оплатой',
  pricingItems: [
    'Сайт + CRM + Бронирование полностью настроены',
    'Демо — бесплатно, оплата после просмотра',
    'Готово за 3 минуты через опросник',
    'Ежемесячное обслуживание включено',
    'Техническая поддержка',
    'Обновления и улучшения',
  ],
  pricingBtn: 'Запустить Демо бесплатно',
  pricingPayBtn: 'Выбрать тариф',
  pricingHint: 'Без регистрации · Демо бесплатно · Оплата €199/мес только после просмотра',

  ctaTitle1: 'ГОТОВО!',
  ctaTitle2: 'Сайт + CRM за 3 минуты',
  ctaSubtitle: 'Заполните опросник → получите живое Демо → оплачивайте только если понравится',
  ctaBtn: 'Запустить сайт',
  ctaCheckmarks: [
    'Без технических знаний',
    'Запуск за 3 минуты',
    'На любых устройствах',
    'Безопасно и надёжно',
    'Рост продаж и записей',
  ],

  footerTagline: 'Сайт + CRM за 3 минуты · €199 / месяц',
};

export const translations: Record<Lang, Translation> = { de, en, ru };
