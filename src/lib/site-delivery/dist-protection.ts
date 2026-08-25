import fs from "fs";
import path from "path";

import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";

const DAY_MS = 24 * 60 * 60 * 1000;
export const PAID_DIST_RETENTION_MS = 7 * DAY_MS;
export const ADMIN_EDITED_RETENTION_MS = 730 * DAY_MS;

export type ClientDistProtectionRecord = {
  clientId: string;
  paid: boolean;
  protected: boolean;
  protectedUntil: string;
  emailDeliveredAt?: string;
  adminEdited?: boolean;
  updatedAt: string;
};

const PROTECTION_PATH = () => path.join(resolvePersistentDataDir(), "client-dist-protection.json");

function readProtectionRecords(): ClientDistProtectionRecord[] {
  const filePath = PROTECTION_PATH();
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as ClientDistProtectionRecord[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeProtectionRecords(records: ClientDistProtectionRecord[]): void {
  const filePath = PROTECTION_PATH();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export function getClientDistProtection(clientId: string): ClientDistProtectionRecord | null {
  return readProtectionRecords().find((record) => record.clientId === clientId) ?? null;
}

export function listActiveProtectedClientIds(now = Date.now()): Set<string> {
  const active = new Set<string>();
  for (const record of readProtectionRecords()) {
    if (!record.protected) {
      continue;
    }
    const protectedUntilMs = new Date(record.protectedUntil).getTime();
    if (Number.isFinite(protectedUntilMs) && protectedUntilMs > now) {
      active.add(record.clientId);
    }
  }
  return active;
}

export function isClientDistProtected(clientId: string, now = Date.now()): boolean {
  const record = getClientDistProtection(clientId);
  if (!record?.protected) {
    return false;
  }
  const protectedUntilMs = new Date(record.protectedUntil).getTime();
  return Number.isFinite(protectedUntilMs) && protectedUntilMs > now;
}

export function markClientDistPaid(clientId: string): ClientDistProtectionRecord {
  const now = new Date();
  const protectedUntil = new Date(now.getTime() + PAID_DIST_RETENTION_MS);
  const existing = getClientDistProtection(clientId);

  const record: ClientDistProtectionRecord = {
    clientId,
    paid: true,
    protected: true,
    protectedUntil: protectedUntil.toISOString(),
    emailDeliveredAt: existing?.emailDeliveredAt,
    adminEdited: existing?.adminEdited,
    updatedAt: now.toISOString(),
  };

  const records = readProtectionRecords().filter((item) => item.clientId !== clientId);
  records.push(record);
  writeProtectionRecords(records);

  console.log("[dist-protection] marked paid", {
    clientId,
    protectedUntil: record.protectedUntil,
  });

  return record;
}

export function markClientDistEmailDelivered(clientId: string): ClientDistProtectionRecord {
  const now = new Date();
  const protectedUntil = new Date(now.getTime() + PAID_DIST_RETENTION_MS);
  const existing = getClientDistProtection(clientId);

  const record: ClientDistProtectionRecord = {
    clientId,
    paid: existing?.paid ?? true,
    protected: true,
    protectedUntil: protectedUntil.toISOString(),
    emailDeliveredAt: now.toISOString(),
    adminEdited: existing?.adminEdited,
    updatedAt: now.toISOString(),
  };

  const records = readProtectionRecords().filter((item) => item.clientId !== clientId);
  records.push(record);
  writeProtectionRecords(records);

  console.log("[dist-protection] marked email delivered", {
    clientId,
    protectedUntil: record.protectedUntil,
    emailDeliveredAt: record.emailDeliveredAt,
  });

  return record;
}

/** Keep admin-edited sites on disk without marking the tenant paid. */
export function markClientAdminEdited(clientId: string): ClientDistProtectionRecord {
  const id = String(clientId || "").trim();
  const now = new Date();
  const existing = getClientDistProtection(id);
  const paidUntil = existing?.paid ? new Date(existing.protectedUntil).getTime() : 0;
  const adminUntil = now.getTime() + ADMIN_EDITED_RETENTION_MS;
  const protectedUntilMs = Math.max(
    paidUntil,
    adminUntil,
    now.getTime() + PAID_DIST_RETENTION_MS,
  );

  const record: ClientDistProtectionRecord = {
    clientId: id,
    paid: existing?.paid ?? false,
    protected: true,
    protectedUntil: new Date(protectedUntilMs).toISOString(),
    emailDeliveredAt: existing?.emailDeliveredAt,
    adminEdited: true,
    updatedAt: now.toISOString(),
  };

  const records = readProtectionRecords().filter((item) => item.clientId !== id);
  records.push(record);
  writeProtectionRecords(records);
  return record;
}

export function pruneExpiredProtectionRecords(): number {
  const now = Date.now();
  const records = readProtectionRecords();
  const kept = records.filter((record) => {
    const protectedUntilMs = new Date(record.protectedUntil).getTime();
    return Number.isFinite(protectedUntilMs) && protectedUntilMs > now;
  });

  const removed = records.length - kept.length;
  if (removed > 0) {
    writeProtectionRecords(kept);
  }
  return removed;
}
