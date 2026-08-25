import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";

const DAY_MS = 24 * 60 * 60 * 1000;
export const DOWNLOAD_TOKEN_TTL_MS = 7 * DAY_MS;

export type SiteDownloadAccess = {
  clientId: string;
  token: string;
  grantedAt: string;
  expiresAt: string;
};

export type DownloadAccessVerification = {
  allowed: boolean;
  tokenMatch: boolean;
  tokenExpired: boolean;
};

const ACCESS_PATH = () => path.join(resolvePersistentDataDir(), "site-download-access.json");

function readAccessRecords(): SiteDownloadAccess[] {
  const filePath = ACCESS_PATH();
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as SiteDownloadAccess[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeAccessRecords(records: SiteDownloadAccess[]): void {
  const filePath = ACCESS_PATH();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

function pruneExpiredAccessRecords(records: SiteDownloadAccess[]): SiteDownloadAccess[] {
  const now = Date.now();
  return records.filter((record) => {
    const expiresAtMs = new Date(record.expiresAt).getTime();
    return Number.isFinite(expiresAtMs) && expiresAtMs > now;
  });
}

function loadActiveAccessRecords(): SiteDownloadAccess[] {
  const records = pruneExpiredAccessRecords(readAccessRecords());
  if (records.length !== readAccessRecords().length) {
    writeAccessRecords(records);
  }
  return records;
}

export function pruneExpiredDownloadAccessRecords(): number {
  const before = readAccessRecords();
  const after = pruneExpiredAccessRecords(before);
  const removed = before.length - after.length;
  if (removed > 0) {
    writeAccessRecords(after);
  }
  return removed;
}

export function grantSiteDownloadAccess(clientId: string): string {
  const token = randomUUID();
  const grantedAt = new Date();
  const expiresAt = new Date(grantedAt.getTime() + DOWNLOAD_TOKEN_TTL_MS);

  const records = loadActiveAccessRecords();
  records.push({
    clientId,
    token,
    grantedAt: grantedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  writeAccessRecords(records);
  return token;
}

export function verifySiteDownloadAccess(clientId: string, token: string): DownloadAccessVerification {
  const records = loadActiveAccessRecords();
  const match = records.find((record) => record.clientId === clientId && record.token === token);

  if (!match) {
    return {
      allowed: false,
      tokenMatch: false,
      tokenExpired: false,
    };
  }

  const expiresAtMs = new Date(match.expiresAt).getTime();
  const tokenExpired = !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now();

  return {
    allowed: !tokenExpired,
    tokenMatch: true,
    tokenExpired,
  };
}
