import { randomBytes, timingSafeEqual } from "crypto";

import { loadClientManifest, saveClientManifest } from "@/lib/manifest/storage";

const SECRET_FIELD = "leadsReadSecret";

export function generateLeadsReadSecret(): string {
  return randomBytes(32).toString("hex");
}

export function readLeadsSecretFromManifest(
  manifest: Record<string, unknown> | null | undefined,
): string {
  const value = manifest?.[SECRET_FIELD];
  return typeof value === "string" && value.trim().length >= 32 ? value.trim() : "";
}

/** Strip secrets before any public JSON (manifest API, CRM bootstrap blob). */
export function stripLeadsSecrets<T extends Record<string, unknown>>(manifest: T): T {
  if (!manifest || typeof manifest !== "object") return manifest;
  const next = { ...manifest };
  delete next[SECRET_FIELD];
  delete next.leads_read_secret;
  return next;
}

/** Thrown when the tenant manifest file is missing (e.g. after storage prune). */
export class ManifestNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(clientId: string) {
    super(`Manifest not found for clientId=${clientId}`);
    this.name = "ManifestNotFoundError";
  }
}

/**
 * Ensure server-side manifest has a leads read secret (not exposed publicly).
 * Returns the secret for CRM injection.
 *
 * Never creates a stub `{ clientId, leadsReadSecret }` when the file is missing —
 * that masked prune/TTL loss as a "valid" empty tenant and broke Live Preview.
 */
export async function ensureLeadsReadSecret(clientId: string): Promise<string> {
  const id = String(clientId || "").trim();
  if (!id) throw new Error("clientId required");
  const manifest = loadClientManifest(id);
  if (!manifest) {
    throw new ManifestNotFoundError(id);
  }
  const existing = readLeadsSecretFromManifest(manifest);
  if (existing) return existing;
  const secret = generateLeadsReadSecret();
  await saveClientManifest(id, { ...manifest, [SECRET_FIELD]: secret });
  return secret;
}

export function verifyLeadsReadSecret(clientId: string, provided: string | null | undefined): boolean {
  const token = String(provided || "").trim();
  if (!token || token.length < 32) return false;
  const expected = readLeadsSecretFromManifest(loadClientManifest(clientId));
  if (!expected || expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
