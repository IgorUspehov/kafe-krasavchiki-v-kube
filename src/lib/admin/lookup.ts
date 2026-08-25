import fs from "fs";
import path from "path";

import { loadAdminManifest } from "@/lib/admin/persist";
import { extractOwnerEmail } from "@/lib/admin/site-content";
import { loadClientManifest, resolveManifestsDir } from "@/lib/manifest/storage";

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** Gmail treats dots and +tags as the same mailbox. */
export function canonicalizeEmail(email: string): string {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at < 1) return normalized;
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${local.split("+")[0].replace(/\./g, "")}@gmail.com`;
  }
  return normalized;
}

export function emailsEquivalent(left: string, right: string): boolean {
  const a = canonicalizeEmail(left);
  const b = canonicalizeEmail(right);
  return Boolean(a.includes("@") && a === b);
}

export function collectOwnerEmails(record: Record<string, unknown> | null | undefined): string[] {
  if (!record) return [];
  const emails = new Set<string>();
  const add = (value: unknown) => {
    const email = normalizeEmail(value);
    if (email.includes("@")) emails.add(email);
  };

  add(record.email);
  add(record.polarEmail);
  const questionnaire =
    record.questionnaire && typeof record.questionnaire === "object"
      ? (record.questionnaire as Record<string, unknown>)
      : null;
  add(questionnaire?.email);
  const manifest =
    record.manifest && typeof record.manifest === "object"
      ? (record.manifest as Record<string, unknown>)
      : record;
  add(extractOwnerEmail(manifest));
  return [...emails];
}

export function recordOwnsEmail(
  record: Record<string, unknown> | null | undefined,
  email: string,
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) return false;
  return collectOwnerEmails(record).some((item) => emailsEquivalent(item, normalized));
}

function listManifestClientIds(): string[] {
  const dir = resolveManifestsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""))
    .filter(Boolean);
}

async function queryFirestoreClientIdsByEmail(email: string): Promise<string[]> {
  const ids = new Set<string>();
  try {
    const { getFirestoreDb } = await import("@/lib/firebase/admin");
    const db = getFirestoreDb();
    const queries = [
      db.collection("clients").where("email", "==", email).get(),
      db.collection("clients").where("polarEmail", "==", email).get(),
    ];
    const canonical = canonicalizeEmail(email);
    if (canonical !== email) {
      queries.push(
        db.collection("clients").where("email", "==", canonical).get(),
        db.collection("clients").where("polarEmail", "==", canonical).get(),
      );
    }
    const results = await Promise.allSettled(queries);
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      for (const doc of result.value.docs) ids.add(doc.id);
    }
  } catch {
    return [...ids];
  }
  return [...ids];
}

async function loadFirestoreClientRecord(
  clientId: string,
): Promise<Record<string, unknown> | null> {
  const id = clientId.trim();
  if (!id) return null;
  try {
    const { getFirestoreDb } = await import("@/lib/firebase/admin");
    const snap = await getFirestoreDb().collection("clients").doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function hydrateClientManifest(clientId: string): Promise<Record<string, unknown> | null> {
  return loadAdminManifest(clientId);
}

export async function findClientIdsByOwnerEmail(
  email: string,
  clientId?: string,
): Promise<string[]> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) return [];

  const ids = new Set<string>();
  const hintedId = typeof clientId === "string" ? clientId.trim() : "";

  if (hintedId) {
    const hintedRecord = await loadFirestoreClientRecord(hintedId);
    const hintedManifest = loadClientManifest(hintedId);
    if (
      recordOwnsEmail(hintedRecord, normalized) ||
      emailsEquivalent(extractOwnerEmail(hintedManifest), normalized)
    ) {
      ids.add(hintedId);
    }
  }

  for (const id of listManifestClientIds()) {
    const manifest = loadClientManifest(id);
    if (emailsEquivalent(extractOwnerEmail(manifest), normalized)) {
      ids.add(id);
    }
  }

  const fromFirestore = await queryFirestoreClientIdsByEmail(normalized);
  for (const id of fromFirestore) {
    const record = await loadFirestoreClientRecord(id);
    const manifest = loadClientManifest(id);
    if (recordOwnsEmail(record, normalized) || emailsEquivalent(extractOwnerEmail(manifest), normalized)) {
      ids.add(id);
    }
  }

  return [...ids];
}

export async function resolveMagicLinkClientId(
  email: string,
  clientIdHint?: string,
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) return null;

  const hintedId = typeof clientIdHint === "string" ? clientIdHint.trim() : "";
  if (hintedId) {
    const hintedRecord = await loadFirestoreClientRecord(hintedId);
    const hintedManifest =
      loadClientManifest(hintedId) ||
      (hintedRecord?.manifest && typeof hintedRecord.manifest === "object"
        ? (hintedRecord.manifest as Record<string, unknown>)
        : null);
    if (
      recordOwnsEmail(hintedRecord, normalized) ||
      emailsEquivalent(extractOwnerEmail(hintedManifest), normalized)
    ) {
      return hintedId;
    }
    return null;
  }

  const matches = await findClientIdsByOwnerEmail(normalized);
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0]!;

  const exact: string[] = [];
  for (const id of matches) {
    const record = await loadFirestoreClientRecord(id);
    const manifest = loadClientManifest(id);
    const emails = [
      ...collectOwnerEmails(record),
      extractOwnerEmail(manifest),
    ].map((item) => normalizeEmail(item));
    if (emails.includes(normalized)) exact.push(id);
  }
  const pool = exact.length > 0 ? exact : matches;
  if (pool.length === 1) return pool[0]!;

  let bestId = pool[0]!;
  let bestTs = -1;
  for (const id of pool) {
    const ts = await clientRecencyMs(id);
    if (ts >= bestTs) {
      bestTs = ts;
      bestId = id;
    }
  }
  return bestId;
}

async function clientRecencyMs(clientId: string): Promise<number> {
  const record = await loadFirestoreClientRecord(clientId);
  const updated = record?.updatedAt as { toMillis?: () => number } | string | undefined;
  if (updated && typeof updated === "object" && typeof updated.toMillis === "function") {
    return updated.toMillis();
  }
  if (typeof updated === "string") {
    const parsed = Date.parse(updated);
    if (Number.isFinite(parsed)) return parsed;
  }
  try {
    return fs.statSync(manifestPathForClient(clientId)).mtimeMs;
  } catch {
    return 0;
  }
}

export function manifestPathForClient(clientId: string): string {
  return path.join(resolveManifestsDir(), `${clientId}.json`);
}
