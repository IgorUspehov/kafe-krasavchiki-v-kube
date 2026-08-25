import { NextResponse } from "next/server";

import { readAdminSessionFromRequest } from "@/lib/admin/session";
import {
  listCatalogItems,
  replaceCatalogItems,
} from "@/lib/catalog/firestore-catalog";
import { catalogNamesForLang } from "@/lib/catalog/resolve-catalog";
import { normalizeLeadLang } from "@/lib/leads/niche-mode";
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
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CRM-Secret, X-CRM-Leads-Token",
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

/**
 * Shared catalog for public site + CRM.
 * GET is public (names only) — required for /site form.
 * PUT requires CRM secret / session (mutations from CRM UI).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const { clientId: raw } = await context.params;
  const clientId = decodeURIComponent(raw || "").trim();
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400, headers: CORS });
  }

  const lang = normalizeLeadLang(new URL(request.url).searchParams.get("lang"));

  try {
    await ensureLeadsReadSecret(clientId);
    const items = await listCatalogItems(clientId);
    return NextResponse.json(
      {
        ok: true,
        clientId,
        lang,
        items,
        names: catalogNamesForLang(items, lang),
      },
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
    console.error("[catalog] GET failed", { clientId, message });
    return NextResponse.json(
      { error: message, ok: false },
      { status: 503, headers: CORS },
    );
  }
}

export async function PUT(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400, headers: CORS });
  }

  try {
    const saved = await replaceCatalogItems(clientId, items);
    return NextResponse.json({ ok: true, items: saved }, { headers: CORS });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[catalog] PUT failed", { clientId, message });
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}
