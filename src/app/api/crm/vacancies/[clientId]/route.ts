import { NextResponse } from "next/server";

import { readAdminSessionFromRequest } from "@/lib/admin/session";
import {
  createVacancy,
  deleteVacancy,
  listVacancies,
} from "@/lib/vacancies/store";
import {
  ensureLeadsReadSecret,
  ManifestNotFoundError,
  verifyLeadsReadSecret,
} from "@/lib/leads/read-secret";
import {
  LEADS_SESSION_COOKIE,
  parseLeadsSessionValue,
} from "@/lib/leads/session-cookie";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-CRM-Secret, X-CRM-Leads-Token",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function authorize(request: Request, clientId: string): boolean {
  const header =
    request.headers.get("x-crm-secret") ||
    request.headers.get("x-crm-leads-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  if (header && verifyLeadsReadSecret(clientId, header)) return true;

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${LEADS_SESSION_COOKIE}=([^;]+)`),
  );
  if (match?.[1]) {
    const sessionClientId = parseLeadsSessionValue(decodeURIComponent(match[1]));
    return sessionClientId === clientId;
  }
  const admin = readAdminSessionFromRequest(request);
  return admin?.clientId === clientId;
}

/** Public list for /site; mutations require CRM secret / session. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const { clientId: raw } = await context.params;
  const clientId = decodeURIComponent(raw || "").trim();
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400, headers: CORS });
  }

  try {
    await ensureLeadsReadSecret(clientId);
    const items = await listVacancies(clientId);
    return NextResponse.json(
      { ok: true, clientId, items },
      { headers: { ...CORS, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ManifestNotFoundError) {
      return NextResponse.json(
        { error: error.message, ok: false },
        { status: 404, headers: CORS },
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("[vacancies] GET failed", { clientId, message });
    return NextResponse.json(
      { error: message, ok: false },
      { status: 503, headers: CORS },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const { clientId: raw } = await context.params;
  const clientId = decodeURIComponent(raw || "").trim();
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400, headers: CORS });
  }

  if (!authorize(request, clientId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: CORS });
  }

  let body: {
    title?: unknown;
    description?: unknown;
    salary?: unknown;
    requirements?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const salary = typeof body.salary === "string" ? body.salary.trim() : "";
  const requirements =
    typeof body.requirements === "string" ? body.requirements.trim() : "";

  if (!title) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400, headers: CORS },
    );
  }

  try {
    const item = await createVacancy(clientId, {
      title,
      ...(description ? { description } : {}),
      ...(salary ? { salary } : {}),
      ...(requirements ? { requirements } : {}),
    });
    return NextResponse.json({ ok: true, item }, { status: 201, headers: CORS });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[vacancies] POST failed", { clientId, message });
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const { clientId: raw } = await context.params;
  const clientId = decodeURIComponent(raw || "").trim();
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400, headers: CORS });
  }

  if (!authorize(request, clientId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: CORS });
  }

  let vacancyId = "";
  try {
    const body = (await request.json()) as { id?: unknown };
    vacancyId = typeof body.id === "string" ? body.id.trim() : "";
  } catch {
    const url = new URL(request.url);
    vacancyId = (url.searchParams.get("id") || "").trim();
  }

  if (!vacancyId) {
    return NextResponse.json({ error: "id required" }, { status: 400, headers: CORS });
  }

  try {
    await deleteVacancy(clientId, vacancyId);
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[vacancies] DELETE failed", { clientId, vacancyId, message });
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}
