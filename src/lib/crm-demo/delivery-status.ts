import fs from "fs";
import path from "path";

import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";

export type CrmDemoDeliveryRecord = {
  clientId: string;
  EMAIL_SENT: boolean;
  emailedAt: string | null;
  recipient: string | null;
  siteUrl: string | null;
  orderId: string | null;
  zipAttached: boolean;
};

const STATUS_PATH = () => path.join(resolvePersistentDataDir(), "crm-demo-delivery.json");

function readRecords(): CrmDemoDeliveryRecord[] {
  const filePath = STATUS_PATH();
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as CrmDemoDeliveryRecord[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeRecords(records: CrmDemoDeliveryRecord[]): void {
  const filePath = STATUS_PATH();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export function getCrmDemoDeliveryStatus(clientId: string): CrmDemoDeliveryRecord | null {
  return readRecords().find((record) => record.clientId === clientId) ?? null;
}

export function markCrmDemoEmailSent(input: {
  clientId: string;
  recipient: string;
  siteUrl: string;
  orderId?: string;
  zipAttached: boolean;
}): CrmDemoDeliveryRecord {
  const record: CrmDemoDeliveryRecord = {
    clientId: input.clientId,
    EMAIL_SENT: true,
    emailedAt: new Date().toISOString(),
    recipient: input.recipient,
    siteUrl: input.siteUrl,
    orderId: input.orderId ?? null,
    zipAttached: input.zipAttached,
  };

  const records = readRecords().filter((item) => item.clientId !== input.clientId);
  records.push(record);
  writeRecords(records);

  console.log("[crm-demo] EMAIL_SENT=true", {
    clientId: input.clientId,
    orderId: input.orderId,
    recipient: input.recipient,
    siteUrl: input.siteUrl,
    zipAttached: input.zipAttached,
  });

  return record;
}
