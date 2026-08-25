export type LeadLang = "en" | "de" | "ru";

export type LeadFormMode = "appointment" | "order" | "reservation" | "inquiry";

export type LeadPayload = {
  name: string;
  phone: string;
  service?: string;
  comment?: string;
  preferredAt?: string;
  language?: string;
};

export type LeadClientRecord = {
  id: string;
  name: string;
  phone: string;
  note: string;
  visits: number;
  source: "site_form";
  status: string;
  createdAt: number;
};

export type LeadBookingRecord = {
  id: string;
  client: string;
  phone: string;
  service: string;
  time: string;
  status: string;
  note: string;
  source: "site_form";
  createdAt: number;
  preferredAt?: string;
};

export type LeadOrderRecord = {
  id: string;
  client: string;
  phone: string;
  item: string;
  status: string;
  note: string;
  source: "site_form";
  createdAt: number;
};
