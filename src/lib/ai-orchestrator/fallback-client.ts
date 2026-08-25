// ============================================================
// Smart Fallback — Niche-aware local analysis
// No LLM required. Keyword taxonomy → feature matrix.
// ============================================================

import { AnalyzeIdeaResponse } from "./types";

// ── Niche Taxonomy ─────────────────────────────────────────
const TAXONOMY: Record<string, {
  project_type: string;
  keywords: string[];
  features: string[];
  stack: string;
  risks: string[];
}> = {
  beauty_services: {
    project_type: "Beauty Booking SaaS",
    keywords: ["маникюр", "ногти", "nail", "педикюр", "бьюти", "beauty", "косметолог",
                "барбер", "парикмахер", "барбершоп", "салон красоты", "визажист",
                "мастер", "процедур", "стрижка", "окраска", "массаж", "spa", "спа"],
    features: [
      "Онлайн-запись клиентов",
      "Календарь мастера",
      "База клиентов (CRM)",
      "История посещений",
      "Портфолио работ (фото)",
      "SMS/Email напоминания",
      "Учёт доходов и расходов",
      "Статистика услуг",
      "Управление услугами и ценами",
      "Мобильная версия (PWA)",
      "Мультиязычность (RU/DE/EN)",
      "Подписка и оплата онлайн",
    ],
    stack: "Next.js + Supabase + Stripe + Tailwind CSS",
    risks: [
      "Высокая конкуренция (Treatwell, Booksy)",
      "Низкая цифровая грамотность ЦА",
      "Необходимость локализации для DE рынка",
    ],
  },
  fitness_health: {
    project_type: "Fitness & Health SaaS",
    keywords: ["фитнес", "тренер", "спортзал", "gym", "йога", "yoga", "пилатес",
                "нутрициолог", "диетолог", "тренировки", "workout", "здоровье"],
    features: [
      "Расписание тренировок",
      "Запись на занятия",
      "Профили клиентов",
      "Программы тренировок",
      "Прогресс и статистика",
      "Оплата абонементов",
      "Push-уведомления",
      "Видео-материалы",
      "Мобильное приложение (PWA)",
    ],
    stack: "Next.js + Supabase + Stripe + Tailwind CSS",
    risks: [
      "Конкуренция с Mindbody, ClassPass",
      "Сложность удержания пользователей",
    ],
  },
  education: {
    project_type: "Education Platform SaaS",
    keywords: ["курс", "обучение", "учёба", "репетитор", "школа", "education",
                "урок", "студент", "лекция", "онлайн-школа", "e-learning"],
    features: [
      "Каталог курсов",
      "Видео-уроки",
      "Прогресс студента",
      "Тесты и задания",
      "Сертификаты",
      "Платёжная система",
      "Личный кабинет",
      "Форум / чат",
      "Аффилиатная программа",
    ],
    stack: "Next.js + Supabase + Stripe + Mux Video",
    risks: [
      "Конкуренция с Udemy, Teachable",
      "Высокие затраты на видеохостинг",
    ],
  },
  booking_services: {
    project_type: "Service Booking SaaS",
    keywords: ["запись", "бронирование", "booking", "appointment", "расписание",
                "клининг", "уборка", "ремонт", "мастер", "выезд", "услуги"],
    features: [
      "Онлайн-бронирование",
      "Управление расписанием",
      "База клиентов",
      "Автоматические напоминания",
      "Оплата онлайн",
      "Рейтинг и отзывы",
      "Дашборд аналитики",
      "Мобильная версия",
    ],
    stack: "Next.js + Supabase + Stripe + Cal.com (open source base)",
    risks: [
      "Сложность привлечения первых мастеров",
      "Необходима верификация исполнителей",
    ],
  },
  crm_b2b: {
    project_type: "CRM / B2B SaaS",
    keywords: ["crm", "клиенты", "продажи", "sales", "leads", "лиды", "воронка",
                "pipeline", "b2b", "менеджер", "сделки", "контакты"],
    features: [
      "Управление контактами",
      "Воронка продаж",
      "Задачи и напоминания",
      "Email-интеграция",
      "Аналитика и отчёты",
      "Импорт/экспорт данных",
      "Командная работа",
      "API интеграции",
    ],
    stack: "Next.js + PostgreSQL + Resend + Tailwind CSS",
    risks: [
      "Конкуренция с HubSpot, Pipedrive",
      "Долгий цикл продажи B2B",
    ],
  },
  marketplace: {
    project_type: "Marketplace Platform",
    keywords: ["маркетплейс", "marketplace", "платформа", "аренда", "фриланс",
                "биржа", "объявления", "купить", "продать", "услуги онлайн"],
    features: [
      "Регистрация продавцов и покупателей",
      "Каталог товаров/услуг",
      "Поиск и фильтры",
      "Система отзывов",
      "Безопасные платежи (эскроу)",
      "Чат между сторонами",
      "Комиссионная модель",
      "Панель администратора",
    ],
    stack: "Next.js + Supabase + Stripe Connect + Algolia",
    risks: [
      "Проблема курицы и яйца",
      "Сложность модерации",
      "Высокая стоимость разработки",
    ],
  },
  finance_accounting: {
    project_type: "Finance & Accounting SaaS",
    keywords: ["финансы", "бухгалтерия", "счёт", "invoice", "инвойс", "налоги",
                "расходы", "доходы", "accounting", "букхалтинг", "платежи"],
    features: [
      "Создание счетов (инвойсов)",
      "Учёт доходов и расходов",
      "Категории транзакций",
      "Отчёты и аналитика",
      "Экспорт в PDF/Excel",
      "Интеграция с банком",
      "Налоговые отчёты",
      "Мультивалютность",
    ],
    stack: "Next.js + Supabase + Stripe + PDFKit",
    risks: [
      "Требует соответствия налоговому законодательству",
      "Конкуренция с Lexware, DATEV (DE рынок)",
    ],
  },
  restaurant_food: {
    project_type: "Restaurant & Food SaaS",
    keywords: ["ресторан", "кафе", "доставка еды", "меню", "food", "restaurant",
                "заказ", "кухня", "повар", "кейтеринг", "столик"],
    features: [
      "Онлайн-меню",
      "Приём заказов",
      "Бронирование столиков",
      "Управление доставкой",
      "Касса (POS)",
      "Статистика продаж",
      "Программа лояльности",
      "QR-меню",
    ],
    stack: "Next.js + Supabase + Stripe + Socket.io",
    risks: [
      "Конкуренция с Lieferando, Uber Eats",
      "Сложная логистика доставки",
    ],
  },
  generic_saas: {
    project_type: "SaaS Platform",
    keywords: [],
    features: [
      "Аутентификация пользователей",
      "Личный кабинет (Dashboard)",
      "Управление данными",
      "Аналитика и отчёты",
      "Уведомления (Email/Push)",
      "Платёжная система (Stripe)",
      "API для интеграций",
      "Панель администратора",
      "Мобильная версия (PWA)",
    ],
    stack: "Next.js + Supabase + Stripe + Tailwind CSS",
    risks: [
      "Нечёткое позиционирование",
      "Сложность определения ЦА",
    ],
  },
};

// ── Niche Classifier ───────────────────────────────────────
function classifyNiche(idea: string): string {
  const text = idea.toLowerCase();
  let bestMatch = "generic_saas";
  let bestScore = 0;

  for (const [nicheKey, niche] of Object.entries(TAXONOMY)) {
    if (nicheKey === "generic_saas") continue;
    const score = niche.keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = nicheKey;
    }
  }

  return bestMatch;
}

// ── Smart Fallback Builder ─────────────────────────────────
export function buildSmartFallbackAnalysis(
  idea: string,
  language: string = "ru"
): AnalyzeIdeaResponse {
  const nicheKey = classifyNiche(idea);
  const niche = TAXONOMY[nicheKey];

  console.log(`[SmartFallback] Detected niche: ${nicheKey} (${niche.project_type})`);

  const summary =
    language === "de"
      ? `Lokale Analyse: ${niche.project_type}. Basierend auf Schlüsselwörtern erkannt. KI-API nicht verfügbar.`
      : language === "en"
      ? `Local analysis: ${niche.project_type}. Detected from keywords. AI API unavailable.`
      : `Локальный анализ: ${niche.project_type}. Определено по ключевым словам. AI API недоступен.`;

  const nextSteps =
    language === "ru"
      ? [
          "Провести анализ конкурентов в нише",
          "Определить MVP (минимальный набор функций)",
          "Настроить Supabase проект и схему БД",
          "Развернуть Next.js на Vercel/Netlify",
          "Добавить Stripe для монетизации",
          "Провести тест с 3-5 реальными пользователями",
        ]
      : [
          "Analyze competitors in the niche",
          "Define MVP feature set",
          "Set up Supabase project and DB schema",
          "Deploy Next.js to Vercel/Netlify",
          "Add Stripe for monetization",
          "Test with 3-5 real users",
        ];

  return {
    status: "ok",
    provider: "fallback",
    idea,
    summary,
    project_type: niche.project_type,
    recommended_stack: niche.stack,
    mvp_features: niche.features,
    risks: niche.risks,
    next_steps: nextSteps,
    generated_at: new Date().toISOString(),
    idea_analysis: `[Fallback Mode] Ниша определена локально: ${niche.project_type}. Для полного анализа требуется Claude API. Ключ: ANTHROPIC_API_KEY в .env.local`,
  };
}
