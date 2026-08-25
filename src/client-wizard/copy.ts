export type UiLang = "en" | "de" | "ru";

export type Sector = { id: string; icon: string; label: string };

export type CopyBundle = {
  s1_label: string;
  s1_h: string;
  s1_sub: string;
  s1_motivation: string;
  s1_placeholder: string;
  s1_headline1: string;
  s1_headline2: string;
  s1_headline3: string;
  s1_what_you_get: string;
  s1_ready_in: string;
  s1_price: string;
  s1_price_label: string;
  s1_price_desc: string;
  s1_flow_steps: { n: string; label: string; sub: string }[];
  s1_benefits: { title: string; sub: string }[];
  s2_label: string;
  s2_h: string;
  s2_motivation: string;
  lbl_name: string;
  ph_name: string;
  lbl_biz: string;
  ph_biz: string;
  err_biz: string;
  lbl_email: string;
  err_name: string;
  err_email: string;
  err_phone: string;
  err_whatsapp: string;
  err_telegram: string;
  lbl_postal: string;
  ph_postal: string;
  err_postal: string;
  lbl_city: string;
  ph_city: string;
  err_city: string;
  lbl_address: string;
  ph_address: string;
  err_address: string;
  agb_accept: string;
  agb_terms: string;
  agb_and: string;
  agb_privacy: string;
  btn_next: string;
  btn_back: string;
  btn_generate: string;
  btn_yes: string;
  btn_no: string;
  btn_restart: string;
  s4_h: string;
  s4_generating: string;
  s4_ready: string;
  s4_publishing: string;
  s4_countdown_finishing: string;
  s4_copy_link: string;
  s4_copied: string;
  s4_open: string;
  s4_public_site_label: string;
  s4_public_site_hint: string;
  s4_jobs_label: string;
  s4_jobs_hint: string;
  s4_booking_label: string;
  s4_booking_hint: string;
  build_steps: string[];
  s5_live: string;
  s5_preview_warming: string;
  s5_q: string;
  s6_pay_h: string;
  s6_pay_button: string;
  s6_pay_subline: string;
  s6_promo_button: string;
  s6_promo_placeholder: string;
  s6_promo_invalid: string;
  s6_promo_unlock: string;
  s4_build_done: string;
  s6_badge: string;
  s6_h: string;
  s6_dl: string;
  dl_domain: string;
  s_processing_title: string;
  s_processing_sub: string;
  s_processing_timeout_title: string;
  s_processing_timeout_sub: string;
  s_processing_contact: string;
  s_payment_error_title: string;
  s_payment_error_sub: string;
  sectors: Sector[];
};

const T: Record<UiLang, CopyBundle> = {
  en: {
    s1_label: "Step 1 of 2",
    s1_h: "Business sector",
    s1_sub: "Select the sector that best describes your business.",
    s1_motivation: "Great! Almost there",
    s1_placeholder: "— Select sector —",
    s1_headline1: "Your business.",
    s1_headline2: "Your freedom.",
    s1_headline3: "We take care of the rest.",
    s1_what_you_get: "What you get",
    s1_ready_in: "Ready in 3 minutes",
    s1_price: "€199",
    s1_price_label: "Monthly",
    s1_price_desc: "Website + CRM fully set up",
    s1_flow_steps: [
      { n: "1", label: "Clients find you", sub: "on Google & Maps" },
      { n: "2", label: "They book online", sub: "in 1 click" },
      { n: "3", label: "Auto-reminders", sub: "stay in touch" },
      { n: "4", label: "More revenue", sub: "more loyal clients" },
    ],
    s1_benefits: [
      { title: "Professional website", sub: "modern & mobile optimized" },
      { title: "CRM & client management", sub: "everything in one place" },
      { title: "Online booking 24/7", sub: "for your clients" },
      { title: "Automatic reminders", sub: "SMS, email or WhatsApp" },
      { title: "Payments & reports", sub: "revenue always in view" },
    ],
    s2_label: "Step 2 of 2",
    s2_h: "Your details",
    s2_motivation: "Last step — and your demo is ready",
    lbl_name: "Your name",
    ph_name: "Anna Müller",
    lbl_biz: "Company / business name",
    ph_biz: "Sunrise Dental",
    err_biz: "Enter your company name",
    lbl_email: "Email",
    err_name: "Enter your name",
    err_email: "Enter a valid email",
    err_phone: "Enter your phone",
    err_whatsapp: "Enter your WhatsApp",
    err_telegram: "Enter your Telegram",
    lbl_postal: "Postal code",
    ph_postal: "80331",
    err_postal: "Enter your postal code",
    lbl_city: "City",
    ph_city: "Berlin",
    err_city: "Enter your city",
    lbl_address: "Address (street, building)",
    ph_address: "Maximilianstraße 1",
    err_address: "Enter your address",
    agb_accept: "I accept the",
    agb_terms: "Terms",
    agb_and: "and",
    agb_privacy: "Privacy Policy",
    btn_next: "Continue →",
    btn_back: "← Back",
    btn_generate: "Generate CRM Demo →",
    btn_yes: "Yes, looks great",
    btn_no: "Regenerate",
    btn_restart: "Start over",
    s4_h: "Assembling your CRM Demo…",
    s4_generating: "Generating your CRM Demo...",
    s4_ready: "Your CRM Demo is ready",
    s4_publishing: "⏳ CRM Demo is publishing... {n} sec left",
    s4_countdown_finishing: "Almost ready… finishing up",
    s4_copy_link: "Copy link",
    s4_copied: "Copied!",
    s4_open: "Open CRM Demo",
    s4_public_site_label: "Your site for customers",
    s4_public_site_hint: "Put this link on Google Maps, Instagram, or your business card.",
    s4_jobs_label: "Jobs page",
    s4_jobs_hint: "Send this link to applicants",
    s4_booking_label: "Booking page",
    s4_booking_hint: "Send this link to your customers",
    build_steps: [
      "Analysing your business",
      "Selecting CRM Demo modules",
      "Building interface",
      "Connecting services",
      "Preparing deployment",
      "Packaging assets",
    ],
    s5_live: "Live Preview",
    s5_preview_warming: "Preparing preview…",
    s5_q: "Do you like the result?",
    s6_pay_h: "Unlock your Website + CRM + Booking",
    s6_pay_button: "€199 — monthly subscription",
    s6_pay_subline: "Billed monthly. Cancel anytime.",
    s6_promo_button: "Promo code",
    s6_promo_placeholder: "Promo code (optional)",
    s6_promo_invalid: "Invalid promo code",
    s6_promo_unlock: "Get for free →",
    s4_build_done: "Your site is ready — review the preview",
    s6_badge: "Platform Ready",
    s6_h: "Your Website + CRM + Booking is ready",
    s6_dl: "Download your result",
    dl_domain: "Domain",
    s_processing_title: "Payment received — preparing your site",
    s_processing_sub: "Your payment was successful. We are publishing your Website + CRM + Booking. This usually takes under a minute.",
    s_processing_timeout_title: "Still preparing your site",
    s_processing_timeout_sub: "This is taking longer than usual. Please contact us and we will help you right away.",
    s_processing_contact: "Contact support",
    s_payment_error_title: "Something went wrong with payment",
    s_payment_error_sub: "We could not confirm your payment. Please contact us and we will sort it out.",
    sectors: [
      { id: "beauty", icon: "💇", label: "Beauty salon" },
      { id: "barbershop", icon: "✂️", label: "Barbershop" },
      { id: "massage", icon: "💆", label: "Massage studio" },
      { id: "fitness", icon: "💪", label: "Fitness club" },
      { id: "yoga", icon: "🧘", label: "Yoga studio" },
      { id: "dental", icon: "🦷", label: "Dentistry" },
      { id: "health", icon: "🏥", label: "Medical clinic" },
      { id: "food", icon: "🍽️", label: "Restaurant" },
      { id: "cafe", icon: "☕", label: "Café" },
      { id: "hotel", icon: "🏨", label: "Hotel" },
      { id: "car_service", icon: "🔧", label: "Auto repair" },
      { id: "tire_service", icon: "🛞", label: "Tire service" },
      { id: "car_wash", icon: "🫧", label: "Car wash" },
      { id: "realestate", icon: "🏠", label: "Real estate agency" },
      { id: "law_firm", icon: "⚖️", label: "Law firm" },
      { id: "accounting", icon: "📊", label: "Accounting services" },
      { id: "education", icon: "🎓", label: "Education center" },
      { id: "logistics", icon: "🚚", label: "Logistics & transport" },
      { id: "shop", icon: "🛍️", label: "Online store" },
      { id: "tech", icon: "💻", label: "IT & technology" },
    ],
  },
  de: {
    s1_label: "Schritt 1 von 2",
    s1_h: "Branche",
    s1_sub: "Wählen Sie die Branche, die Ihr Unternehmen am besten beschreibt.",
    s1_motivation: "Super! Fast geschafft",
    s1_placeholder: "— Branche auswählen —",
    s1_headline1: "Ihr Business.",
    s1_headline2: "Ihre Freiheit.",
    s1_headline3: "Wir kümmern uns um den Rest.",
    s1_what_you_get: "Das erhalten Sie",
    s1_ready_in: "Fertig in 3 Minuten",
    s1_price: "€199",
    s1_price_label: "Monatlich",
    s1_price_desc: "Website + CRM vollständig eingerichtet",
    s1_flow_steps: [
      { n: "1", label: "Kunden finden Sie", sub: "bei Google & Maps" },
      { n: "2", label: "Online-Buchung", sub: "in 1 Klick" },
      { n: "3", label: "Auto-Erinnerungen", sub: "Sie bleiben in Kontakt" },
      { n: "4", label: "Mehr Umsatz", sub: "mehr treue Kunden" },
    ],
    s1_benefits: [
      { title: "Professionelle Website", sub: "modern & mobil optimiert" },
      { title: "CRM & Kundenverwaltung", sub: "alles an einem Ort" },
      { title: "Online-Buchung 24/7", sub: "für Ihre Kunden" },
      { title: "Automatische Erinnerungen", sub: "SMS, E-Mail oder WhatsApp" },
      { title: "Zahlungen & Reports", sub: "Umsatz immer im Blick" },
    ],
    s2_label: "Schritt 2 von 2",
    s2_h: "Ihre Angaben",
    s2_motivation: "Letzter Schritt — und die Demo ist fertig",
    lbl_name: "Ihr Name",
    ph_name: "Anna Müller",
    lbl_biz: "Firmen- / Unternehmensname",
    ph_biz: "Zahnarztpraxis Sonne",
    err_biz: "Firmennamen eingeben",
    lbl_email: "E-Mail",
    err_name: "Namen eingeben",
    err_email: "Gültige E-Mail eingeben",
    err_phone: "Telefonnummer eingeben",
    err_whatsapp: "WhatsApp eingeben",
    err_telegram: "Telegram eingeben",
    lbl_postal: "Postleitzahl",
    ph_postal: "80331",
    err_postal: "Postleitzahl eingeben",
    lbl_city: "Stadt",
    ph_city: "Berlin",
    err_city: "Stadt eingeben",
    lbl_address: "Adresse (Straße, Hausnummer)",
    ph_address: "Maximilianstraße 1",
    err_address: "Adresse eingeben",
    agb_accept: "Ich akzeptiere die",
    agb_terms: "AGB",
    agb_and: "und die",
    agb_privacy: "Datenschutzerklärung",
    btn_next: "Weiter →",
    btn_back: "← Zurück",
    btn_generate: "CRM Demo erstellen →",
    btn_yes: "Ja, sieht gut aus",
    btn_no: "Neu generieren",
    btn_restart: "Von vorne",
    s4_h: "Wir erstellen Ihr CRM Demo…",
    s4_generating: "Wir erstellen Ihr CRM Demo...",
    s4_ready: "Ihr CRM Demo ist bereit",
    s4_publishing: "⏳ CRM Demo wird veröffentlicht... noch {n} Sek",
    s4_countdown_finishing: "Gleich fertig… letzter Schritt",
    s4_copy_link: "Link kopieren",
    s4_copied: "Kopiert!",
    s4_open: "CRM Demo öffnen",
    s4_public_site_label: "Ihre Website für Kunden",
    s4_public_site_hint: "Diesen Link in Google Maps, Instagram oder auf Ihre Visitenkarte setzen.",
    s4_jobs_label: "Stellenangebote-Seite",
    s4_jobs_hint: "Senden Sie diesen Link an Bewerber",
    s4_booking_label: "Buchungsseite",
    s4_booking_hint: "Senden Sie diesen Link an Ihre Kunden",
    build_steps: [
      "Analyse Ihres Unternehmens",
      "Auswahl der CRM-Demo-Module",
      "Oberfläche wird gebaut",
      "Dienste werden verbunden",
      "Deployment wird vorbereitet",
      "Assets werden verpackt",
    ],
    s5_live: "Live-Vorschau",
    s5_preview_warming: "Vorschau wird vorbereitet…",
    s5_q: "Gefällt dir das Ergebnis?",
    s6_pay_h: "Website + CRM + Buchung freischalten",
    s6_pay_button: "€199 — monatliches Abo",
    s6_pay_subline: "Monatliche Abrechnung. Jederzeit kündbar.",
    s6_promo_button: "Promo-Code",
    s6_promo_placeholder: "Promo-Code (optional)",
    s6_promo_invalid: "Ungültiger Promo-Code",
    s6_promo_unlock: "Kostenlos erhalten →",
    s4_build_done: "Deine Seite ist fertig — sieh dir die Vorschau an",
    s6_badge: "Plattform bereit",
    s6_h: "Ihr Website + CRM + Buchung ist fertig",
    s6_dl: "Ergebnis herunterladen",
    dl_domain: "Domain",
    s_processing_title: "Zahlung erhalten — wir bereiten Ihre Seite vor",
    s_processing_sub: "Ihre Zahlung war erfolgreich. Wir veröffentlichen Ihr Website + CRM + Buchung. Das dauert meist unter einer Minute.",
    s_processing_timeout_title: "Ihre Seite wird noch vorbereitet",
    s_processing_timeout_sub: "Das dauert länger als üblich. Schreiben Sie uns — wir helfen sofort.",
    s_processing_contact: "Support kontaktieren",
    s_payment_error_title: "Bei der Zahlung ist etwas schiefgelaufen",
    s_payment_error_sub: "Wir konnten Ihre Zahlung nicht bestätigen. Schreiben Sie uns — wir klären das.",
    sectors: [
      { id: "beauty", icon: "💇", label: "Beauty-Salon" },
      { id: "barbershop", icon: "✂️", label: "Barbershop" },
      { id: "massage", icon: "💆", label: "Massagestudio" },
      { id: "fitness", icon: "💪", label: "Fitnessstudio" },
      { id: "yoga", icon: "🧘", label: "Yoga-Studio" },
      { id: "dental", icon: "🦷", label: "Zahnarztpraxis" },
      { id: "health", icon: "🏥", label: "Medizinische Klinik" },
      { id: "food", icon: "🍽️", label: "Restaurant" },
      { id: "cafe", icon: "☕", label: "Café" },
      { id: "hotel", icon: "🏨", label: "Hotel" },
      { id: "car_service", icon: "🔧", label: "Autowerkstatt" },
      { id: "tire_service", icon: "🛞", label: "Reifendienst" },
      { id: "car_wash", icon: "🫧", label: "Autowäsche" },
      { id: "realestate", icon: "🏠", label: "Immobilienagentur" },
      { id: "law_firm", icon: "⚖️", label: "Anwaltskanzlei" },
      { id: "accounting", icon: "📊", label: "Buchhaltungsservice" },
      { id: "education", icon: "🎓", label: "Bildungszentrum" },
      { id: "logistics", icon: "🚚", label: "Logistik & Transport" },
      { id: "shop", icon: "🛍️", label: "Online-Shop" },
      { id: "tech", icon: "💻", label: "IT & Technologie" },
    ],
  },
  ru: {
    s1_label: "Шаг 1 из 2",
    s1_h: "Сфера бизнеса",
    s1_sub: "Выберите сферу, которая лучше всего описывает ваш бизнес.",
    s1_motivation: "Отлично! Почти готово",
    s1_placeholder: "— Выберите сферу —",
    s1_headline1: "Ваш бизнес.",
    s1_headline2: "Ваша свобода.",
    s1_headline3: "Об остальном позаботимся мы.",
    s1_what_you_get: "Что вы получаете",
    s1_ready_in: "Готово за 3 минуты",
    s1_price: "€199",
    s1_price_label: "Ежемесячно",
    s1_price_desc: "Сайт + CRM полностью настроены",
    s1_flow_steps: [
      { n: "1", label: "Вас находят", sub: "в Google и Maps" },
      { n: "2", label: "Онлайн-запись", sub: "в 1 клик" },
      { n: "3", label: "Авто-напоминания", sub: "остаётесь на связи" },
      { n: "4", label: "Больше дохода", sub: "постоянные клиенты" },
    ],
    s1_benefits: [
      { title: "Профессиональный сайт", sub: "современный и мобильный" },
      { title: "CRM и управление клиентами", sub: "всё в одном месте" },
      { title: "Онлайн-запись 24/7", sub: "для ваших клиентов" },
      { title: "Автоматические напоминания", sub: "SMS, email или WhatsApp" },
      { title: "Платежи и отчёты", sub: "доход всегда под контролем" },
    ],
    s2_label: "Шаг 2 из 2",
    s2_h: "Ваши данные",
    s2_motivation: "Последний шаг — и демо готово",
    lbl_name: "Ваше имя",
    ph_name: "Анна Мюллер",
    lbl_biz: "Название компании / бизнеса",
    ph_biz: "Клиника Солнце",
    err_biz: "Введите название компании",
    lbl_email: "Email",
    err_name: "Введите имя",
    err_email: "Введите корректный email",
    err_phone: "Введите телефон",
    err_whatsapp: "Введите WhatsApp",
    err_telegram: "Введите Telegram",
    lbl_postal: "Индекс",
    ph_postal: "80331",
    err_postal: "Введите индекс",
    lbl_city: "Город",
    ph_city: "Берлин",
    err_city: "Введите город",
    lbl_address: "Адрес (улица, дом)",
    ph_address: "Maximilianstraße 1",
    err_address: "Введите адрес",
    agb_accept: "Я принимаю",
    agb_terms: "условия",
    agb_and: "и",
    agb_privacy: "политику конфиденциальности",
    btn_next: "Продолжить →",
    btn_back: "← Назад",
    btn_generate: "Создать CRM Demo →",
    btn_yes: "Да, отлично",
    btn_no: "Пересобрать",
    btn_restart: "Начать заново",
    s4_h: "Собираем ваш CRM Demo…",
    s4_generating: "Генерируем ваш CRM Demo...",
    s4_ready: "Ваш CRM Demo готов",
    s4_publishing: "⏳ CRM Demo публикуется... осталось {n} сек",
    s4_countdown_finishing: "Почти готово… завершаем сборку",
    s4_copy_link: "Копировать ссылку",
    s4_copied: "Скопировано!",
    s4_open: "Открыть CRM Demo",
    s4_public_site_label: "Ваш сайт для клиентов",
    s4_public_site_hint: "Эту ссылку размещайте в Google Maps, Instagram или на визитке.",
    s4_jobs_label: "Страница вакансий",
    s4_jobs_hint: "Отправьте эту ссылку соискателям",
    s4_booking_label: "Страница бронирования",
    s4_booking_hint: "Отправьте эту ссылку вашим клиентам",
    build_steps: [
      "Анализ бизнеса",
      "Выбор модулей CRM Demo",
      "Сборка интерфейса",
      "Подключение сервисов",
      "Подготовка деплоя",
      "Упаковка активов",
    ],
    s5_live: "Live Preview",
    s5_preview_warming: "Готовим превью…",
    s5_q: "Нравится результат?",
    s6_pay_h: "Откройте доступ к Сайт + CRM + Бронирование",
    s6_pay_button: "€199 — оплата подпиской",
    s6_pay_subline: "Ежемесячная оплата. Отмена в любой момент.",
    s6_promo_button: "Промокод",
    s6_promo_placeholder: "Промо-код (необязательно)",
    s6_promo_invalid: "Неверный промо-код",
    s6_promo_unlock: "Получить бесплатно →",
    s4_build_done: "Сайт готов — смотрите превью",
    s6_badge: "Платформа готова",
    s6_h: "Ваш Сайт + CRM + Бронирование готов",
    s6_dl: "Скачать результат",
    dl_domain: "Домен",
    s_processing_title: "Оплата прошла — готовим ваш сайт",
    s_processing_sub: "Оплата успешна. Мы публикуем ваш Сайт + CRM + Бронирование. Обычно это занимает меньше минуты.",
    s_processing_timeout_title: "Сайт всё ещё готовится",
    s_processing_timeout_sub: "Это занимает дольше обычного. Напишите нам — мы поможем сразу.",
    s_processing_contact: "Написать в поддержку",
    s_payment_error_title: "Что-то пошло не так с оплатой",
    s_payment_error_sub: "Не удалось подтвердить оплату. Напишите нам — мы разберёмся.",
    sectors: [
      { id: "beauty", icon: "💇", label: "Салон красоты" },
      { id: "barbershop", icon: "✂️", label: "Барбершоп" },
      { id: "massage", icon: "💆", label: "Массажный салон" },
      { id: "fitness", icon: "💪", label: "Фитнес-клуб" },
      { id: "yoga", icon: "🧘", label: "Йога-студия" },
      { id: "dental", icon: "🦷", label: "Стоматология" },
      { id: "health", icon: "🏥", label: "Медицинская клиника" },
      { id: "food", icon: "🍽️", label: "Ресторан" },
      { id: "cafe", icon: "☕", label: "Кафе" },
      { id: "hotel", icon: "🏨", label: "Отель" },
      { id: "car_service", icon: "🔧", label: "Автосервис" },
      { id: "tire_service", icon: "🛞", label: "Шиномонтаж" },
      { id: "car_wash", icon: "🫧", label: "Автомойка" },
      { id: "realestate", icon: "🏠", label: "Агентство недвижимости" },
      { id: "law_firm", icon: "⚖️", label: "Юридическая фирма" },
      { id: "accounting", icon: "📊", label: "Бухгалтерские услуги" },
      { id: "education", icon: "🎓", label: "Образовательный центр" },
      { id: "logistics", icon: "🚚", label: "Логистика и перевозки" },
      { id: "shop", icon: "🛍️", label: "Интернет-магазин" },
      { id: "tech", icon: "💻", label: "IT и технологии" },
    ],
  },
};

export function getCopy(lang: UiLang): CopyBundle {
  return T[lang] ?? T.en;
}
