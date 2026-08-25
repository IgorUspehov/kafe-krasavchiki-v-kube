import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  parseAdminSessionValue,
  readAdminSessionFromRequest,
  type AdminSession,
} from "@/lib/admin/session";

export class AdminUnauthorizedError extends Error {
  constructor(message = "unauthorized") {
    super(message);
    this.name = "AdminUnauthorizedError";
  }
}

export async function readAdminSessionFromCookies(): Promise<AdminSession | null> {
  const jar = await cookies();
  return parseAdminSessionValue(jar.get(ADMIN_SESSION_COOKIE)?.value);
}

export function requireAdminSession(request: Request): AdminSession {
  const session = readAdminSessionFromRequest(request);
  if (!session) {
    throw new AdminUnauthorizedError();
  }
  return session;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}
