import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "site_admin_client";
export const ADMIN_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export type AdminSession = {
  clientId: string;
  email: string;
  expiresAt: number;
};

function signingKey(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.CRM_LEADS_COOKIE_SECRET?.trim() ||
    process.env.FIREBASE_PRIVATE_KEY?.trim() ||
    process.env.POLAR_WEBHOOK_SECRET?.trim() ||
    "local-dev-admin-session"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function buildAdminSessionValue(session: AdminSession): string {
  const payload = Buffer.from(
    JSON.stringify({
      c: session.clientId,
      e: session.email,
      x: session.expiresAt,
    }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseAdminSessionValue(raw: string | undefined | null): AdminSession | null {
  const value = String(raw || "");
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!payload || mac.length < 32 || !safeEqual(mac, sign(payload))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      c?: unknown;
      e?: unknown;
      x?: unknown;
    };
    const clientId = typeof parsed.c === "string" ? parsed.c.trim() : "";
    const email = typeof parsed.e === "string" ? parsed.e.trim().toLowerCase() : "";
    const expiresAt = typeof parsed.x === "number" ? parsed.x : Number(parsed.x);
    if (!clientId || !email || !Number.isFinite(expiresAt)) return null;
    if (expiresAt <= Date.now()) return null;
    return { clientId, email, expiresAt };
  } catch {
    return null;
  }
}

export function createAdminSession(clientId: string, email: string): AdminSession {
  return {
    clientId: clientId.trim(),
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000,
  };
}

export function adminCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  };
}

export function readAdminSessionFromRequest(request: Request): AdminSession | null {
  const header = request.headers.get("cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${ADMIN_SESSION_COOKIE}=([^;]+)`));
  if (!match?.[1]) return null;
  return parseAdminSessionValue(decodeURIComponent(match[1]));
}
