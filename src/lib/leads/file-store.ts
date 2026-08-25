import fs from "fs";
import path from "path";

import type {
  LeadBookingRecord,
  LeadClientRecord,
  LeadFormMode,
  LeadOrderRecord,
  LeadPayload,
} from "@/lib/leads/types";
import { leadStatusLabel, normalizeLeadLang } from "@/lib/leads/niche-mode";
import { normalizePhoneKey } from "@/lib/leads/validate";
import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";

type LeadStore = {
  clients: LeadClientRecord[];
  appointments: (LeadBookingRecord & { kind?: string })[];
  orders: LeadOrderRecord[];
};

function storePath(clientId: string): string {
  return path.join(resolvePersistentDataDir(), "leads", `${clientId}.json`);
}

function readStore(clientId: string): LeadStore {
  const filePath = storePath(clientId);
  if (!fs.existsSync(filePath)) {
    return { clients: [], appointments: [], orders: [] };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as LeadStore;
    return {
      clients: Array.isArray(raw.clients) ? raw.clients : [],
      appointments: Array.isArray(raw.appointments) ? raw.appointments : [],
      orders: Array.isArray(raw.orders) ? raw.orders : [],
    };
  } catch {
    return { clients: [], appointments: [], orders: [] };
  }
}

function writeStore(clientId: string, store: LeadStore): void {
  const filePath = storePath(clientId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `${JSON.stringify({ ...store, updatedAt: new Date().toISOString() }, null, 2)}\n`,
    "utf8",
  );
}

function newRecId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `rec-${prefix}-${Date.now()}-${rand}`;
}

export function createFileSiteLead(input: {
  clientId: string;
  businessType: string;
  payload: LeadPayload;
  mode: LeadFormMode;
}): {
  client: LeadClientRecord;
  booking?: LeadBookingRecord;
  order?: LeadOrderRecord;
  createdClient: boolean;
} {
  const language = normalizeLeadLang(input.payload.language);
  const status = leadStatusLabel(language);
  const phoneKey = normalizePhoneKey(input.payload.phone);
  const store = readStore(input.clientId);

  let client = store.clients.find(
    (c) => normalizePhoneKey(c.phone) === phoneKey,
  );
  let createdClient = false;
  if (!client) {
    client = {
      id: newRecId("cli"),
      name: input.payload.name,
      phone: input.payload.phone,
      note: status,
      visits: 0,
      source: "site_form",
      status,
      createdAt: Date.now(),
    };
    store.clients.unshift(client);
    createdClient = true;
  }

  const service =
    input.payload.service?.trim() ||
    (language === "ru" ? "Заявка с сайта" : language === "de" ? "Website-Anfrage" : "Website request");
  const note = input.payload.comment?.trim() || status;
  const timeLabel =
    input.payload.preferredAt?.trim() ||
    new Date().toLocaleString(language === "de" ? "de-DE" : language === "ru" ? "ru-RU" : "en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    });

  if (input.mode === "order") {
    const id = newRecId("ord");
    const order: LeadOrderRecord = {
      id,
      client: client.name,
      phone: client.phone,
      item: service,
      status,
      note,
      source: "site_form",
      createdAt: Date.now(),
    };
    const booking: LeadBookingRecord & { kind?: string } = {
      id,
      client: client.name,
      phone: client.phone,
      service,
      time: timeLabel,
      status,
      note,
      source: "site_form",
      createdAt: order.createdAt,
      kind: "order",
    };
    store.orders.unshift(order);
    store.appointments.unshift(booking);
    writeStore(input.clientId, store);
    return { client, order, booking, createdClient };
  }

  const id = newRecId(input.mode === "reservation" ? "rsv" : "apt");
  const booking: LeadBookingRecord & { kind?: string } = {
    id,
    client: client.name,
    phone: client.phone,
    service,
    time: timeLabel,
    status,
    note,
    source: "site_form",
    createdAt: Date.now(),
    kind:
      input.mode === "reservation"
        ? "reservation"
        : input.mode === "inquiry"
          ? "inquiry"
          : "appointment",
  };
  if (input.payload.preferredAt) {
    booking.preferredAt = input.payload.preferredAt;
  }
  store.appointments.unshift(booking);
  writeStore(input.clientId, store);
  return { client, booking, createdClient };
}

export function listFileSiteLeads(clientId: string): {
  clients: LeadClientRecord[];
  appointments: LeadBookingRecord[];
  orders: LeadOrderRecord[];
} {
  const store = readStore(clientId);
  return {
    clients: store.clients,
    appointments: store.appointments,
    orders: store.orders,
  };
}
