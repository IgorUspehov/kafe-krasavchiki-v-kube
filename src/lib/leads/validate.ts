import type { LeadPayload } from "@/lib/leads/types";

const NAME_MAX = 120;
const PHONE_MAX = 40;
const SERVICE_MAX = 160;
const COMMENT_MAX = 1000;
const PREFERRED_MAX = 80;

export type LeadValidationResult =
  | { ok: true; data: Required<Pick<LeadPayload, "name" | "phone">> & LeadPayload }
  | { ok: false; error: string; status: number };

function clean(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

/** Accept international-ish phones: digits, spaces, +, (), -, min 7 digits. */
export function isReasonablePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  return /^[+]?[\d\s()./-]{7,40}$/.test(phone);
}

export function normalizePhoneKey(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function validateLeadPayload(body: unknown): LeadValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid JSON body", status: 400 };
  }
  const raw = body as Record<string, unknown>;
  const name = clean(raw.name, NAME_MAX);
  const phone = clean(raw.phone, PHONE_MAX);
  const service = clean(raw.service, SERVICE_MAX);
  const comment = clean(raw.comment, COMMENT_MAX);
  const preferredAt = clean(raw.preferredAt ?? raw.preferred_at, PREFERRED_MAX);
  const language = clean(raw.language, 8).toLowerCase();

  if (!name || !phone) {
    return { ok: false, error: "name and phone are required", status: 400 };
  }
  if (!isReasonablePhone(phone)) {
    return { ok: false, error: "invalid phone", status: 400 };
  }

  return {
    ok: true,
    data: {
      name,
      phone,
      service: service || undefined,
      comment: comment || undefined,
      preferredAt: preferredAt || undefined,
      language: language || undefined,
    },
  };
}
