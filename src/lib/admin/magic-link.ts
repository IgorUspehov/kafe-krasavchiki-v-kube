import { createHash, randomBytes } from "crypto";
import fs from "fs";
import path from "path";

import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";

const TOKEN_TTL_MS = 100 * 365 * 24 * 60 * 60 * 1000;

/** Verified Resend domain — do not use onboarding@resend.dev (test mode). */
export const ADMIN_MAGIC_LINK_FROM = "Webstudio München <noreply@webstudio-muenchen.com>";

export type MagicLinkRecord = {
  tokenHash: string;
  clientId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
};

function storePath(): string {
  return path.join(resolvePersistentDataDir(), "admin-magic-links.json");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function readStore(): MagicLinkRecord[] {
  const filePath = storePath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as MagicLinkRecord[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeStore(records: MagicLinkRecord[]): void {
  const filePath = storePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

function prune(records: MagicLinkRecord[], now = Date.now()): MagicLinkRecord[] {
  return records.filter((item) => item.expiresAt > now - 24 * 60 * 60 * 1000);
}

export function createMagicLink(input: { clientId: string; email: string }): {
  token: string;
  record: MagicLinkRecord;
} {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  const record: MagicLinkRecord = {
    tokenHash: hashToken(token),
    clientId: input.clientId.trim(),
    email: input.email.trim().toLowerCase(),
    createdAt: now,
    expiresAt: now + TOKEN_TTL_MS,
  };
  const next = prune(readStore(), now);
  next.push(record);
  writeStore(next);
  return { token, record };
}

export type ConsumeMagicLinkResult =
  | { ok: true; clientId: string; email: string }
  | { ok: false; reason: "invalid" | "expired" };

export function consumeMagicLink(token: string): ConsumeMagicLinkResult {
  const normalized = String(token || "").trim();
  if (!normalized) return { ok: false, reason: "invalid" };
  const tokenHash = hashToken(normalized);
  const now = Date.now();
  const records = prune(readStore(), now);
  const record = records.find((item) => item.tokenHash === tokenHash);
  if (!record) return { ok: false, reason: "invalid" };

  // Expiration disabled — magic links never expire by time
  // if (record.expiresAt <= now) return { ok: false, reason: "expired" };

  return { ok: true, clientId: record.clientId, email: record.email };
}

export function peekMagicLink(token: string): MagicLinkRecord | null {
  const normalized = String(token || "").trim();
  if (!normalized) return null;
  const tokenHash = hashToken(normalized);
  return readStore().find((item) => item.tokenHash === tokenHash) ?? null;
}
