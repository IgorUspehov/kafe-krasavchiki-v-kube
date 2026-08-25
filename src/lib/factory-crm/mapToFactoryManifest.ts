/**
 * Maps saas-mvp-funnel MVP manifest → Factory-Website-CRM Manifest 1.0
 * Used by prepareClientDist to inject window.__FACTORY_BOOTSTRAP__.
 */

export type FactoryLanguage = "en" | "de" | "ru";

export type FactoryManifest = {
  schemaVersion: "1.0";
  generatedAt: string;
  metadata: {
    projectId: string;
    studioId: string;
    clientId: string;
    createdAt: string;
    updatedAt: string;
    manifestVersion: string;
    engineVersion: string;
  };
  ownership: {
    ownershipMode: "studio_owned" | "client_owned" | "white_label";
    studioBrand: string;
    clientBrand: string;
  };
  business: {
    name: string;
    sector: string;
    city: string;
    language: FactoryLanguage;
    phone: string;
    whatsapp?: string;
    email: string;
    website?: string;
  };
  website: {
    sections: string[];
    themeKey: string;
    imageSourceKey: string;
  };
  crm: {
    modules: string[];
    bookingModule: string;
    reviewModule: string;
    notificationChannels: string[];
    reviewFlow: {
      enabled: boolean;
      steps: Array<{
        stepKey: string;
        delayHours: number;
        channel: string;
        enabled: boolean;
      }>;
    };
    vocabularyKey?: string;
  };
  delivery: {
    firebaseConfigMock: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
    };
    readmeSections: string[];
    actions: {
      zip: { status: "mock"; label: string; mock: true };
      github: { status: "mock"; label: string; mock: true };
      firebase: { status: "mock"; label: string; mock: true };
      deploy: { status: "mock"; label: string; mock: true };
    };
  };
  branding?: {
    primaryColorHex?: string;
  };
};

/** Funnel businessType → Factory sector key */
const BUSINESS_TYPE_TO_SECTOR: Record<string, string> = {
  restaurant: "restaurant",
  dental_clinic: "dental_clinic",
  beauty_salon: "beauty_salon",
  massage_salon: "massage",
  massage: "massage",
  fitness_club: "fitness",
  fitness: "fitness",
  car_service: "auto_service",
  hotel_booking: "hotel",
  hotel: "hotel",
  real_estate: "real_estate",
  education: "education",
  cleaning_service: "cleaning",
  health_clinic: "dental_clinic",
  veterinary_clinic: "dental_clinic",
  barbershop: "barber",
  technology: "accounting",
  ecommerce: "real_estate",
  logistics: "construction",
};

const SECTOR_IMAGE: Record<string, string> = {
  restaurant: "pexels_restaurant",
  dental_clinic: "pexels_dental",
  beauty_salon: "pexels_beauty",
  massage: "pexels_massage",
  fitness: "pexels_fitness",
  auto_service: "pexels_auto",
  hotel: "pexels_hotel",
  real_estate: "pexels_real_estate",
  education: "pexels_education",
  cleaning: "pexels_cleaning",
  barber: "pexels_barber",
  construction: "pexels_construction",
  accounting: "pexels_office",
};

const ALL_SECTIONS = [
  "hero",
  "about",
  "services",
  "gallery",
  "booking",
  "testimonials",
  "faq",
  "contacts",
  "google_maps",
  "whatsapp",
  "email_section",
];

const ALL_CRM_MODULES = [
  "dashboard",
  "customers",
  "bookings",
  "services",
  "calendar",
  "employees",
  "notifications",
  "settings",
  "review_requests",
];

function pickString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function mapLanguage(raw: unknown): FactoryLanguage {
  const v = String(raw ?? "en").toLowerCase().slice(0, 2);
  if (v === "de" || v === "ru" || v === "en") return v;
  return "en";
}

function mapSector(businessType: string): string {
  const key = businessType.trim().toLowerCase().replace(/-/g, "_");
  return BUSINESS_TYPE_TO_SECTOR[key] ?? "beauty_salon";
}

function hashId(input: string, prefix: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    hash = hash >>> 0;
  }
  return `${prefix}_${hash.toString(16).padStart(8, "0")}`;
}

export type FunnelManifestLike = Record<string, unknown>;

export function mapToFactoryManifest(
  funnelManifest: FunnelManifestLike,
  clientId: string,
): FactoryManifest {
  const businessType = pickString(funnelManifest.businessType, "beauty_salon");
  const sector = mapSector(businessType);
  const name = pickString(funnelManifest.businessName, "Business");
  const now = new Date().toISOString();
  const language = mapLanguage(funnelManifest.language);
  const phone = pickString(funnelManifest.phone, "+49 000 0000000");
  const email = pickString(funnelManifest.email, "hello@example.com");
  const city = pickString(funnelManifest.city, "City");
  const primaryColor = pickString(
    funnelManifest.primaryColor ??
      (funnelManifest.theme as { accent?: string } | undefined)?.accent,
    "#6C3BFF",
  );
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business";

  const whatsapp =
    pickString(funnelManifest.whatsapp) ||
    pickString((funnelManifest.client_contacts as { whatsapp?: string } | undefined)?.whatsapp) ||
    undefined;

  return {
    schemaVersion: "1.0",
    generatedAt: now,
    metadata: {
      projectId: hashId(`${name}|${sector}|${clientId}`, "proj"),
      studioId: hashId("factory-studio", "studio"),
      clientId: hashId(clientId, "client"),
      createdAt: now,
      updatedAt: now,
      manifestVersion: "1.0.0",
      engineVersion: "1.0.0",
    },
    ownership: {
      ownershipMode: "client_owned",
      studioBrand: "Factory Website+CRM",
      clientBrand: name,
    },
    business: {
      name,
      sector,
      city,
      language,
      phone,
      whatsapp,
      email,
    },
    website: {
      sections: ALL_SECTIONS,
      themeKey: "modern_light",
      imageSourceKey: SECTOR_IMAGE[sector] ?? "pexels_office",
    },
    crm: {
      modules: ALL_CRM_MODULES,
      bookingModule: "time_slots",
      reviewModule: "google_review_link",
      notificationChannels: whatsapp ? ["whatsapp", "email"] : ["email"],
      vocabularyKey: sector,
      reviewFlow: {
        enabled: true,
        steps: [
          { stepKey: "booking_confirmation", delayHours: 0, channel: "internal", enabled: true },
          { stepKey: "crm_record", delayHours: 0, channel: "internal", enabled: true },
          { stepKey: "whatsapp_followup", delayHours: 2, channel: "whatsapp", enabled: Boolean(whatsapp) },
          { stepKey: "email_followup", delayHours: 24, channel: "email", enabled: true },
          { stepKey: "google_review_request", delayHours: 48, channel: "email", enabled: true },
        ],
      },
    },
    delivery: {
      firebaseConfigMock: {
        apiKey: "AIzaSy-MOCK-KEY-REPLACE-WITH-REAL",
        authDomain: `${slug}.firebaseapp.com`,
        projectId: slug,
        storageBucket: `${slug}.appspot.com`,
        messagingSenderId: "000000000000",
        appId: "1:000000000000:web:0000000000000000000000",
      },
      readmeSections: ["project_overview", "firebase_setup", "deployment"],
      actions: {
        zip: { status: "mock", label: "Download ZIP", mock: true },
        github: { status: "mock", label: "Push to GitHub", mock: true },
        firebase: { status: "mock", label: "Connect Firebase", mock: true },
        deploy: { status: "mock", label: "Deploy to Hosting", mock: true },
      },
    },
    branding: {
      primaryColorHex: primaryColor,
    },
  };
}

export type FactoryBootstrapPayload = {
  clientId: string;
  mode: "product";
  manifest: FactoryManifest;
  siteUrl?: string;
  firebaseReady?: boolean;
};

export function buildFactoryBootstrap(
  funnelManifest: FunnelManifestLike,
  clientId: string,
  siteUrl?: string,
): FactoryBootstrapPayload {
  return {
    clientId,
    mode: "product",
    manifest: mapToFactoryManifest(funnelManifest, clientId),
    siteUrl,
    firebaseReady: false,
  };
}
