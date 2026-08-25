import fs from "fs";
import path from "path";

import { resolveClientDistsRoot } from "@/lib/site-delivery/dist-store";
import { pruneExpiredProtectionRecords } from "@/lib/site-delivery/dist-protection";
import { pruneExpiredDownloadAccessRecords } from "@/lib/site-delivery/download-access";
import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";
import {
  resolveManifestsDir,
  resolvePendingDeletionsPath,
  resolveTempZipsDir,
} from "@/lib/manifest/storage-paths";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Demos are permanent — do not age-delete manifests / dists (was 7 days). */
const MANIFEST_MAX_AGE_MS = 10 * 365 * DAY_MS;
const CLIENT_DIST_MAX_AGE_MS = 10 * 365 * DAY_MS;
const PENDING_DELETION_MAX_AGE_MS = 10 * 365 * DAY_MS;
const TEMP_ZIP_MAX_AGE_MS = 60 * 60 * 1000;
const MIN_FREE_SPACE_BYTES = 100 * 1024 * 1024;
const CLIENT_DISTS_SIZE_LIMIT_BYTES = 200 * 1024 * 1024;
const STORAGE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

export type PendingDeletionRecord = {
  siteId: string;
  clientId: string;
  siteUrl: string;
  deployedAt: string;
  deleteAt: string;
  paid?: boolean;
};

export type StorageFolderSizes = {
  dataRoot: string;
  manifests: string;
  clientDists: string;
  pendingDeletions: string;
  tempZips: string;
};

export type StorageCleanupResult = {
  deletedManifests: number;
  deletedClientDists: number;
  deletedZipFiles: number;
  deletedPendingDeletions: number;
  freeSpaceBeforeMb: number;
  freeSpaceAfterMb: number;
  usedPercent: number | null;
  aggressive: boolean;
  folderSizesBefore: StorageFolderSizes;
  folderSizesAfter: StorageFolderSizes;
  largestFiles: { path: string; sizeMb: number }[];
};

function safeStat(targetPath: string): fs.Stats | null {
  try {
    return fs.statSync(targetPath);
  } catch {
    return null;
  }
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getDirectorySizeBytes(targetPath: string): number {
  const stat = safeStat(targetPath);
  if (!stat) {
    return 0;
  }
  if (stat.isFile()) {
    return stat.size;
  }
  if (!stat.isDirectory()) {
    return 0;
  }

  let total = 0;
  for (const entry of fs.readdirSync(targetPath)) {
    total += getDirectorySizeBytes(path.join(targetPath, entry));
  }
  return total;
}

export function getDiskSpaceStats(targetPath = resolvePersistentDataDir()): {
  freeBytes: number;
  totalBytes: number;
  usedPercent: number | null;
} {
  try {
    const stats = fs.statfsSync(targetPath);
    const freeBytes = Number(stats.bfree) * Number(stats.bsize);
    const totalBytes = Number(stats.blocks) * Number(stats.bsize);
    const usedPercent =
      totalBytes > 0 ? Number((((totalBytes - freeBytes) / totalBytes) * 100).toFixed(1)) : null;
    return { freeBytes, totalBytes, usedPercent };
  } catch {
    return { freeBytes: 0, totalBytes: 0, usedPercent: null };
  }
}

export function getFolderSizes(): StorageFolderSizes {
  const dataRoot = resolvePersistentDataDir();
  const manifestsDir = resolveManifestsDir();
  const clientDistsDir = resolveClientDistsRoot();
  const pendingDeletionsPath = resolvePendingDeletionsPath();
  const tempZipsDir = resolveTempZipsDir();

  const pendingSize = safeStat(pendingDeletionsPath)?.size ?? 0;

  return {
    dataRoot: formatMb(getDirectorySizeBytes(dataRoot)),
    manifests: formatMb(getDirectorySizeBytes(manifestsDir)),
    clientDists: formatMb(getDirectorySizeBytes(clientDistsDir)),
    pendingDeletions: formatMb(pendingSize),
    tempZips: formatMb(getDirectorySizeBytes(tempZipsDir)),
  };
}

export function findLargestFiles(limit = 20): { path: string; sizeMb: number }[] {
  const root = resolvePersistentDataDir();
  const files: { path: string; size: number }[] = [];

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) {
      return;
    }
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const stat = safeStat(fullPath);
      if (!stat) {
        continue;
      }
      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }
      files.push({ path: fullPath, size: stat.size });
    }
  };

  walk(root);

  return files
    .sort((a, b) => b.size - a.size)
    .slice(0, limit)
    .map((file) => ({
      path: file.path,
      sizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
    }));
}

function pruneFilesByAge(
  dir: string,
  maxAgeMs: number,
  extension?: string,
  protectedClientIds?: Set<string>,
): number {
  if (!fs.existsSync(dir)) {
    return 0;
  }

  const cutoff = Date.now() - maxAgeMs;
  let removed = 0;

  for (const entry of fs.readdirSync(dir)) {
    const clientId = entry.replace(/\.json$/, "");
    if (protectedClientIds?.has(clientId)) {
      continue;
    }
    const fullPath = path.join(dir, entry);
    const stat = safeStat(fullPath);
    if (!stat?.isFile()) {
      continue;
    }
    if (extension && !entry.endsWith(extension)) {
      continue;
    }
    if (stat.mtimeMs >= cutoff) {
      continue;
    }

    try {
      fs.unlinkSync(fullPath);
      removed += 1;
    } catch {
      /* best effort */
    }
  }

  return removed;
}

function pruneDirectoriesByAge(dir: string, maxAgeMs: number, protectedClientIds: Set<string>): number {
  if (!fs.existsSync(dir)) {
    return 0;
  }

  const cutoff = Date.now() - maxAgeMs;
  let removed = 0;

  for (const entry of fs.readdirSync(dir)) {
    if (protectedClientIds.has(entry)) {
      continue;
    }

    const fullPath = path.join(dir, entry);
    const stat = safeStat(fullPath);
    if (!stat?.isDirectory()) {
      continue;
    }
    if (stat.mtimeMs >= cutoff) {
      continue;
    }

    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      removed += 1;
    } catch {
      /* best effort */
    }
  }

  return removed;
}

function pruneNewestOverflow(
  dir: string,
  keepCount: number,
  extension?: string,
  protectedClientIds?: Set<string>,
): number {
  if (!fs.existsSync(dir)) {
    return 0;
  }

  const files = fs
    .readdirSync(dir)
    .map((name) => {
      const fullPath = path.join(dir, name);
      const stat = safeStat(fullPath);
      if (!stat?.isFile()) {
        return null;
      }
      if (extension && !name.endsWith(extension)) {
        return null;
      }
      const clientId = name.replace(/\.json$/, "");
      if (protectedClientIds?.has(clientId)) {
        return null;
      }
      return { fullPath, mtimeMs: stat.mtimeMs };
    })
    .filter((item): item is { fullPath: string; mtimeMs: number } => item !== null)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  let removed = 0;
  for (const file of files.slice(keepCount)) {
    try {
      fs.unlinkSync(file.fullPath);
      removed += 1;
    } catch {
      /* best effort */
    }
  }

  return removed;
}

function pruneDirectoryOverflow(dir: string, keepCount: number, protectedClientIds: Set<string>): number {
  if (!fs.existsSync(dir)) {
    return 0;
  }

  const directories = fs
    .readdirSync(dir)
    .map((name) => {
      const fullPath = path.join(dir, name);
      const stat = safeStat(fullPath);
      if (!stat?.isDirectory()) {
        return null;
      }
      return { name, fullPath, mtimeMs: stat.mtimeMs, protected: protectedClientIds.has(name) };
    })
    .filter((item): item is { name: string; fullPath: string; mtimeMs: number; protected: boolean } => item !== null)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  const unprotected = directories.filter((directory) => !directory.protected);
  const protectedCount = directories.length - unprotected.length;
  const allowedUnprotected = Math.max(keepCount - protectedCount, 0);

  let removed = 0;
  for (const directory of unprotected.slice(allowedUnprotected)) {
    try {
      fs.rmSync(directory.fullPath, { recursive: true, force: true });
      removed += 1;
    } catch {
      /* best effort */
    }
  }

  return removed;
}

function readPendingDeletions(): PendingDeletionRecord[] {
  const filePath = resolvePendingDeletionsPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as PendingDeletionRecord[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writePendingDeletions(entries: PendingDeletionRecord[]): void {
  const filePath = resolvePendingDeletionsPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

function prunePendingDeletionRecords(maxAgeMs: number): number {
  const now = Date.now();
  const entries = readPendingDeletions();
  const kept: PendingDeletionRecord[] = [];
  let removed = 0;

  for (const entry of entries) {
    const deployedAtMs = new Date(entry.deployedAt).getTime();
    const deleteAtMs = new Date(entry.deleteAt).getTime();
    const ageMs = Number.isFinite(deployedAtMs) ? now - deployedAtMs : 0;
    const demoExpired = Number.isFinite(deleteAtMs) ? deleteAtMs <= now : false;

    const shouldRemove =
      ageMs > maxAgeMs &&
      (entry.paid === true || demoExpired || ageMs > 7 * DAY_MS);

    if (shouldRemove) {
      removed += 1;
      continue;
    }

    kept.push(entry);
  }

  if (removed > 0) {
    writePendingDeletions(kept);
  }

  return removed;
}

export function pruneTempZipFiles(maxAgeMs = TEMP_ZIP_MAX_AGE_MS): number {
  const tempZipsDir = resolveTempZipsDir();
  return pruneFilesByAge(tempZipsDir, maxAgeMs, ".zip");
}

export function deleteTempZipForClient(clientId: string): boolean {
  const zipPath = path.join(resolveTempZipsDir(), `${clientId.replace(/[^a-zA-Z0-9_-]/g, "")}.zip`);
  if (!fs.existsSync(zipPath)) {
    return false;
  }

  try {
    fs.unlinkSync(zipPath);
    return true;
  } catch {
    return false;
  }
}

export function isEnospcError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOSPC"
  );
}

function logStorageCleanup(
  result: StorageCleanupResult,
  diskBefore: { freeBytes: number; totalBytes: number },
  aggressiveBySize = false,
  clientDistsBytes = 0,
): void {
  const occupiedBeforeMb =
    diskBefore.totalBytes > 0
      ? (diskBefore.totalBytes - diskBefore.freeBytes) / (1024 * 1024)
      : Number.parseFloat(result.folderSizesBefore.dataRoot) || 0;
  const freedMb = result.freeSpaceAfterMb - result.freeSpaceBeforeMb;

  console.log("[storage] deleted manifests:", result.deletedManifests);
  console.log("[storage] deleted client-dists:", result.deletedClientDists);
  console.log("[storage] deleted zip files:", result.deletedZipFiles);
  console.log("[storage] deleted pending-deletions:", result.deletedPendingDeletions);
  console.log("[storage] occupied before:", `${occupiedBeforeMb.toFixed(2)} MB`);
  console.log("[storage] free space before:", `${result.freeSpaceBeforeMb.toFixed(2)} MB`);
  console.log("[storage] free space after:", `${result.freeSpaceAfterMb.toFixed(2)} MB`);
  console.log("[storage] freed:", `${freedMb.toFixed(2)} MB`);
  if (result.usedPercent !== null) {
    console.log("[storage] volume used:", `${result.usedPercent}%`);
  }
  if (result.aggressive) {
    console.log("[storage] aggressive cleanup: enabled");
  }
  if (aggressiveBySize) {
    console.log(
      "[storage] aggressive cleanup: client-dists exceeded limit",
      formatMb(clientDistsBytes),
    );
  }
}

export function runStorageCleanup(options?: {
  aggressive?: boolean;
  manifestMaxAgeMs?: number;
  clientDistMaxAgeMs?: number;
  pendingDeletionMaxAgeMs?: number;
  maxManifests?: number;
  maxClientDists?: number;
}): StorageCleanupResult {
  const diskBefore = getDiskSpaceStats();
  const clientDistsDir = resolveClientDistsRoot();
  const clientDistsBytes = getDirectorySizeBytes(clientDistsDir);
  const aggressiveBySize = clientDistsBytes > CLIENT_DISTS_SIZE_LIMIT_BYTES;
  const aggressive =
    options?.aggressive ?? (diskBefore.freeBytes < MIN_FREE_SPACE_BYTES || aggressiveBySize);

  const folderSizesBefore = getFolderSizes();
  pruneExpiredProtectionRecords();
  pruneExpiredDownloadAccessRecords();

  // Permanent demos: never age-delete or overflow-prune manifests / client-dists / pending rows.
  const deletedManifests = 0;
  const deletedClientDists = 0;
  const deletedPendingDeletions = 0;
  const deletedZipFiles = aggressive
    ? pruneTempZipFiles(0)
    : pruneTempZipFiles(TEMP_ZIP_MAX_AGE_MS);

  const diskAfter = getDiskSpaceStats();
  const result: StorageCleanupResult = {
    deletedManifests,
    deletedClientDists,
    deletedZipFiles,
    deletedPendingDeletions,
    freeSpaceBeforeMb: diskBefore.freeBytes / (1024 * 1024),
    freeSpaceAfterMb: diskAfter.freeBytes / (1024 * 1024),
    usedPercent: diskAfter.usedPercent,
    aggressive,
    folderSizesBefore,
    folderSizesAfter: getFolderSizes(),
    largestFiles: findLargestFiles(20),
  };

  if (
    deletedManifests > 0 ||
    deletedClientDists > 0 ||
    deletedZipFiles > 0 ||
    deletedPendingDeletions > 0 ||
    aggressive ||
    diskBefore.freeBytes < MIN_FREE_SPACE_BYTES ||
    aggressiveBySize
  ) {
    logStorageCleanup(result, diskBefore, aggressiveBySize, clientDistsBytes);
  }

  return result;
}

/** @deprecated Use runStorageCleanup() */
export function prunePersistentStorage(options?: {
  maxManifests?: number;
  maxClientDists?: number;
  maxAgeDays?: number;
}): { manifestsRemoved: number; clientDistsRemoved: number } {
  const result = runStorageCleanup({
    manifestMaxAgeMs: (options?.maxAgeDays ?? 7) * DAY_MS,
    clientDistMaxAgeMs: (options?.maxAgeDays ?? 7) * DAY_MS,
    maxManifests: options?.maxManifests,
    maxClientDists: options?.maxClientDists,
  });

  return {
    manifestsRemoved: result.deletedManifests,
    clientDistsRemoved: result.deletedClientDists,
  };
}

let storageSchedulerStarted = false;

export function startStorageScheduler(): void {
  if (storageSchedulerStarted || typeof setInterval === "undefined") {
    return;
  }

  storageSchedulerStarted = true;

  void runStorageCleanup();
  setInterval(() => {
    void runStorageCleanup();
  }, STORAGE_CHECK_INTERVAL_MS);
}
