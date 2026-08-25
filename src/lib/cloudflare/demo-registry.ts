import fs from "fs";
import path from "path";

import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";
import {
  readCachedDemoRegistry,
  writeCachedDemoRegistry,
} from "@/lib/runtime-session-store";

export type DemoSiteRecord = {
  slug: string;
  clientId: string;
  deploymentId: string;
  deploymentUrl: string;
  projectName: string;
  deployedAt: string;
  deleteAt: string;
  paid?: boolean;
};

function getDemoRegistryPath(): string {
  return path.join(resolvePersistentDataDir(), "demo-registry.json");
}

function readRegistryFromDisk(): DemoSiteRecord[] {
  const filePath = getDemoRegistryPath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as DemoSiteRecord[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeRegistryToDisk(entries: DemoSiteRecord[]): void {
  const filePath = getDemoRegistryPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

function readRegistry(): DemoSiteRecord[] {
  const cached = readCachedDemoRegistry();
  if (cached) {
    return cached;
  }
  const fromDisk = readRegistryFromDisk();
  writeCachedDemoRegistry(fromDisk);
  return fromDisk;
}

function writeRegistry(entries: DemoSiteRecord[]): void {
  writeCachedDemoRegistry(entries);
  try {
    writeRegistryToDisk(entries);
  } catch (error) {
    console.warn("[demo-registry] disk write failed — using memory only", {
      message: error instanceof Error ? error.message : String(error),
      entries: entries.length,
    });
  }
}

export function upsertDemoRecord(record: DemoSiteRecord): void {
  const entries = readRegistry().filter(
    (item) => item.slug !== record.slug && item.deploymentId !== record.deploymentId,
  );
  entries.push(record);
  writeRegistry(entries);
}

export function findDemoBySlug(slug: string): DemoSiteRecord | undefined {
  return readRegistry().find((item) => item.slug === slug);
}

export function findDemoByShortId(shortId: string): DemoSiteRecord | undefined {
  return readRegistry().find((item) => item.slug.endsWith(`-${shortId}`));
}

export function findDemoByClientId(clientId: string): DemoSiteRecord | undefined {
  return readRegistry().find((item) => item.clientId === clientId);
}

export function findDemoByDeploymentId(deploymentId: string): DemoSiteRecord | undefined {
  return readRegistry().find((item) => item.deploymentId === deploymentId);
}

export function markDemoPaid(deploymentId: string): boolean {
  const entries = readRegistry();
  let updated = false;
  const next = entries.map((item) => {
    if (item.deploymentId !== deploymentId && item.slug !== deploymentId) {
      return item;
    }
    updated = true;
    return { ...item, paid: true };
  });
  if (updated) writeRegistry(next);
  return updated;
}

/** Mark paid by tenant clientId (Polar/LemonSqueezy webhooks). */
export function markDemoPaidByClientId(clientId: string): boolean {
  const id = String(clientId || "").trim();
  if (!id) return false;
  const entries = readRegistry();
  let updated = false;
  const next = entries.map((item) => {
    if (item.clientId !== id) return item;
    updated = true;
    return { ...item, paid: true };
  });
  if (updated) writeRegistry(next);
  return updated;
}

/** Re-lock paywall (tariff + promo) after a false/stale paid unlock. */
export function markDemoUnpaidByClientId(clientId: string): boolean {
  const id = String(clientId || "").trim();
  if (!id) return false;
  const entries = readRegistry();
  let updated = false;
  const next = entries.map((item) => {
    if (item.clientId !== id) return item;
    if (item.paid !== true) return item;
    updated = true;
    return { ...item, paid: false };
  });
  if (updated) writeRegistry(next);
  return updated;
}

export function removeDemoByDeploymentId(deploymentId: string): void {
  writeRegistry(readRegistry().filter((item) => item.deploymentId !== deploymentId));
}

export function listDemoRecords(): DemoSiteRecord[] {
  return readRegistry();
}

type FirestoreDemoFields = {
  demoSlug?: unknown;
  deploymentId?: unknown;
  deploymentUrl?: unknown;
  projectName?: unknown;
  deployedAt?: unknown;
  deleteAt?: unknown;
  paid?: unknown;
  polarEmail?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asClientId(value: unknown): string {
  const id = asTrimmedString(value);
  return UUID_RE.test(id) ? id : "";
}

async function loadFirestoreDemoFields(clientId: string): Promise<FirestoreDemoFields | null> {
  const id = clientId.trim();
  if (!id) return null;
  try {
    const { getFirestoreDb } = await import("@/lib/firebase/admin");
    const snap = await getFirestoreDb().collection("clients").doc(id).get();
    if (!snap.exists) return null;
    return (snap.data() || {}) as FirestoreDemoFields;
  } catch {
    return null;
  }
}

/**
 * Rebuild in-memory/disk registry from Firestore or the public URL.
 * Render /tmp loses demo-registry.json on deploy, which drops /site and paid-bar links.
 */
export async function hydrateDemoRecord(input: {
  slug?: string;
  clientId?: string;
}): Promise<DemoSiteRecord | undefined> {
  const slugHint = asTrimmedString(input.slug);
  const clientIdHint = asClientId(input.clientId);
  const existing =
    (slugHint ? findDemoBySlug(slugHint) : undefined) ||
    (clientIdHint ? findDemoByClientId(clientIdHint) : undefined);
  if (existing) {
    const clientId = existing.clientId || clientIdHint;
    if (!clientId) return existing;
    const data = await loadFirestoreDemoFields(clientId);
    // Only explicit clients/{id}.paid unlocks — never inherit from a paid email.
    if (data?.paid === true) {
      if (!existing.paid) markDemoPaidByClientId(clientId);
      return findDemoByClientId(clientId) || existing;
    }
    // Stale local paid (email inherit / false unlock) → restore tariff + promo banner.
    if (existing.paid) {
      markDemoUnpaidByClientId(clientId);
      return findDemoByClientId(clientId) || { ...existing, paid: false };
    }
    return existing;
  }

  let clientId = clientIdHint;
  let data: FirestoreDemoFields | null = clientId ? await loadFirestoreDemoFields(clientId) : null;

  if (!data && slugHint) {
    try {
      const { getFirestoreDb } = await import("@/lib/firebase/admin");
      const snap = await getFirestoreDb()
        .collection("clients")
        .where("demoSlug", "==", slugHint)
        .limit(1)
        .get();
      if (!snap.empty) {
        clientId = snap.docs[0]!.id;
        data = (snap.docs[0]!.data() || {}) as FirestoreDemoFields;
      }
    } catch {
      /* ignore */
    }
  }

  const slug = asTrimmedString(data?.demoSlug) || slugHint;
  if (!clientId || !slug) return undefined;

  const paid = data?.paid === true;
  const record: DemoSiteRecord = {
    slug,
    clientId,
    deploymentId: asTrimmedString(data?.deploymentId) || "hydrated",
    deploymentUrl: asTrimmedString(data?.deploymentUrl),
    projectName: asTrimmedString(data?.projectName) || "crm-demo-sites",
    deployedAt: asTrimmedString(data?.deployedAt) || new Date().toISOString(),
    deleteAt: asTrimmedString(data?.deleteAt) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    paid,
  };
  upsertDemoRecord(record);
  return findDemoBySlug(slug) || record;
}
