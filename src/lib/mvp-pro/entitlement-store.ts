import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

import { loadClientZipUnlockRecord, persistZipUnlocked } from "@/lib/billing/paid-tenant";
import { loadClientManifest } from "@/lib/manifest/storage";
import { MVP_PRO_ENTITLEMENTS_DIR } from "@/lib/mvp-pro/constants";

export type MvpProEntitlementStatus = "ready_to_download" | "downloaded";

export type MvpProEntitlement = {
  clientId: string;
  email: string;
  variantId: string;
  status: MvpProEntitlementStatus;
  downloadToken: string;
  paidAt: string;
  language: "ru" | "de" | "en";
  businessName: string;
  businessType: string;
  orderId?: string;
};

function entitlementPath(clientId: string): string {
  return path.join(process.cwd(), MVP_PRO_ENTITLEMENTS_DIR, `${clientId}.json`);
}

function ensureDir(): void {
  fs.mkdirSync(path.join(process.cwd(), MVP_PRO_ENTITLEMENTS_DIR), { recursive: true });
}

export function loadMvpProEntitlement(clientId: string): MvpProEntitlement | null {
  const filePath = entitlementPath(clientId);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as MvpProEntitlement;
  } catch {
    return null;
  }
}

export function saveMvpProEntitlement(entitlement: MvpProEntitlement): void {
  ensureDir();
  fs.writeFileSync(entitlementPath(entitlement.clientId), `${JSON.stringify(entitlement, null, 2)}\n`, "utf8");
}

export function grantMvpProEntitlement(input: {
  clientId: string;
  email: string;
  language?: string;
  businessName?: string;
  businessType?: string;
  orderId?: string;
  variantId?: string;
}): MvpProEntitlement {
  const language = ["ru", "de", "en"].includes(String(input.language ?? ""))
    ? (input.language as "ru" | "de" | "en")
    : "en";

  const entitlement: MvpProEntitlement = {
    clientId: input.clientId,
    email: input.email.trim().toLowerCase(),
    variantId: input.variantId ?? "1807661",
    status: "ready_to_download",
    downloadToken: randomUUID(),
    paidAt: new Date().toISOString(),
    language,
    businessName: input.businessName ?? "MVP Pro Client",
    businessType: input.businessType ?? "business",
    orderId: input.orderId,
  };

  saveMvpProEntitlement(entitlement);
  return entitlement;
}

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function resolveLanguage(raw: string | undefined): "ru" | "de" | "en" {
  const language = pickString(raw).toLowerCase();
  if (language === "ru" || language === "de" || language === "en") {
    return language;
  }
  return "en";
}

function buildEntitlementFromUnlock(input: {
  clientId: string;
  email: string;
  downloadToken: string;
  orderId?: string;
  language?: string;
  businessName?: string;
  businessType?: string;
}): MvpProEntitlement {
  const manifest = loadClientManifest(input.clientId);
  const language = resolveLanguage(
    input.language || pickString(manifest?.language) || pickString(manifest?.lang),
  );
  const businessName =
    pickString(input.businessName) ||
    pickString(manifest?.business_name) ||
    pickString(manifest?.businessName) ||
    "Website + CRM";
  const businessType =
    pickString(input.businessType) ||
    pickString(manifest?.business_type) ||
    pickString(manifest?.businessType) ||
    "business";

  return {
    clientId: input.clientId,
    email: input.email.trim().toLowerCase(),
    variantId: "1807661",
    status: "ready_to_download",
    downloadToken: input.downloadToken,
    paidAt: new Date().toISOString(),
    language,
    businessName,
    businessType,
    orderId: input.orderId,
  };
}

/**
 * Local entitlement file is wiped on Render redeploy — restore from Firestore when zip_unlocked.
 */
export async function ensureMvpProEntitlement(clientId: string): Promise<MvpProEntitlement | null> {
  const id = String(clientId || "").trim();
  if (!id) return null;

  const local = loadMvpProEntitlement(id);
  if (local?.downloadToken) return local;

  const unlock = await loadClientZipUnlockRecord(id);
  if (!unlock?.unlocked) return null;

  const email = pickString(unlock.email) || "buyer@unknown.local";
  const downloadToken = pickString(unlock.downloadToken) || randomUUID();
  const entitlement = buildEntitlementFromUnlock({
    clientId: id,
    email,
    downloadToken,
    orderId: unlock.orderId,
    language: unlock.language,
    businessName: unlock.businessName,
    businessType: unlock.businessType,
  });

  saveMvpProEntitlement(entitlement);
  if (!unlock.downloadToken) {
    await persistZipUnlocked({
      clientId: id,
      email,
      orderId: unlock.orderId,
      source: "entitlement_rehydrate",
      downloadToken,
    });
  }

  return entitlement;
}

export function verifyMvpProDownloadAccess(input: {
  clientId: string;
  token: string;
  email?: string;
}): { ok: true; entitlement: MvpProEntitlement } | { ok: false; reason: string } {
  const entitlement = loadMvpProEntitlement(input.clientId);
  if (!entitlement) {
    return { ok: false, reason: "Entitlement not found" };
  }

  if (entitlement.downloadToken !== input.token) {
    return { ok: false, reason: "Invalid download token" };
  }

  if (input.email && entitlement.email !== input.email.trim().toLowerCase()) {
    return { ok: false, reason: "Email does not match entitlement owner" };
  }

  return { ok: true, entitlement };
}

export async function verifyMvpProDownloadAccessAsync(input: {
  clientId: string;
  token: string;
  email?: string;
}): Promise<{ ok: true; entitlement: MvpProEntitlement } | { ok: false; reason: string }> {
  const sync = verifyMvpProDownloadAccess(input);
  if (sync.ok) return sync;

  const entitlement = await ensureMvpProEntitlement(input.clientId);
  if (!entitlement) {
    return { ok: false, reason: "Entitlement not found" };
  }

  if (entitlement.downloadToken !== input.token) {
    return { ok: false, reason: "Invalid download token" };
  }

  if (input.email && entitlement.email !== input.email.trim().toLowerCase()) {
    return { ok: false, reason: "Email does not match entitlement owner" };
  }

  return { ok: true, entitlement };
}

export function verifyMvpProStatusAccess(input: {
  clientId: string;
  email: string;
}): { ok: true; entitlement: MvpProEntitlement } | { ok: false; reason: string } {
  const entitlement = loadMvpProEntitlement(input.clientId);
  if (!entitlement) {
    return { ok: false, reason: "Entitlement not found" };
  }

  if (entitlement.email !== input.email.trim().toLowerCase()) {
    return { ok: false, reason: "Email does not match entitlement owner" };
  }

  return { ok: true, entitlement };
}
