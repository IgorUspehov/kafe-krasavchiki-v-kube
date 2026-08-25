import type { Locale } from "@/lib/i18n/config";

export type SupportFaqItem = {
  question: string;
  answer: string;
};

export type SupportWidgetCopy = {
  button: string;
  title: string;
  close: string;
  telegram: string;
  whatsapp: string;
  faq: SupportFaqItem[];
};

/**
 * FAQ content derived from the main landing page (src/app/page.tsx + landing-copy):
 * pricing, demo flow, timeline, features, niches, and technical requirements.
 * There is no dedicated FAQ section in the UI yet — these Q&As mirror that marketing copy.
 */
const de: SupportWidgetCopy = {
  button: "Support 24/7",
  title: "Häufig gestellte Fragen",
  close: "Schließen",
  telegram: "In Telegram schreiben",
  whatsapp: "In WhatsApp schreiben",
  faq: [
    {
      question: "Was kostet Website + CRM + Buchung?",
      answer:
        "€199 / Monat — Website + CRM + Buchung vollständig eingerichtet. Monatliche Wartung, technischer Support sowie Updates und Verbesserungen sind inklusive.",
    },
    {
      question: "Ist die Demo wirklich kostenlos?",
      answer:
        "Ja. Die Demo ist kostenlos. Sie füllen einen kurzen Fragebogen aus, erhalten eine Live-Demo und zahlen erst, nachdem Sie das Ergebnis gesehen haben — und nur, wenn es Ihnen gefällt.",
    },
    {
      question: "Brauche ich technische Kenntnisse?",
      answer:
        "Nein. Keine technischen Kenntnisse und keine Programmierer nötig. Füllen Sie einfach den Fragebogen aus — das System erstellt Website + CRM für Ihre Nische.",
    },
    {
      question: "Wie schnell ist mein System fertig?",
      answer:
        "In 3 Minuten. Der Fragebogen dauert 2–3 Minuten, danach erhalten Sie eine fertige Website + CRM mit eindeutiger URL — mobil optimiert für jedes Gerät.",
    },
    {
      question: "Was ist enthalten?",
      answer:
        "Professionelle Website für Ihre Nische, CRM (Kunden, Termine, Leistungen), Online-Buchung und Terminverwaltung, automatische Kundenerinnerungen, Galerie, Sprachumschaltung EN / DE / RU, Analytics-Dashboard und eindeutige URL.",
    },
    {
      question: "Für welche Branchen eignet sich das?",
      answer:
        "20 fertige Nischen: Beauty-Salon, Barbershop, Massagestudio, Fitnessstudio, Yoga-Studio, Zahnarztpraxis, medizinische Klinik, Restaurant, Café, Hotel, Autowerkstatt, Reifendienst, Autowäsche, Immobilienagentur, Anwaltskanzlei, Buchhaltung, Bildungszentrum, Logistik, Online-Shop und IT.",
    },
  ],
};

const en: SupportWidgetCopy = {
  button: "Support 24/7",
  title: "Frequently asked questions",
  close: "Close",
  telegram: "Message on Telegram",
  whatsapp: "Message on WhatsApp",
  faq: [
    {
      question: "How much does Website + CRM + Booking cost?",
      answer:
        "€199 / month — Website + CRM + Booking fully configured. Monthly maintenance, technical support, and updates and improvements are included.",
    },
    {
      question: "Is the demo really free?",
      answer:
        "Yes. The demo is free. Fill out a short questionnaire, get a live demo, and pay only after you see the result — and only if you like it.",
    },
    {
      question: "Do I need technical skills?",
      answer:
        "No. No technical skills and no programmers required. Just fill out the questionnaire — the system builds Website + CRM for your niche.",
    },
    {
      question: "How fast is my system ready?",
      answer:
        "In 3 minutes. The questionnaire takes 2–3 minutes, then you get a ready Website + CRM with a unique URL — mobile-friendly on any device.",
    },
    {
      question: "What's included?",
      answer:
        "Professional website for your niche, CRM (customers, bookings, services), online booking and schedule management, automatic customer reminders, gallery, language switching EN / DE / RU, analytics dashboard, and a unique URL.",
    },
    {
      question: "Which niches does it cover?",
      answer:
        "20 ready niches: beauty salon, barbershop, massage studio, fitness club, yoga studio, dentistry, medical clinic, restaurant, café, hotel, auto repair, tire service, car wash, real estate, law firm, accounting, education center, logistics, online store, and IT.",
    },
  ],
};

const ru: SupportWidgetCopy = {
  button: "Поддержка 24/7",
  title: "Часто задаваемые вопросы",
  close: "Закрыть",
  telegram: "Написать в Telegram",
  whatsapp: "Написать в WhatsApp",
  faq: [
    {
      question: "Сколько стоит Сайт + CRM + Бронирование?",
      answer:
        "€199 / месяц — Сайт + CRM + Бронирование полностью настроены. Ежемесячное обслуживание, техническая поддержка, обновления и улучшения включены.",
    },
    {
      question: "Демо действительно бесплатное?",
      answer:
        "Да. Демо — бесплатно. Заполните короткий опросник, получите живое Демо и оплатите только после просмотра — и только если понравится.",
    },
    {
      question: "Нужны ли технические знания?",
      answer:
        "Нет. Без технических знаний и без программистов. Просто заполните опросник — система соберёт Сайт + CRM под вашу нишу.",
    },
    {
      question: "Как быстро будет готово?",
      answer:
        "За 3 минуты. Опросник займёт 2–3 минуты, после чего вы получите готовый Сайт + CRM с уникальным URL — мобильная адаптация для любого устройства.",
    },
    {
      question: "Что входит в продукт?",
      answer:
        "Профессиональный сайт под вашу нишу, CRM (клиенты, записи, услуги), онлайн-запись и управление расписанием, автоматические напоминания, галерея, переключение языков EN / DE / RU, панель аналитики и уникальный URL.",
    },
    {
      question: "Для каких ниш это подходит?",
      answer:
        "20 готовых ниш: салон красоты, барбершоп, массажный салон, фитнес-клуб, йога-студия, стоматология, медицинская клиника, ресторан, кафе, отель, автосервис, шиномонтаж, автомойка, недвижимость, юридическая фирма, бухгалтерия, образование, логистика, интернет-магазин и IT.",
    },
  ],
};

export const supportWidgetCopy: Record<Locale, SupportWidgetCopy> = {
  de,
  en,
  ru,
};
