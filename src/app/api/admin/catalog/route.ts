import { NextResponse } from "next/server";

import { AdminUnauthorizedError, requireAdminSession, unauthorizedResponse } from "@/lib/admin/authorize";
import { listCatalogItems, replaceCatalogItems } from "@/lib/catalog/firestore-catalog";
import { markClientAdminEdited } from "@/lib/site-delivery/dist-protection";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = requireAdminSession(request);
    const items = await listCatalogItems(session.clientId);
    return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load catalog" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = requireAdminSession(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }
    const items = (body as { items?: unknown })?.items;
    if (!Array.isArray(items)) {
      return NextResponse.json({ ok: false, error: "items array required" }, { status: 400 });
    }
    const saved = await replaceCatalogItems(session.clientId, items);
    markClientAdminEdited(session.clientId);
    return NextResponse.json({ ok: true, items: saved });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save catalog" },
      { status: 500 },
    );
  }
}
