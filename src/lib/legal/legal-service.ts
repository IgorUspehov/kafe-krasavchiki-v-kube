import fs from "fs";
import path from "path";

export type AcceptanceData = {
  terms_accepted: boolean;
  privacy_accepted: boolean;
  accepted_at: string | null;
  language: string;
};

const LEGAL_DIR = path.join(process.cwd(), "config/legal");
const QUESTIONNAIRE_PATH = path.join(process.cwd(), "input/client_onboarding_questionnaire.json");
const ORDER_TERMS_DIR = path.join(process.cwd(), "artifacts/factory_output/client_contract_terms/order_terms");
const ORDERS_PATH = path.join(process.cwd(), "artifacts/factory_output/client_orders/orders.json");

const TERMS_VERSION = "1.0";
const PRIVACY_VERSION = "1.0";
const REFUND_VERSION = "1.0";

function readJson(pathValue: string): Record<string, unknown> | null {
  if (!fs.existsSync(pathValue)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(pathValue, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeLanguage(language: string | undefined): string {
  const value = String(language ?? "en").trim().toLowerCase();
  return ["en", "de", "ru"].includes(value) ? value : "en";
}

export function loadTermsDocument(language?: string) {
  const locale = normalizeLanguage(language);
  const filePath = path.join(LEGAL_DIR, `terms_${locale}.json`);
  const fallbackPath = path.join(LEGAL_DIR, "terms_en.json");
  const data = readJson(filePath) ?? readJson(fallbackPath);
  return data ?? { version: TERMS_VERSION, language: locale, title: "Terms of Service", rules: [] };
}

export function loadPrivacyDocument(language?: string) {
  const locale = normalizeLanguage(language);
  const filePath = path.join(LEGAL_DIR, `privacy_${locale}.json`);
  const fallbackPath = path.join(LEGAL_DIR, "privacy_en.json");
  const data = readJson(filePath) ?? readJson(fallbackPath);
  return data ?? { version: PRIVACY_VERSION, language: locale, title: "Privacy Policy", sections: [] };
}

export function loadRefundDocument(language?: string) {
  const locale = normalizeLanguage(language);
  const filePath = path.join(LEGAL_DIR, `refund_${locale}.json`);
  const fallbackPath = path.join(LEGAL_DIR, "refund_en.json");
  const data = readJson(filePath) ?? readJson(fallbackPath);
  return data ?? { version: REFUND_VERSION, language: locale, title: "Refund Policy", sections: [] };
}

export function readAcceptanceFromQuestionnaire(): AcceptanceData {
  const questionnaire = readJson(QUESTIONNAIRE_PATH) ?? {};
  const termsAccepted = Boolean(questionnaire.terms_accepted);
  const privacyAccepted = Boolean(questionnaire.privacy_accepted);
  const acceptedAtRaw = questionnaire.accepted_at;
  const acceptedAt =
    typeof acceptedAtRaw === "string" && acceptedAtRaw.trim() ? acceptedAtRaw.trim() : null;
  return {
    terms_accepted: termsAccepted,
    privacy_accepted: privacyAccepted,
    accepted_at: termsAccepted && privacyAccepted ? acceptedAt ?? new Date().toISOString() : acceptedAt,
    language: normalizeLanguage(String(questionnaire.language ?? "en")),
  };
}

export function readLatestOrderAcceptance(): AcceptanceData | null {
  if (!fs.existsSync(ORDERS_PATH)) {
    return null;
  }
  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_PATH, "utf8")) as unknown;
    if (!Array.isArray(orders) || orders.length === 0) {
      return null;
    }
    const latest = orders[0] as Record<string, unknown>;
    return {
      terms_accepted: Boolean(latest.terms_accepted),
      privacy_accepted: Boolean(latest.privacy_accepted),
      accepted_at: typeof latest.accepted_at === "string" ? latest.accepted_at : null,
      language: normalizeLanguage(String(latest.language ?? "en")),
    };
  } catch {
    return null;
  }
}

export function readAcceptanceStatus(): AcceptanceData {
  return readLatestOrderAcceptance() ?? readAcceptanceFromQuestionnaire();
}

export function writeTermsSnapshot(options: {
  order_id: string;
  language: string;
  accepted_at: string;
}): string {
  fs.mkdirSync(ORDER_TERMS_DIR, { recursive: true });
  const snapshotPath = path.join(ORDER_TERMS_DIR, `${options.order_id}_terms_snapshot.json`);
  const payload = {
    order_id: options.order_id,
    terms_version: TERMS_VERSION,
    privacy_version: PRIVACY_VERSION,
    accepted_at: options.accepted_at,
    language: normalizeLanguage(options.language),
  };
  fs.writeFileSync(snapshotPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return snapshotPath;
}
