import { createHmac, timingSafeEqual } from "crypto";

import { cookies } from "next/headers";

const COOKIE_NAME = "crm_leads_client";
const MAX_AGE_SEC = 60 * 60 * 12;

function signingKey(): string {
  return (
    process.env.CRM_LEADS_COOKIE_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.POLAR_WEBHOOK_SECRET ||
    "local-dev-crm-leads-cookie"
  );
}

function sign(clientId: string): string {
  return createHmac("sha256", signingKey()).update(clientId).digest("hex");
}

export function buildLeadsSessionValue(clientId: string): string {
  const id = String(clientId || "").trim();
  return `${id}.${sign(id)}`;
}

export function parseLeadsSessionValue(raw: string | undefined | null): string {
  const value = String(raw || "");
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return "";
  const clientId = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!clientId || mac.length < 32) return "";
  const expected = sign(clientId);
  try {
    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return "";
  } catch {
    return "";
  }
  return clientId;
}

export async function setLeadsSessionCookie(clientId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, buildLeadsSessionValue(clientId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function readLeadsSessionClientId(): Promise<string> {
  const jar = await cookies();
  return parseLeadsSessionValue(jar.get(COOKIE_NAME)?.value);
}

export { COOKIE_NAME as LEADS_SESSION_COOKIE };
