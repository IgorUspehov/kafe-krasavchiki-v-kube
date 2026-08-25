import fs from "fs";
import path from "path";

import {
  deletePagesDeployment,
  isCloudflareDeployConfigured,
  pruneOldDeployments,
} from "@/lib/cloudflare/deploy";
import {
  findDemoByClientId,
  findDemoByDeploymentId,
  findDemoBySlug,
  listDemoRecords,
  markDemoPaid,
  markDemoPaidByClientId,
  removeDemoByDeploymentId,
} from "@/lib/cloudflare/demo-registry";
import {
  getDeploymentKeepCount,
  getSharedPagesProjectName,
} from "@/lib/cloudflare/shared-project";
import type { PendingDeletionRecord } from "@/lib/manifest/storage-manager";
import { resolvePendingDeletionsPath } from "@/lib/manifest/storage-paths";
import { removeClientDistIfUnprotected } from "@/lib/site-delivery/dist-store";
import { getClientDistProtection, isClientDistProtected } from "@/lib/site-delivery/dist-protection";

/** Test-mode default: auto-delete unpaid CRM Demo deployments after 10 minutes. */
const DEFAULT_TTL_MINUTES = 10;
const CHECK_INTERVAL_MS = 60 * 1000;

export function getCrmDemoTtlMinutes(): number {
  const raw = Number(process.env.CRM_DEMO_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_TTL_MINUTES;
  return Math.floor(raw);
}

export function getCrmDemoTtlMs(): number {
  return getCrmDemoTtlMinutes() * 60 * 1000;
}

export type PendingDeletion = PendingDeletionRecord & {
  deploymentUrl?: string;
  slug?: string;
  projectName?: string;
};

function getPendingDeletionsPath(): string {
  return resolvePendingDeletionsPath();
}

function readPendingDeletions(): PendingDeletion[] {
  const pendingDeletionsPath = getPendingDeletionsPath();
  if (!fs.existsSync(pendingDeletionsPath)) {
    return [];
  }

  try {
    const raw = JSON.parse(fs.readFileSync(pendingDeletionsPath, "utf8")) as PendingDeletion[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writePendingDeletions(entries: PendingDeletion[]): void {
  const pendingDeletionsPath = getPendingDeletionsPath();
  fs.mkdirSync(path.dirname(pendingDeletionsPath), { recursive: true });
  fs.writeFileSync(pendingDeletionsPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

export function scheduleDeletion(entry: {
  siteId: string;
  clientId: string;
  siteUrl: string;
  deployedAt: string;
  deleteAt?: string;
  deploymentUrl?: string;
  slug?: string;
  projectName?: string;
}): PendingDeletion {
  const deployedAt = entry.deployedAt;
  const deleteAt =
    entry.deleteAt ??
    new Date(new Date(deployedAt).getTime() + getCrmDemoTtlMs()).toISOString();

  const record: PendingDeletion = {
    siteId: entry.siteId,
    clientId: entry.clientId,
    siteUrl: entry.siteUrl,
    deployedAt,
    deleteAt,
    deploymentUrl: entry.deploymentUrl,
    slug: entry.slug,
    projectName: entry.projectName ?? getSharedPagesProjectName(),
  };

  const entries = readPendingDeletions().filter((item) => item.siteId !== record.siteId);
  entries.push(record);
  writePendingDeletions(entries);

  console.info("[cloudflare-scheduler] scheduled deletion", {
    deploymentId: record.siteId,
    clientId: record.clientId,
    deployedAt: record.deployedAt,
    deleteAt: record.deleteAt,
    ttlMinutes: getCrmDemoTtlMinutes(),
  });

  return record;
}

export function cancelDeletion(siteId: string): boolean {
  const entries = readPendingDeletions();
  let updated = false;

  const next = entries.map((item) => {
    if (item.siteId !== siteId && item.slug !== siteId && item.clientId !== siteId) {
      return item;
    }

    updated = true;
    return { ...item, paid: true };
  });

  if (updated) {
    writePendingDeletions(next);
  }
  const registryUpdated = markDemoPaid(siteId);
  return updated || registryUpdated;
}

/** Mark every pending TTL row for this tenant paid — Polar/promo must hit clientId, not only deploymentId. */
export function cancelDeletionForClient(clientId: string): boolean {
  const id = String(clientId || "").trim();
  if (!id) return false;
  const entries = readPendingDeletions();
  let updated = false;
  const next = entries.map((item) => {
    if (item.clientId !== id && item.siteId !== id && item.slug !== id) {
      return item;
    }
    updated = true;
    return { ...item, paid: true };
  });
  if (updated) writePendingDeletions(next);
  const registryUpdated = markDemoPaidByClientId(id) || markDemoPaid(id);
  return updated || registryUpdated;
}

/** Re-open TTL + clear paid on pending rows so paywall can show again. */
export function reopenDeletionForClient(clientId: string): boolean {
  const id = String(clientId || "").trim();
  if (!id) return false;
  const entries = readPendingDeletions();
  let updated = false;
  const next = entries.map((item) => {
    if (item.clientId !== id && item.siteId !== id && item.slug !== id) {
      return item;
    }
    if (item.paid !== true) return item;
    updated = true;
    return { ...item, paid: false };
  });
  if (updated) writePendingDeletions(next);
  return updated;
}

function isPendingEntryPaid(entry: PendingDeletion): boolean {
  if (entry.paid) return true;
  if (findDemoByClientId(entry.clientId)?.paid === true) return true;
  if (findDemoByDeploymentId(entry.siteId)?.paid === true) return true;
  if (entry.slug && findDemoBySlug(entry.slug)?.paid === true) return true;
  if (getClientDistProtection(entry.clientId)?.paid === true) return true;
  return false;
}

export function findPendingBySiteId(siteId: string): PendingDeletion | undefined {
  return readPendingDeletions().find((item) => item.siteId === siteId);
}

export function findPendingByClientId(clientId: string): PendingDeletion | undefined {
  return readPendingDeletions().find((item) => item.clientId === clientId);
}

export function findPendingBySiteUrl(siteUrl: string): PendingDeletion | undefined {
  const normalized = siteUrl.replace(/\/$/, "");
  return readPendingDeletions().find((item) => {
    const urls = [item.siteUrl, item.deploymentUrl].filter(Boolean) as string[];
    return urls.some((u) => u.replace(/\/$/, "") === normalized);
  });
}

export async function processExpiredDeletions(): Promise<void> {
  if (!isCloudflareDeployConfigured()) {
    return;
  }

  const projectName = getSharedPagesProjectName();
  const now = Date.now();
  const entries = readPendingDeletions();
  const remaining: PendingDeletion[] = [];

  for (const entry of entries) {
    let paid = isPendingEntryPaid(entry);
    if (!paid) {
      try {
        const { isClientPaidInStore } = await import("@/lib/billing/paid-tenant");
        paid = await isClientPaidInStore(entry.clientId);
      } catch {
        paid = false;
      }
    }
    if (paid) {
      remaining.push({ ...entry, paid: true });
      continue;
    }

    if (new Date(entry.deleteAt).getTime() <= now) {
      try {
        const targetProject = entry.projectName || projectName;
        // siteId is deploymentId in the shared-project model.
        await deletePagesDeployment(targetProject, entry.siteId);
        removeDemoByDeploymentId(entry.siteId);

        // Volume snapshot: unpaid only (paid entries already skipped above).
        // Double protection check lives in removeClientDistIfUnprotected.
        if (isClientDistProtected(entry.clientId)) {
          console.info("[cloudflare-scheduler] skip client-dist delete — protected", {
            clientId: entry.clientId,
          });
        } else {
          removeClientDistIfUnprotected(entry.clientId);
        }

        console.info(`[cloudflare-scheduler] Deleted expired deployment ${entry.siteId}`);
      } catch (error) {
        console.error(`[cloudflare-scheduler] Failed to delete deployment ${entry.siteId}:`, error);
        remaining.push(entry);
      }
    } else {
      remaining.push(entry);
    }
  }

  writePendingDeletions(remaining);
}

export async function pruneSharedProjectDeployments(): Promise<void> {
  if (!isCloudflareDeployConfigured()) return;
  const projectName = getSharedPagesProjectName();
  const keep = getDeploymentKeepCount();
  const protect = new Set<string>();
  for (const entry of readPendingDeletions()) {
    if (entry.paid) protect.add(entry.siteId);
  }
  for (const demo of listDemoRecords()) {
    if (demo.paid) protect.add(demo.deploymentId);
  }
  await pruneOldDeployments(projectName, keep, protect);
}

let schedulerStarted = false;

export function startDeletionScheduler(): void {
  if (schedulerStarted || typeof setInterval === "undefined") {
    return;
  }

  schedulerStarted = true;

  console.info("[cloudflare-scheduler] started", {
    ttlMinutes: getCrmDemoTtlMinutes(),
    checkIntervalMs: CHECK_INTERVAL_MS,
    pendingPath: getPendingDeletionsPath(),
  });

  void processExpiredDeletions();
  setInterval(() => {
    void processExpiredDeletions();
  }, CHECK_INTERVAL_MS);
}
