import fs from "fs";
import path from "path";

import { isCloudflareDeployConfigured, pruneOldDeployments } from "@/lib/cloudflare/deploy";
import {
  listDemoRecords,
  markDemoPaid,
  markDemoPaidByClientId,
} from "@/lib/cloudflare/demo-registry";
import {
  getDeploymentKeepCount,
  getSharedPagesProjectName,
} from "@/lib/cloudflare/shared-project";
import type { PendingDeletionRecord } from "@/lib/manifest/storage-manager";
import { resolvePendingDeletionsPath } from "@/lib/manifest/storage-paths";

/**
 * Demo TTL is disabled — demos + CRM data are permanent.
 * Kept as ~10 years only so existing call sites that still compute deleteAt stay far in the future.
 */
const PERMANENT_TTL_MINUTES = 10 * 365 * 24 * 60; // ~10 years

/** Always returns a multi-year TTL. Env CRM_DEMO_TTL_MINUTES is ignored (deletion disabled). */
export function getCrmDemoTtlMinutes(): number {
  return PERMANENT_TTL_MINUTES;
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

/**
 * Records demo metadata for paid/lookup flows. Does not schedule real deletion —
 * deleteAt is set ~10 years ahead; processExpiredDeletions is a no-op.
 */
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

  console.info("[cloudflare-scheduler] recorded demo (TTL deletion disabled)", {
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

/**
 * TTL auto-deletion disabled — demos, deployments, and CRM data are never removed by time.
 * Kept as an exported no-op so callers/instrumentation remain safe.
 */
export async function processExpiredDeletions(): Promise<void> {
  return;
}

/**
 * Protect every known demo deployment so unpaid demos are never pruned from Cloudflare Pages.
 */
export async function pruneSharedProjectDeployments(): Promise<void> {
  if (!isCloudflareDeployConfigured()) return;
  const projectName = getSharedPagesProjectName();
  const keep = getDeploymentKeepCount();
  const protect = new Set<string>();
  for (const entry of readPendingDeletions()) {
    protect.add(entry.siteId);
  }
  for (const demo of listDemoRecords()) {
    protect.add(demo.deploymentId);
  }
  await pruneOldDeployments(projectName, keep, protect);
}

let schedulerStarted = false;

export function startDeletionScheduler(): void {
  if (schedulerStarted || typeof setInterval === "undefined") {
    return;
  }

  schedulerStarted = true;

  console.info("[cloudflare-scheduler] TTL deletion DISABLED — demos are permanent", {
    ttlMinutes: getCrmDemoTtlMinutes(),
    pendingPath: getPendingDeletionsPath(),
  });
}
