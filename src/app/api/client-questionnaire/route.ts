import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";
import { NextResponse } from "next/server";

import { getFirestoreDb } from "@/lib/firebase/admin";
import { DEFAULT_BUSINESS_TYPE, SECTOR_ID_TO_BUSINESS_TYPE } from "@/lib/sector-mapping";
import { buildCommercialData } from "@/lib/payment/payment-service";
import { notifyNewLead } from "@/lib/leads/notify-lead";
import { cleanupClientDist, prepareClientDistWithOgImage } from "@/lib/og-image/prepare-client-dist";
import {
  buildDemoSlug,
  buildPreviewBranch,
  deployDistToPages,
  ensureSharedPagesProject,
  isCloudflareDeployConfigured,
  logCloudflareEnvPresence,
  resolveMvpDistPath,
} from "@/lib/cloudflare/deploy";
import { upsertDemoRecord } from "@/lib/cloudflare/demo-registry";
import { persistDemoDeployment } from "@/lib/billing/paid-tenant";
import {
  pruneSharedProjectDeployments,
  getCrmDemoTtlMs,
  scheduleDeletion,
  startDeletionScheduler,
} from "@/lib/cloudflare/scheduler";
import {
  buildReadableDemoUrl,
  buildReadablePublicSiteUrl,
} from "@/lib/cloudflare/shared-project";
import {
  buildMvpRedirectUrl,
  saveClientManifest,
} from "@/lib/manifest/storage";
import { runStorageCleanup } from "@/lib/manifest/storage-manager";
import { normalizeManifestMedia } from "@/lib/manifest/normalize-manifest-media";
import palettesData from "@/lib/palettes.json";
import promotionsData from "@/lib/niche-promotions.json";
import { pickRandomGalleryPhotos, pickRandomHeroPhoto } from "@/lib/manifest/niche-media";
import { pickNicheScenario } from "@/lib/manifest/niche-scenario";
import {
  assertValidClientManifest,
  validateManifestWithOptionalCorrection,
} from "@/lib/manifest/validate-and-correct";
import { persistClientDistSnapshot } from "@/lib/site-delivery/dist-store";

const sectorMapping = { sector_id_to_business_type: SECTOR_ID_TO_BUSINESS_TYPE };

const QUESTIONNAIRE_PATH = path.join(process.cwd(), "input/client_onboarding_questionnaire.json");
const CLIENTS_COLLECTION = "clients";

async function saveClientRecordToFirestore(input: {
  clientId: string;
  payload: Record<string, unknown>;
  manifest: Record<string, unknown>;
}): Promise<void> {
  const { clientId, payload, manifest } = input;
  await getFirestoreDb()
    .collection(CLIENTS_COLLECTION)
    .doc(clientId)
    .set(
      {
        name: payload.name,
        businessName: payload.business_name,
        businessType: payload.business_type,
        sectorId: payload.sector_id || null,
        email: payload.email,
        phone: payload.phone,
        whatsapp: payload.whatsapp,
        telegram: payload.telegram,
        city: payload.city,
        address: payload.address,
        postalCode: payload.postal_code,
        language: payload.language,
        questionnaire: payload,
        manifest,
        source: "client_questionnaire",
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

/** Safe post-deploy probe — never logs secrets or full HTML. */
async function logDeployedSiteProbe(siteUrl: string): Promise<void> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(siteUrl, {
        method: "GET",
        redirect: "follow",
        headers: { Accept: "text/html" },
      });
      const contentType = response.headers.get("content-type");
      const xFrameOptions = response.headers.get("x-frame-options");
      const csp = response.headers.get("content-security-policy");
      const body = await response.text();
      console.log("[client-questionnaire] deployed site probe", {
        attempt,
        siteUrl,
        status: response.status,
        contentType,
        xFrameOptions,
        contentSecurityPolicy: csp,
        frameAncestors: csp?.match(/frame-ancestors[^;]*/i)?.[0] ?? null,
        bodyPreview: body.slice(0, 200),
        hasIndexHtml: /<!doctype html|<html/i.test(body),
      });
      if (response.ok) return;
    } catch (error) {
      console.error("[client-questionnaire] deployed site probe failed", {
        attempt,
        siteUrl,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

const BUSINESS_TYPE_TO_NICHE: Record<string, string> = {
  beauty_salon: "beauty",
  barbershop: "beauty",
  dental_clinic: "dental",
  health_clinic: "health_clinic",
  fitness_club: "fitness",
  fitness: "fitness",
  massage_salon: "massage",
  massage_salon_crm: "massage",
  car_service: "car_service",
  car_service_crm: "car_service",
  restaurant: "restaurant",
  restaurant_crm: "restaurant",
  hotel_booking: "hotel",
  real_estate: "real_estate",
  real_estate_crm: "real_estate",
  ecommerce: "ecommerce",
  ecommerce_crm: "ecommerce",
  education: "education",
  logistics: "logistics",
  logistics_crm: "logistics",
  logistics_delivery: "logistics",
  delivery: "logistics",
  technology: "technology",
  law_firm: "law_firm",
  accounting: "accounting",
  construction: "construction",
  cleaning_service: "cleaning",
  veterinary_clinic: "veterinary",
};

const BUSINESS_TYPE_DEFAULT_PAGES: Record<string, string[]> = {
  health_clinic: ["dashboard", "patients", "doctors", "appointments", "services", "payments", "settings"],
  dental_clinic: ["dashboard", "patients", "doctors", "appointments", "services", "payments", "settings"],
  beauty_salon: ["dashboard", "clients", "appointments", "services", "staff", "settings"],
  fitness_club: ["dashboard", "clients", "appointments", "services", "staff", "settings"],
  massage_salon: ["dashboard", "clients", "appointments", "services", "staff", "settings"],
  massage_salon_crm: ["dashboard", "clients", "appointments", "services", "staff", "settings"],
  restaurant: ["dashboard", "reservations", "tables", "menu", "staff", "settings"],
  restaurant_crm: ["dashboard", "reservations", "tables", "menu", "staff", "settings"],
  car_service: ["dashboard", "clients", "work_orders", "vehicles", "mechanics", "settings"],
  car_service_crm: ["dashboard", "clients", "work_orders", "vehicles", "mechanics", "settings"],
  hotel_booking: ["dashboard", "guests", "rooms", "reservations", "housekeeping", "settings"],
  real_estate: ["dashboard", "properties", "agents", "clients", "viewings", "contracts", "settings"],
  real_estate_crm: ["dashboard", "properties", "agents", "clients", "viewings", "contracts", "settings"],
  education: ["dashboard", "students", "courses", "teachers", "appointments", "settings"],
  logistics: ["dashboard", "routes", "drivers", "deliveries", "vehicles", "settings"],
  logistics_crm: ["dashboard", "routes", "drivers", "deliveries", "vehicles", "settings"],
  logistics_delivery: ["dashboard", "routes", "drivers", "deliveries", "vehicles", "settings"],
  ecommerce: ["dashboard", "products", "orders", "clients", "payments", "settings"],
  ecommerce_crm: ["dashboard", "products", "orders", "clients", "payments", "settings"],
  technology: ["dashboard", "products", "clients", "projects", "developers", "settings"],
  law_firm: ["dashboard", "clients", "matters", "appointments", "services", "invoices", "settings"],
  accounting: ["dashboard", "clients", "invoices", "appointments", "services", "reports", "settings"],
  construction: ["dashboard", "clients", "projects", "appointments", "services", "staff", "settings"],
  cleaning_service: ["dashboard", "clients", "appointments", "services", "staff", "settings"],
  veterinary_clinic: ["dashboard", "pets", "owners", "appointments", "treatments", "vaccinations", "settings"],
};

const BUSINESS_TYPE_TO_PATTERN_DIR: Record<string, string> = {
  beauty_salon: "beauty_salon",
  barbershop: "beauty_salon",
  dental_clinic: "dental_clinic",
  health_clinic: "health_clinic",
  massage_salon: "massage_salon",
  massage_salon_crm: "massage_salon",
  fitness_club: "fitness_club",
  car_service: "car_service",
  car_service_crm: "car_service",
  restaurant: "restaurant",
  restaurant_crm: "restaurant",
  hotel_booking: "hotel_booking",
  real_estate: "real_estate",
  real_estate_crm: "real_estate",
  education: "school_management",
  logistics: "car_service",
  logistics_crm: "car_service",
  logistics_delivery: "car_service",
  delivery: "car_service",
  ecommerce: "inventory_system",
  ecommerce_crm: "inventory_system",
  technology: "inventory_system",
};

function resolveBusinessType(body: Record<string, unknown>): string {
  const sectorId = String(body.sector_id ?? "").trim().toLowerCase();
  const mappedFromSector = sectorId
    ? sectorMapping.sector_id_to_business_type[sectorId]
    : undefined;

  return String(mappedFromSector ?? body.business_type ?? "beauty_salon").trim();
}

const DEFAULT_WORKING_HOURS = {
  monday: "09:00-18:00",
  tuesday: "09:00-18:00",
  wednesday: "09:00-18:00",
  thursday: "09:00-18:00",
  friday: "09:00-18:00",
  saturday: "10:00-15:00",
  sunday: "closed",
};

const DEFAULT_SOCIAL_LINKS = {
  instagram: "",
  facebook: "",
  tiktok: "",
  website: "",
};

const REQUIRED_FIELDS = [
  "name",
  "business_name",
  "business_type",
  "email",
  "phone",
  "telegram",
  "whatsapp",
  "city",
  "address",
  "working_hours",
  "language",
  "currency",
  "website",
  "social_links",
  "logo",
] as const;

function resolvePatternDir(businessType: string): string {
  return BUSINESS_TYPE_TO_PATTERN_DIR[businessType] ?? businessType;
}

function loadPattern(businessType: string): string {
  const patternKey = resolvePatternDir(businessType);
  const patternDir = path.join(process.cwd(), "patterns", patternKey);
  const patternFile = path.join(patternDir, "pattern.json");
  if (fs.existsSync(patternFile)) {
    return fs.readFileSync(patternFile, "utf8");
  }
  const fallback = path.join(process.cwd(), "patterns", "beauty_salon", "pattern.json");
  if (fs.existsSync(fallback)) return fs.readFileSync(fallback, "utf8");
  return "{}";
}

function loadDemoData(businessType: string): string {
  const patternKey = resolvePatternDir(businessType);
  const demoFile = path.join(process.cwd(), "patterns", patternKey, "demo_data.json");
  if (fs.existsSync(demoFile)) return fs.readFileSync(demoFile, "utf8");
  return "{}";
}

function readQuestionnaire() {
  if (!fs.existsSync(QUESTIONNAIRE_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(QUESTIONNAIRE_PATH, "utf8")) as Record<string, unknown>;
}

function normalizePayload(body: Record<string, unknown>) {
  const website = String(body.website ?? "").trim();
  const socialLinks =
    typeof body.social_links === "object" && body.social_links !== null
      ? (body.social_links as Record<string, string>)
      : {};

  const payload = {
    name: String(body.name ?? "").trim(),
    business_name: String(body.business_name ?? "").trim(),
    business_type: resolveBusinessType(body),
    sector_id: String(body.sector_id ?? "").trim().toLowerCase(),
    email: String(body.email ?? "").trim().toLowerCase(),
    phone: String(body.phone ?? "").trim(),
    telegram: String(body.telegram ?? "").trim(),
    whatsapp: String(body.whatsapp ?? "").trim(),
    postal_code: String(body.postal_code ?? body.postalCode ?? "").trim(),
    city: String(body.city ?? "").trim(),
    address: String(body.address ?? "").trim(),
    working_hours:
      typeof body.working_hours === "object" && body.working_hours !== null
        ? body.working_hours
        : DEFAULT_WORKING_HOURS,
    language: String(body.language ?? "ru").trim().toLowerCase(),
    currency: String(body.currency ?? "EUR").trim().toUpperCase(),
    website,
    social_links: {
      instagram: String(socialLinks.instagram ?? DEFAULT_SOCIAL_LINKS.instagram).trim(),
      facebook: String(socialLinks.facebook ?? DEFAULT_SOCIAL_LINKS.facebook).trim(),
      tiktok: String(socialLinks.tiktok ?? DEFAULT_SOCIAL_LINKS.tiktok).trim(),
      website: String(socialLinks.website ?? website).trim(),
    },
    logo: String(body.logo ?? "assets/logo.png").trim() || "assets/logo.png",
    business_questions:
      typeof body.business_questions === "object" && body.business_questions !== null
        ? (body.business_questions as Record<string, boolean>)
        : {},
    delivery_method: String(body.delivery_method ?? "zip").trim().toLowerCase() || "zip",
    plan_id: String(body.plan_id ?? "free").trim() || "free",
  };

  const planId = payload.plan_id;
  const commercial = buildCommercialData(planId, payload.currency, false);

  return {
    ...payload,
    plan_id: commercial.plan_id,
    plan: body.plan ? String(body.plan) : commercial.plan,
    amount: typeof body.amount === "number" ? body.amount : commercial.amount,
    currency: commercial.currency,
    payment_status: body.payment_status ? String(body.payment_status) : commercial.payment_status,
    terms_accepted: body.terms_accepted !== undefined ? Boolean(body.terms_accepted) : true,
    privacy_accepted: body.privacy_accepted !== undefined ? Boolean(body.privacy_accepted) : true,
    accepted_at:
      (body.terms_accepted !== undefined ? Boolean(body.terms_accepted) : true) &&
      (body.privacy_accepted !== undefined ? Boolean(body.privacy_accepted) : true)
        ? String(body.accepted_at ?? new Date().toISOString())
        : null,
  };
}

type MvpTheme = {
  primary: string;
  secondary: string;
  accent: string;
  hero_bg: string;
  text: string;
  border: string;
};

const palettes = palettesData as Record<string, MvpTheme[]>;

type PromoText = { ru: string; de: string; en: string };

const promotions = promotionsData as Record<string, PromoText[]>;

const PROMOTION_KEY_MAP: Record<string, string> = {
  restaurant_crm: "restaurant",
  massage_salon_crm: "massage_salon",
  car_service_crm: "car_service",
  fitness: "fitness_club",
  barbershop: "beauty_salon",
  ecommerce_crm: "ecommerce",
  logistics_crm: "logistics",
  logistics_delivery: "logistics",
  delivery: "logistics",
};

function resolvePromotionKey(businessType: string): string {
  if (promotions[businessType]) {
    return businessType;
  }
  return PROMOTION_KEY_MAP[businessType] ?? businessType;
}

function pickRandomPromotion(businessType: string): PromoText {
  const key = resolvePromotionKey(businessType);
  const nichePromotions = promotions[key] ?? promotions.beauty_salon;
  return nichePromotions[Math.floor(Math.random() * nichePromotions.length)];
}

function pickRandomTheme(businessType: string): MvpTheme {
  const promoKey = resolvePromotionKey(businessType);
  const nichePalettes = palettes[businessType] ?? palettes[promoKey] ?? palettes.logistics ?? palettes.restaurant;
  return nichePalettes[Math.floor(Math.random() * nichePalettes.length)];
}

function buildMvpManifest(payload: Record<string, unknown>) {
  const businessType = String(payload.business_type ?? DEFAULT_BUSINESS_TYPE);
  const city = String(payload.city ?? "").trim();
  const defaultPages =
    BUSINESS_TYPE_DEFAULT_PAGES[businessType] ?? [
      "dashboard",
      "clients",
      "appointments",
      "services",
      "settings",
    ];

  const theme = pickRandomTheme(businessType);
  const promotion = pickRandomPromotion(businessType);
  const galleryPhotos = pickRandomGalleryPhotos(businessType);
  const heroPhoto = pickRandomHeroPhoto(businessType);
  const scenario = pickNicheScenario(businessType);

  return {
    businessName: String(payload.business_name ?? "").trim(),
    ownerName: String(payload.name ?? "").trim(),
    niche: BUSINESS_TYPE_TO_NICHE[businessType] ?? "beauty",
    businessType,
    sectorId: String(payload.sector_id ?? "").trim().toLowerCase() || null,
    sector_id: String(payload.sector_id ?? "").trim().toLowerCase() || null,
    language: String(payload.language ?? "ru"),
    primaryColor: theme.accent,
    theme,
    promotion,
    scenario,
    galleryPhotos,
    heroPhoto,
    phone: String(payload.phone ?? ""),
    email: String(payload.email ?? ""),
    whatsapp: String(payload.whatsapp ?? ""),
    postalCode: String(payload.postal_code ?? payload.postalCode ?? ""),
    address: String(payload.address ?? ""),
    city,
    features: ["booking", "clients", "analytics"],
    pages: defaultPages,
    demoData: JSON.parse(loadDemoData(businessType) || "{}"),
    workingHours: payload.working_hours ?? DEFAULT_WORKING_HOURS,
    socialLinks:
      payload.social_links && typeof payload.social_links === "object"
        ? payload.social_links
        : DEFAULT_SOCIAL_LINKS,
    logo: String(payload.logo ?? "").trim(),
    description: String(payload.description ?? "").trim(),
    subtitle: String(payload.subtitle ?? "").trim(),
  };
}

function normalizeManifestForTemplate(
  manifest: Record<string, unknown>,
  payload: Record<string, unknown>,
) {
  const fallback = buildMvpManifest(payload);
  const businessType = String(payload.business_type ?? fallback.businessType);
  const theme = pickRandomTheme(businessType);
  const promotion = pickRandomPromotion(businessType);
  const galleryPhotos = pickRandomGalleryPhotos(businessType);
  const heroPhoto = pickRandomHeroPhoto(businessType);
  const scenario = pickNicheScenario(businessType);

  return {
    ...fallback,
    ...manifest,
    businessName: String(manifest.businessName ?? fallback.businessName),
    ownerName: String(
      manifest.ownerName ?? payload.name ?? (fallback as { ownerName?: string }).ownerName ?? "",
    ),
    niche: BUSINESS_TYPE_TO_NICHE[businessType] ?? String(manifest.niche ?? fallback.niche),
    businessType,
    sectorId:
      String(payload.sector_id ?? manifest.sectorId ?? manifest.sector_id ?? "").trim().toLowerCase() ||
      null,
    sector_id:
      String(payload.sector_id ?? manifest.sector_id ?? manifest.sectorId ?? "").trim().toLowerCase() ||
      null,
    language: String(manifest.language ?? payload.language ?? fallback.language),
    primaryColor: theme.accent,
    theme,
    promotion,
    scenario,
    galleryPhotos,
    heroPhoto,
    phone: String(manifest.phone ?? fallback.phone),
    email: String(manifest.email ?? fallback.email),
    whatsapp: String(manifest.whatsapp ?? fallback.whatsapp),
    postalCode: String(manifest.postalCode ?? manifest.postal_code ?? fallback.postalCode),
    address: String(manifest.address ?? fallback.address),
    city: String(manifest.city ?? payload.city ?? fallback.city ?? "").trim(),
    features: Array.isArray(manifest.features) ? manifest.features : fallback.features,
    pages: BUSINESS_TYPE_DEFAULT_PAGES[businessType] ?? fallback.pages,
    demoData:
      typeof manifest.demoData === "object" && manifest.demoData !== null
        ? manifest.demoData
        : fallback.demoData,
    workingHours: manifest.workingHours ?? payload.working_hours ?? fallback.workingHours,
    socialLinks:
      manifest.socialLinks ??
      manifest.social_links ??
      payload.social_links ??
      (fallback as { socialLinks?: unknown }).socialLinks,
    logo: String(manifest.logo ?? payload.logo ?? (fallback as { logo?: string }).logo ?? ""),
    description: String(
      manifest.description ?? payload.description ?? (fallback as { description?: string }).description ?? "",
    ),
    subtitle: String(
      manifest.subtitle ?? payload.subtitle ?? (fallback as { subtitle?: string }).subtitle ?? "",
    ),
  };
}

function parseOrchestratorJson(raw: string): Record<string, unknown> {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch (firstError) {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        throw firstError;
      }
    }
    throw firstError;
  }
}

async function buildMvpManifestWithOpenAI(payload: Record<string, unknown>) {
  const openai = getOpenAIClient();
  if (!openai) {
    return buildMvpManifest(payload);
  }

  const businessType = String(payload.business_type ?? DEFAULT_BUSINESS_TYPE);
  const pattern = loadPattern(businessType);
  const demoData = loadDemoData(businessType);

  const systemPrompt = `Ты оркестрант MVP Factory. 
Твоя задача — собрать конфигурацию CRM для клиента на основе его данных.
НЕ генерируй контент сам — используй только данные из опросника и паттерна.
Return ONLY valid JSON. No markdown, no backticks, no explanations.
Keep all string values under 100 characters.
Do NOT include demoData in the JSON — it is injected server-side.
Верни ТОЛЬКО валидный JSON без пояснений.`;

  const userPrompt = `
КРИТИЧЕСКОЕ ПРАВИЛО: Значение businessType в JSON СТРОГО равно "${payload.business_type}".
Запрещено менять его. Если business_type="${payload.business_type}" — возвращай только ${payload.business_type}.

Данные клиента из опросника:
${JSON.stringify(payload, null, 2)}

business_type клиента: ${payload.business_type}
Используй ИМЕННО эту нишу. Не меняй её.
СТРОГО используй businessType: '${businessType}'. Не меняй его.

Паттерн для ниши ${businessType}:
${pattern}

Demo данные для ниши:
${demoData}

Собери JSON конфигурацию MVP:
{
  "businessName": "имя из опросника",
  "niche": "ниша из опросника",
  "businessType": "business_type из опросника",
  "language": "язык из опросника",
  "phone": "телефон из опросника",
  "email": "email из опросника",
  "whatsapp": "whatsapp из опросника",
  "postalCode": "индекс из опросника",
  "address": "адрес (улица, дом) из опросника",
  "city": "город из опросника (только если указан; без дефолта München)",
  "features": ["модули из паттерна"],
  "pages": ["страницы из паттерна"],
  "workingHours": "часы работы из опросника"
}

НЕ включай поле demoData в ответ — демо-данные подставятся на сервере.
НЕ включай поля theme и primaryColor — цветовая схема подставится на сервере.

ОБЯЗАТЕЛЬНО верни поля:
- niche: точно одно из: beauty, dental, fitness, massage, car_service, health_clinic
- city: использовать payload.city если есть, иначе пустая строка. НЕ подставлять München. НЕ извлекать city из address (address = улица и дом)
- businessName: использовать payload.business_name (название компании), НЕ имя владельца (payload.name)
- whatsapp, postalCode, address: скопировать из опросника
- businessType: скопировать из опросника без изменений
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const rawJson = completion.choices[0]?.message?.content ?? "{}";
    const manifest = parseOrchestratorJson(rawJson);

    const businessTypeKey = String(payload.business_type ?? DEFAULT_BUSINESS_TYPE);
    manifest.businessType = businessTypeKey;
    delete manifest.demoData;
    manifest.niche = BUSINESS_TYPE_TO_NICHE[businessTypeKey] ?? "beauty";
    const sectorId = String(payload.sector_id ?? "").trim().toLowerCase();
    if (sectorId) {
      manifest.sectorId = sectorId;
      manifest.sector_id = sectorId;
    }
    if (!manifest.city) {
      manifest.city = String(payload.city ?? "").trim();
    }
    if (!manifest.businessName) {
      manifest.businessName = String(payload.business_name ?? "").trim();
    }
    if (!manifest.ownerName) {
      manifest.ownerName = String(payload.name ?? "").trim();
    }
    if (!manifest.whatsapp) {
      manifest.whatsapp = String(payload.whatsapp ?? "").trim();
    }
    if (!manifest.postalCode && !manifest.postal_code) {
      manifest.postalCode = String(payload.postal_code ?? payload.postalCode ?? "").trim();
    }
    if (!manifest.address) {
      manifest.address = String(payload.address ?? "").trim();
    }

    const normalized = normalizeManifestForTemplate(manifest, payload);
    console.log("[client-questionnaire] manifest ready");
    return normalized;
  } catch (error) {
    console.error("[client-questionnaire] OpenAI orchestrator failed, using fallback manifest:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return buildMvpManifest(payload);
  }
}

export const runtime = "nodejs";

export async function GET() {
  const questionnaire = readQuestionnaire();
  if (!questionnaire) {
    return NextResponse.json({ exists: false }, { status: 404 });
  }
  return NextResponse.json(questionnaire);
}

export async function POST(request: Request) {
  try {
    console.log("[client-questionnaire] POST started");
    runStorageCleanup();
    const body = (await request.json()) as Record<string, unknown>;

    const payload = normalizePayload(body);
    console.log("[client-questionnaire] payload normalized:", {
      name: payload.name,
      business_name: payload.business_name,
      business_type: payload.business_type,
      sector_id: payload.sector_id,
      city: payload.city,
      email: payload.email,
    });

    for (const field of REQUIRED_FIELDS) {
      if (!(field in payload)) {
        console.error("[client-questionnaire] missing required field:", field);
        return NextResponse.json({ ok: false, error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    for (const field of ["name", "business_name", "email", "phone", "city", "address"] as const) {
      if (!String(payload[field] ?? "").trim()) {
        console.error("[client-questionnaire] empty required field:", field);
        return NextResponse.json({ ok: false, error: `Empty field: ${field}` }, { status: 400 });
      }
    }

    const draft = normalizeManifestMedia(
      (await buildMvpManifestWithOpenAI(payload)) as Record<string, unknown>,
    ) as Record<string, unknown>;

    let manifest: Record<string, unknown>;
    try {
      const validated = await validateManifestWithOptionalCorrection({
        manifest: draft,
        payload,
        openai: getOpenAIClient(),
        normalize: (candidate, sourcePayload) =>
          normalizeManifestMedia(
            normalizeManifestForTemplate(candidate, sourcePayload) as Record<string, unknown>,
          ) as Record<string, unknown>,
      });
      manifest = validated as Record<string, unknown>;
    } catch (validationError) {
      console.error("[client-questionnaire] manifest validation failed — trying deterministic fallback", {
        message:
          validationError instanceof Error ? validationError.message : String(validationError),
      });
      try {
        const fallback = normalizeManifestMedia(
          buildMvpManifest(payload) as Record<string, unknown>,
        ) as Record<string, unknown>;
        manifest = assertValidClientManifest(fallback) as Record<string, unknown>;
      } catch (fallbackError) {
        console.error("[client-questionnaire] fallback manifest also invalid", {
          message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        });
        return NextResponse.json(
          {
            ok: false,
            error:
              fallbackError instanceof Error
                ? fallbackError.message
                : "manifest_validation_failed",
          },
          { status: 422 },
        );
      }
    }

    const clientId = randomUUID();
    await saveClientRecordToFirestore({ clientId, payload, manifest });
    console.log("[client-questionnaire] Firestore client record saved", {
      clientId,
      path: `${CLIENTS_COLLECTION}/${clientId}`,
    });
    // Await durable Firestore + disk write — fire-and-forget previously could leave
    // clients/{id} without a recoverable manifest after /tmp wipe or partial unlock.
    await saveClientManifest(clientId, manifest);
    const { ensureLeadsReadSecret } = await import("@/lib/leads/read-secret");
    await ensureLeadsReadSecret(clientId);
    console.log("[client-questionnaire] manifest saved, clientId:", clientId);

    void notifyNewLead({
      businessName: payload.business_name,
      businessType: payload.business_type,
      email: payload.email,
      phone: payload.phone,
      whatsapp: payload.whatsapp,
      telegram: payload.telegram,
      clientId,
    }).catch((error) => {
      console.error("[client-questionnaire] lead notification failed:", error);
    });

    let siteId: string | undefined;
    let siteUrl: string | undefined;
    let deployId: string | undefined;
    let redirectUrl: string | undefined;
    let demoSlug: string | undefined;
    let publicSiteUrl: string | undefined;

    logCloudflareEnvPresence("client-questionnaire");
    if (!isCloudflareDeployConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "Cloudflare is not configured",
          clientId,
        },
        { status: 503 },
      );
    }

    try {
      const distPath = resolveMvpDistPath();
      const businessType = String(
        (manifest as { businessType?: unknown }).businessType ??
          payload.business_type ??
          "business",
      );
      const businessName = String(
        (manifest as { businessName?: unknown }).businessName ??
          payload.business_name ??
          "",
      );
      demoSlug = buildDemoSlug({ clientId, businessType, businessName });
      console.log("[client-questionnaire] Cloudflare deploy starting:", {
        clientId,
        distPath,
        demoSlug,
      });

      const pagesProject = await ensureSharedPagesProject();
      const clientDistPath = await prepareClientDistWithOgImage(
        clientId,
        distPath,
        manifest as Record<string, unknown>,
        pagesProject.productionUrl,
      );

      let deployResult: { deploymentId: string; deploymentUrl: string };
      try {
        deployResult = await deployDistToPages(pagesProject.projectName, clientDistPath, {
          previewBranch: buildPreviewBranch(demoSlug),
        });
        persistClientDistSnapshot(clientId, clientDistPath);
      } finally {
        cleanupClientDist(clientDistPath);
      }

      siteId = deployResult.deploymentId;
      siteUrl = deployResult.deploymentUrl;
      deployId = deployResult.deploymentId;
      redirectUrl = buildReadableDemoUrl(demoSlug, clientId);
      publicSiteUrl = buildReadablePublicSiteUrl(demoSlug);

      const deployedAt = new Date().toISOString();
      const deleteAt = new Date(Date.now() + getCrmDemoTtlMs()).toISOString();
      upsertDemoRecord({
        slug: demoSlug,
        clientId,
        deploymentId: deployResult.deploymentId,
        deploymentUrl: deployResult.deploymentUrl,
        projectName: pagesProject.projectName,
        deployedAt,
        deleteAt,
      });

      await persistDemoDeployment({
        clientId,
        slug: demoSlug,
        deploymentId: deployResult.deploymentId,
        deploymentUrl: deployResult.deploymentUrl,
        email: String(payload.email || ""),
      });

      // New demos always start unpaid so /demo shows tariff + promo CTAs.
      // Paid unlock is only via Polar webhook or redeem-promo for this clientId.

      console.log("[client-questionnaire] Cloudflare deploy success:", {
        siteId,
        siteUrl,
        deployId,
        redirectUrl,
        demoSlug,
        deployedAt,
        deleteAt,
      });

      await logDeployedSiteProbe(buildMvpRedirectUrl(siteUrl, clientId));

      scheduleDeletion({
        siteId,
        clientId,
        siteUrl: redirectUrl,
        deploymentUrl: siteUrl,
        slug: demoSlug,
        projectName: pagesProject.projectName,
        deployedAt,
        deleteAt,
      });
      startDeletionScheduler();
      void pruneSharedProjectDeployments().catch((error) => {
        console.error("[client-questionnaire] prune deployments failed:", error);
      });
    } catch (cloudflareError) {
      const message =
        cloudflareError instanceof Error ? cloudflareError.message : String(cloudflareError);
      console.error("[client-questionnaire] Cloudflare deploy failed:", {
        error: cloudflareError,
        message,
        stack: cloudflareError instanceof Error ? cloudflareError.stack : undefined,
        clientId,
      });
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: message,
          clientId,
        },
        { status: 502 },
      );
    }

    console.log("[client-questionnaire] POST success:", {
      redirectUrl,
      siteId,
      siteUrl,
      deployId,
      clientId,
      demoSlug,
    });

    return NextResponse.json({
      ok: true,
      success: true,
      redirectUrl,
      publicSiteUrl: publicSiteUrl ?? (demoSlug ? buildReadablePublicSiteUrl(demoSlug) : undefined),
      clientId,
      siteId,
      siteUrl: redirectUrl,
      deployId,
      deploymentUrl: siteUrl,
      slug: demoSlug,
      path: `${CLIENTS_COLLECTION}/${clientId}`,
    });
  } catch (error) {
    console.error("[client-questionnaire] POST failed:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const message = error instanceof Error ? error.message : "Failed to save questionnaire";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
