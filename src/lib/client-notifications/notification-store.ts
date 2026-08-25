import fs from "fs";
import path from "path";

export type NotificationEvent =
  | "MVP_READY"
  | "DOWNLOAD_REMINDER"
  | "DOWNLOAD_CONFIRMED"
  | "FILES_DELETED";

export type NotificationRecord = {
  notification_id: string;
  order_id: string;
  event: NotificationEvent;
  language: string;
  business_name: string;
  email: string;
  message: string;
  created_at: string;
  status: "GENERATED";
};

const NOTIFICATION_LOG_PATH = path.join(
  process.cwd(),
  "artifacts/factory_output/client_notifications/notification_log.json",
);
const TEMPLATES_DIR = path.join(process.cwd(), "config/client_notification_templates");
const ORDERS_PATH = path.join(process.cwd(), "artifacts/factory_output/client_orders/orders.json");
const CLEANUP_CONFIG_PATH = path.join(process.cwd(), "config/client_cleanup_config.json");
const PACKAGE_PATHS = [
  "output/client_delivery/final_package.zip",
  "output/final_package.zip",
];

const METADATA_FIELDS = [
  "notification_id",
  "order_id",
  "event",
  "language",
  "business_name",
  "email",
  "message",
  "created_at",
  "status",
] as const;

const REMINDER_HOURS_BEFORE_CLEANUP = 12;

function ensureNotificationLog() {
  fs.mkdirSync(path.dirname(NOTIFICATION_LOG_PATH), { recursive: true });
  if (!fs.existsSync(NOTIFICATION_LOG_PATH)) {
    fs.writeFileSync(NOTIFICATION_LOG_PATH, "[]\n", "utf8");
  }
}

function readOrders(): Array<Record<string, unknown>> {
  if (!fs.existsSync(ORDERS_PATH)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(ORDERS_PATH, "utf8")) as unknown;
    return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

function readLatestOrder(): Record<string, unknown> {
  const orders = readOrders();
  return orders[0] ?? {};
}

function loadTemplate(language: string, event: NotificationEvent): string {
  const locale = ["en", "de", "ru"].includes(language) ? language : "en";
  const templatePath = path.join(TEMPLATES_DIR, `${locale}.json`);
  if (fs.existsSync(templatePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(templatePath, "utf8")) as Record<string, string>;
      if (data[event]) {
        return data[event];
      }
    } catch {
      // fall through
    }
  }
  return event;
}

export function readNotifications(): NotificationRecord[] {
  ensureNotificationLog();
  try {
    const data = JSON.parse(fs.readFileSync(NOTIFICATION_LOG_PATH, "utf8")) as unknown;
    return Array.isArray(data) ? (data as NotificationRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeNotifications(notifications: NotificationRecord[]) {
  ensureNotificationLog();
  const sanitized = notifications.map((item) => {
    const record: Record<string, unknown> = {};
    for (const field of METADATA_FIELDS) {
      record[field] = item[field as keyof NotificationRecord];
    }
    return record as NotificationRecord;
  });
  fs.writeFileSync(NOTIFICATION_LOG_PATH, `${JSON.stringify(sanitized, null, 2)}\n`, "utf8");
}

export function nextNotificationId(notifications: NotificationRecord[]): string {
  const maxNumber = notifications.reduce((max, item) => {
    const match = item.notification_id.match(/^NOT-(\d+)$/);
    if (!match) {
      return max;
    }
    return Math.max(max, Number.parseInt(match[1], 10));
  }, 0);
  return `NOT-${String(maxNumber + 1).padStart(6, "0")}`;
}

function hasNotification(
  notifications: NotificationRecord[],
  orderId: string,
  event: NotificationEvent,
): boolean {
  return notifications.some((item) => item.order_id === orderId && item.event === event);
}

export function appendNotification(options: {
  event: NotificationEvent;
  order_id?: string;
  business_name?: string;
  email?: string;
  language?: string;
}): NotificationRecord {
  const order = readLatestOrder();
  const orderId = options.order_id ?? String(order.order_id ?? "UNKNOWN");
  const businessName =
    (options.business_name ?? String(order.business_name ?? "Unknown Business").trim()) || "Unknown Business";
  const email =
    (options.email ?? String(order.email ?? "unknown@example.com").trim()) || "unknown@example.com";
  const language = (options.language ?? String(order.language ?? "en")).toLowerCase();
  const locale = ["en", "de", "ru"].includes(language) ? language : "en";
  const notifications = readNotifications();

  const existing = notifications.find((item) => item.order_id === orderId && item.event === options.event);
  if (existing) {
    return existing;
  }

  const record: NotificationRecord = {
    notification_id: nextNotificationId(notifications),
    order_id: orderId,
    event: options.event,
    language: locale,
    business_name: businessName,
    email,
    message: loadTemplate(locale, options.event),
    created_at: new Date().toISOString(),
    status: "GENERATED",
  };
  writeNotifications([record, ...notifications]);
  return record;
}

function readRetentionHours(): number {
  if (!fs.existsSync(CLEANUP_CONFIG_PATH)) {
    return 48;
  }
  try {
    const config = JSON.parse(fs.readFileSync(CLEANUP_CONFIG_PATH, "utf8")) as { retention_hours?: number };
    return Number(config.retention_hours ?? 48) || 48;
  } catch {
    return 48;
  }
}

function earliestPackageExpiryMs(): number | null {
  const retentionHours = readRetentionHours();
  let earliest: number | null = null;
  for (const rel of PACKAGE_PATHS) {
    const fullPath = path.join(process.cwd(), rel);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    const mtime = fs.statSync(fullPath).mtimeMs;
    const expiry = mtime + retentionHours * 60 * 60 * 1000;
    if (earliest === null || expiry < earliest) {
      earliest = expiry;
    }
  }
  return earliest;
}

export function checkDownloadReminders(): NotificationRecord[] {
  const expiryMs = earliestPackageExpiryMs();
  if (expiryMs === null) {
    return [];
  }
  const hoursUntilExpiry = (expiryMs - Date.now()) / (60 * 60 * 1000);
  if (hoursUntilExpiry <= 0 || hoursUntilExpiry > REMINDER_HOURS_BEFORE_CLEANUP) {
    return [];
  }
  const order = readLatestOrder();
  const orderId = String(order.order_id ?? "UNKNOWN");
  const notifications = readNotifications();
  if (hasNotification(notifications, orderId, "DOWNLOAD_REMINDER")) {
    return [];
  }
  return [appendNotification({ event: "DOWNLOAD_REMINDER", order_id: orderId })];
}
