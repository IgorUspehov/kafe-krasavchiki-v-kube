import type { WizardSectorId } from "@/lib/niche-sectors";
import { WIZARD_SECTOR_IDS } from "@/lib/niche-sectors";

export type LeadFlowMode = "appointment" | "order" | "reservation" | "inquiry";

export type LocalizedLabel = { en: string; de: string; ru: string };

/** Which array inside niche-scenarios `records` is the CRM catalog. */
export type CatalogRecordKey =
  | "services"
  | "menu"
  | "products"
  | "courses"
  | "classes"
  | "subscriptions";

export type SectorModel = {
  sectorId: WizardSectorId;
  businessType: string;
  /** Scenario JSON key (usually = businessType). */
  scenarioKey: string;
  mode: LeadFlowMode;
  catalogKey: CatalogRecordKey;
  /** Niche title (site badge / settings). */
  niche: LocalizedLabel;
  party: LocalizedLabel;
  staff: LocalizedLabel;
  catalog: LocalizedLabel;
  booking: LocalizedLabel;
  publicCta: LocalizedLabel;
  crmAddCta: LocalizedLabel;
  /** CRM payments link to this entity collection/tab. */
  paymentSource: "appointments" | "orders" | "reservations" | "inquiries";
  /** Fallback catalog names when scenario.records[catalogKey] is empty. */
  seedCatalog: LocalizedLabel[];
};

function L(en: string, de: string, ru: string): LocalizedLabel {
  return { en, de, ru };
}

/**
 * Explicit sectorId → CRM model. No substring matching.
 * Source of truth for wizard niches (WIZARD_SECTOR_IDS only).
 */
export const SECTOR_MODELS: Record<WizardSectorId, SectorModel> = {
  beauty: {
    sectorId: "beauty",
    businessType: "beauty_salon",
    scenarioKey: "beauty_salon",
    mode: "appointment",
    paymentSource: "appointments",
    catalogKey: "services",
    niche: L("Beauty Salon", "Beauty-Salon", "Салон красоты"),
    party: L("Clients", "Kunden", "Клиенты"),
    staff: L("Stylists", "Stylisten", "Мастера"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Appointments", "Termine", "Записи"),
    publicCta: L("Book now", "Termin buchen", "Записаться"),
    crmAddCta: L("Add appointment", "Termin hinzufügen", "Добавить запись"),
    seedCatalog: [
      L("Haircut", "Haarschnitt", "Стрижка"),
      L("Coloring", "Färbung", "Окрашивание"),
      L("Styling", "Styling", "Укладка"),
    ],
  },
  barbershop: {
    sectorId: "barbershop",
    businessType: "barbershop",
    scenarioKey: "barbershop",
    mode: "appointment",
    paymentSource: "appointments",
    catalogKey: "services",
    niche: L("Barbershop", "Barbershop", "Барбершоп"),
    party: L("Clients", "Kunden", "Клиенты"),
    staff: L("Barbers", "Barbiere", "Барберы"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Appointments", "Termine", "Записи"),
    publicCta: L("Book now", "Termin buchen", "Записаться"),
    crmAddCta: L("Add appointment", "Termin hinzufügen", "Добавить запись"),
    seedCatalog: [
      L("Classic haircut", "Klassischer Haarschnitt", "Классическая стрижка"),
      L("Beard trim", "Bartpflege", "Борода"),
      L("Hot towel shave", "Rasur mit Hot Towel", "Бритьё"),
    ],
  },
  massage: {
    sectorId: "massage",
    businessType: "massage_salon",
    scenarioKey: "massage_salon",
    mode: "appointment",
    paymentSource: "appointments",
    catalogKey: "services",
    niche: L("Massage Studio", "Massagestudio", "Массажный салон"),
    party: L("Clients", "Kunden", "Клиенты"),
    staff: L("Therapists", "Therapeuten", "Массажисты"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Appointments", "Termine", "Записи"),
    publicCta: L("Book now", "Termin buchen", "Записаться"),
    crmAddCta: L("Add appointment", "Termin hinzufügen", "Добавить запись"),
    seedCatalog: [
      L("Classic massage", "Klassische Massage", "Классический массаж"),
      L("Sports massage", "Sportmassage", "Спортивный массаж"),
      L("Anti-stress massage", "Anti-Stress-Massage", "Антистресс массаж"),
    ],
  },
  fitness: {
    sectorId: "fitness",
    businessType: "fitness_club",
    scenarioKey: "fitness_club",
    mode: "appointment",
    paymentSource: "appointments",
    catalogKey: "classes",
    niche: L("Fitness Club", "Fitnessstudio", "Фитнес-клуб"),
    party: L("Members", "Mitglieder", "Участники"),
    staff: L("Trainers", "Trainer", "Тренеры"),
    catalog: L("Classes", "Kurse", "Занятия"),
    booking: L("Bookings", "Buchungen", "Записи"),
    publicCta: L("Book a class", "Kurs buchen", "Записаться на занятие"),
    crmAddCta: L("Add booking", "Buchung hinzufügen", "Добавить запись"),
    seedCatalog: [
      L("Morning yoga", "Morgen-Yoga", "Утренняя йога"),
      L("HIIT workout", "HIIT-Training", "HIIT тренировка"),
      L("Cycling", "Radfahren", "Велотренировка"),
    ],
  },
  yoga: {
    sectorId: "yoga",
    businessType: "fitness_club",
    scenarioKey: "fitness_club",
    mode: "appointment",
    paymentSource: "appointments",
    catalogKey: "classes",
    niche: L("Yoga Studio", "Yoga-Studio", "Йога-студия"),
    party: L("Members", "Mitglieder", "Участники"),
    staff: L("Instructors", "Lehrer", "Инструкторы"),
    catalog: L("Classes", "Kurse", "Занятия"),
    booking: L("Bookings", "Buchungen", "Записи"),
    publicCta: L("Book a class", "Kurs buchen", "Записаться на занятие"),
    crmAddCta: L("Add booking", "Buchung hinzufügen", "Добавить запись"),
    seedCatalog: [
      L("Morning yoga", "Morgen-Yoga", "Утренняя йога"),
      L("HIIT workout", "HIIT-Training", "HIIT тренировка"),
      L("Cycling", "Radfahren", "Велотренировка"),
    ],
  },
  dental: {
    sectorId: "dental",
    businessType: "dental_clinic",
    scenarioKey: "dental_clinic",
    mode: "appointment",
    paymentSource: "appointments",
    catalogKey: "services",
    niche: L("Dental Clinic", "Zahnarztpraxis", "Стоматология"),
    party: L("Patients", "Patienten", "Пациенты"),
    staff: L("Dentists", "Zahnärzte", "Врачи"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Appointments", "Termine", "Приёмы"),
    publicCta: L("Book now", "Termin buchen", "Записаться"),
    crmAddCta: L("Add appointment", "Termin hinzufügen", "Добавить приём"),
    seedCatalog: [
      L("Check-up", "Kontrolle", "Осмотр"),
      L("Cleaning", "Zahnreinigung", "Чистка"),
      L("Filling", "Füllung", "Пломба"),
    ],
  },
  health: {
    sectorId: "health",
    businessType: "health_clinic",
    scenarioKey: "health_clinic",
    mode: "appointment",
    paymentSource: "appointments",
    catalogKey: "services",
    niche: L("Medical Clinic", "Medizinische Klinik", "Медицинская клиника"),
    party: L("Patients", "Patienten", "Пациенты"),
    staff: L("Doctors", "Ärzte", "Врачи"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Appointments", "Termine", "Приёмы"),
    publicCta: L("Book now", "Termin buchen", "Записаться"),
    crmAddCta: L("Add appointment", "Termin hinzufügen", "Добавить приём"),
    seedCatalog: [
      L("General check-up", "Allgemeine Untersuchung", "Общий осмотр"),
      L("Ultrasound", "Ultraschall", "УЗИ"),
      L("ECG", "EKG", "Кардиограмма"),
    ],
  },
  food: {
    sectorId: "food",
    businessType: "restaurant",
    scenarioKey: "restaurant",
    mode: "reservation",
    paymentSource: "reservations",
    catalogKey: "menu",
    niche: L("Restaurant", "Restaurant", "Ресторан"),
    party: L("Guests", "Gäste", "Гости"),
    staff: L("Staff", "Personal", "Персонал"),
    catalog: L("Menu", "Speisekarte", "Меню"),
    booking: L("Reservations", "Reservierungen", "Бронирования"),
    publicCta: L("Reserve a table", "Tisch reservieren", "Забронировать столик"),
    crmAddCta: L("Add reservation", "Reservierung hinzufügen", "Добавить бронирование"),
    seedCatalog: [
      L("Business lunch", "Business-Lunch", "Бизнес-ланч"),
      L("Pasta carbonara", "Pasta Carbonara", "Паста карбонара"),
      L("Tiramisu", "Tiramisu", "Тирамису"),
    ],
  },
  cafe: {
    sectorId: "cafe",
    businessType: "restaurant",
    scenarioKey: "restaurant",
    mode: "reservation",
    paymentSource: "reservations",
    catalogKey: "menu",
    niche: L("Café", "Café", "Кафе"),
    party: L("Guests", "Gäste", "Гости"),
    staff: L("Staff", "Personal", "Персонал"),
    catalog: L("Menu", "Speisekarte", "Меню"),
    booking: L("Reservations", "Reservierungen", "Бронирования"),
    publicCta: L("Reserve a table", "Tisch reservieren", "Забронировать столик"),
    crmAddCta: L("Add reservation", "Reservierung hinzufügen", "Добавить бронирование"),
    seedCatalog: [
      L("Business lunch", "Business-Lunch", "Бизнес-ланч"),
      L("Pasta carbonara", "Pasta Carbonara", "Паста карбонара"),
      L("Tiramisu", "Tiramisu", "Тирамису"),
    ],
  },
  hotel: {
    sectorId: "hotel",
    businessType: "hotel_booking",
    scenarioKey: "hotel_booking",
    mode: "reservation",
    paymentSource: "reservations",
    catalogKey: "services",
    niche: L("Hotel", "Hotel", "Отель"),
    party: L("Guests", "Gäste", "Гости"),
    staff: L("Staff", "Personal", "Персонал"),
    catalog: L("Room types", "Zimmertypen", "Типы номеров"),
    booking: L("Reservations", "Reservierungen", "Бронирования"),
    publicCta: L("Book a room", "Zimmer buchen", "Забронировать номер"),
    crmAddCta: L("Add reservation", "Reservierung hinzufügen", "Добавить бронирование"),
    seedCatalog: [
      L("Standard room", "Standardzimmer", "Стандартный номер"),
      L("Deluxe room", "Deluxe-Zimmer", "Делюкс"),
      L("Suite", "Suite", "Сьют"),
    ],
  },
  car_service: {
    sectorId: "car_service",
    businessType: "car_service",
    scenarioKey: "car_service",
    mode: "order",
    paymentSource: "orders",
    catalogKey: "services",
    niche: L("Auto Repair", "Autowerkstatt", "Автосервис"),
    party: L("Clients", "Kunden", "Клиенты"),
    staff: L("Mechanics", "Mechaniker", "Механики"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Work orders", "Aufträge", "Заказы"),
    publicCta: L("Request service", "Service anfragen", "Оставить заказ"),
    crmAddCta: L("Add work order", "Auftrag hinzufügen", "Добавить заказ"),
    seedCatalog: [
      L("Oil change", "Ölwechsel", "Замена масла"),
      L("Brake service", "Bremsenservice", "Тормоза"),
      L("Diagnostics", "Diagnose", "Диагностика"),
    ],
  },
  tire_service: {
    sectorId: "tire_service",
    businessType: "car_service",
    scenarioKey: "car_service",
    mode: "order",
    paymentSource: "orders",
    catalogKey: "services",
    niche: L("Tire Service", "Reifendienst", "Шиномонтаж"),
    party: L("Clients", "Kunden", "Клиенты"),
    staff: L("Technicians", "Techniker", "Мастера"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Work orders", "Aufträge", "Заказы"),
    publicCta: L("Request service", "Service anfragen", "Оставить заказ"),
    crmAddCta: L("Add work order", "Auftrag hinzufügen", "Добавить заказ"),
    seedCatalog: [
      L("Tire change", "Reifenwechsel", "Замена шин"),
      L("Balancing", "Auswuchten", "Балансировка"),
      L("Puncture repair", "Reifenreparatur", "Ремонт прокола"),
    ],
  },
  car_wash: {
    sectorId: "car_wash",
    businessType: "car_wash",
    scenarioKey: "car_wash",
    mode: "order",
    paymentSource: "orders",
    catalogKey: "services",
    niche: L("Car Wash", "Autowäsche", "Автомойка"),
    party: L("Customers", "Kunden", "Клиенты"),
    staff: L("Employees", "Mitarbeiter", "Сотрудники"),
    catalog: L("Wash Services", "Waschleistungen", "Услуги мойки"),
    booking: L("Wash Orders", "Waschaufträge", "Заказы на мойку"),
    publicCta: L("Book a wash", "Wäsche buchen", "Заказать мойку"),
    crmAddCta: L("Add Wash Order", "Waschauftrag hinzufügen", "Добавить заказ на мойку"),
    seedCatalog: [
      L("Exterior wash", "Außenwäsche", "Мойка кузова"),
      L("Interior cleaning", "Innenreinigung", "Салон"),
      L("Full wash", "Komplettwäsche", "Комплекс"),
    ],
  },
  realestate: {
    sectorId: "realestate",
    businessType: "real_estate",
    scenarioKey: "real_estate",
    mode: "inquiry",
    paymentSource: "inquiries",
    catalogKey: "services",
    niche: L("Real Estate Agency", "Immobilienagentur", "Агентство недвижимости"),
    party: L("Clients", "Kunden", "Клиенты"),
    staff: L("Agents", "Makler", "Агенты"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Viewings", "Besichtigungen", "Показы"),
    publicCta: L("Request a viewing", "Besichtigung anfragen", "Запросить показ"),
    crmAddCta: L("Add viewing", "Besichtigung hinzufügen", "Добавить показ"),
    seedCatalog: [
      L("Apartment viewing", "Wohnungsbesichtigung", "Показ квартиры"),
      L("House viewing", "Hausbesichtigung", "Показ дома"),
      L("Consultation", "Beratung", "Консультация"),
    ],
  },
  law_firm: {
    sectorId: "law_firm",
    businessType: "law_firm",
    scenarioKey: "law_firm",
    mode: "inquiry",
    paymentSource: "inquiries",
    catalogKey: "services",
    niche: L("Law Firm", "Anwaltskanzlei", "Юридическая фирма"),
    party: L("Clients", "Mandanten", "Клиенты"),
    staff: L("Lawyers", "Anwälte", "Юристы"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Meetings", "Termine", "Встречи"),
    publicCta: L("Request consultation", "Beratung anfragen", "Запросить консультацию"),
    crmAddCta: L("Add meeting", "Termin hinzufügen", "Добавить встречу"),
    seedCatalog: [
      L("Legal consultation", "Rechtsberatung", "Юридическая консультация"),
      L("Contract review", "Vertragsprüfung", "Проверка договора"),
      L("Representation", "Vertretung", "Представительство"),
    ],
  },
  accounting: {
    sectorId: "accounting",
    businessType: "accounting",
    scenarioKey: "accounting",
    mode: "inquiry",
    paymentSource: "inquiries",
    catalogKey: "services",
    niche: L("Accounting", "Buchhaltung", "Бухгалтерия"),
    party: L("Clients", "Mandanten", "Клиенты"),
    staff: L("Accountants", "Buchhalter", "Бухгалтеры"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Meetings", "Termine", "Встречи"),
    publicCta: L("Request consultation", "Beratung anfragen", "Запросить консультацию"),
    crmAddCta: L("Add meeting", "Termin hinzufügen", "Добавить встречу"),
    seedCatalog: [
      L("Tax consultation", "Steuerberatung", "Налоговая консультация"),
      L("Bookkeeping", "Buchführung", "Ведение учёта"),
      L("Annual closing", "Jahresabschluss", "Годовая отчётность"),
    ],
  },
  education: {
    sectorId: "education",
    businessType: "education",
    scenarioKey: "education",
    mode: "appointment",
    paymentSource: "appointments",
    catalogKey: "courses",
    niche: L("Education Center", "Bildungszentrum", "Образовательный центр"),
    party: L("Students", "Schüler", "Студенты"),
    staff: L("Teachers", "Lehrer", "Преподаватели"),
    catalog: L("Courses", "Kurse", "Курсы"),
    booking: L("Lessons", "Unterricht", "Занятия"),
    publicCta: L("Book a lesson", "Unterricht buchen", "Записаться на занятие"),
    crmAddCta: L("Add lesson", "Unterricht hinzufügen", "Добавить занятие"),
    seedCatalog: [
      L("German B2", "Deutsch B2", "Немецкий B2"),
      L("English A2", "Englisch A2", "Английский A2"),
      L("Math basics", "Mathe-Grundlagen", "Основы математики"),
    ],
  },
  logistics: {
    sectorId: "logistics",
    businessType: "logistics",
    scenarioKey: "logistics",
    mode: "order",
    paymentSource: "orders",
    catalogKey: "services",
    niche: L("Logistics & Transport", "Logistik & Transport", "Логистика и перевозки"),
    party: L("Clients", "Kunden", "Клиенты"),
    staff: L("Drivers", "Fahrer", "Водители"),
    catalog: L("Services", "Leistungen", "Услуги"),
    booking: L("Orders", "Aufträge", "Заказы"),
    publicCta: L("Request delivery", "Lieferung anfragen", "Заказать доставку"),
    crmAddCta: L("Add order", "Auftrag hinzufügen", "Добавить заказ"),
    seedCatalog: [
      L("City delivery", "Stadtlieferung", "Городская доставка"),
      L("Express", "Express", "Экспресс"),
      L("Warehouse pickup", "Lagerabholung", "Забор со склада"),
    ],
  },
  shop: {
    sectorId: "shop",
    businessType: "ecommerce",
    scenarioKey: "ecommerce",
    mode: "order",
    paymentSource: "orders",
    catalogKey: "products",
    niche: L("Online Store", "Online-Shop", "Интернет-магазин"),
    party: L("Customers", "Kunden", "Покупатели"),
    staff: L("Staff", "Mitarbeiter", "Сотрудники"),
    catalog: L("Products", "Produkte", "Товары"),
    booking: L("Orders", "Bestellungen", "Заказы"),
    publicCta: L("Place order", "Bestellung aufgeben", "Оформить заказ"),
    crmAddCta: L("Add order", "Bestellung hinzufügen", "Добавить заказ"),
    seedCatalog: [
      L("Wireless headphones", "Kabellose Kopfhörer", "Беспроводные наушники"),
      L("Smart watch", "Smartwatch", "Умные часы"),
      L("Power bank", "Powerbank", "Пауэрбанк"),
    ],
  },
  tech: {
    sectorId: "tech",
    businessType: "technology",
    scenarioKey: "technology",
    mode: "order",
    paymentSource: "orders",
    catalogKey: "products",
    niche: L("IT & Technology", "IT & Technologie", "IT и технологии"),
    party: L("Clients", "Kunden", "Клиенты"),
    staff: L("Developers", "Entwickler", "Разработчики"),
    catalog: L("Products", "Produkte", "Продукты"),
    booking: L("Orders", "Aufträge", "Заказы"),
    publicCta: L("Place order", "Auftrag anfragen", "Оформить заказ"),
    crmAddCta: L("Add order", "Auftrag hinzufügen", "Добавить заказ"),
    seedCatalog: [
      L("Website package", "Website-Paket", "Пакет сайта"),
      L("CRM setup", "CRM-Einrichtung", "Настройка CRM"),
      L("Support plan", "Support-Plan", "План поддержки"),
    ],
  },
};

export function getSectorModel(sectorId: string): SectorModel | null {
  const key = String(sectorId || "")
    .trim()
    .toLowerCase() as WizardSectorId;
  if ((WIZARD_SECTOR_IDS as readonly string[]).includes(key)) {
    return SECTOR_MODELS[key];
  }
  return null;
}

export function getSectorModelByBusinessType(businessType: string): SectorModel | null {
  const bt = String(businessType || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/_crm$/, "");
  // Prefer exact sector matches; yoga/fitness share fitness_club — fitness first is ok for mode.
  for (const id of WIZARD_SECTOR_IDS) {
    if (SECTOR_MODELS[id].businessType === bt) return SECTOR_MODELS[id];
  }
  return null;
}

export function pickLocalized(
  value: LocalizedLabel | string | Record<string, string> | undefined,
  lang: "en" | "de" | "ru",
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const v = value as Record<string, string>;
  return v[lang] || v.en || v.de || v.ru || "";
}
