import { NextResponse } from "next/server";

import { findDemoByClientId } from "@/lib/cloudflare/demo-registry";
import { findPendingByClientId } from "@/lib/cloudflare/scheduler";
import { listJobApplications } from "@/lib/jobs/store";
import { verifyLeadsReadSecret } from "@/lib/leads/read-secret";
import { listSiteLeads } from "@/lib/leads/store";
import { loadClientManifest } from "@/lib/manifest/storage";

export const runtime = "nodejs";

/** CRM SPA may call from Cloudflare Pages origin. */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-crm-leads-token",
  "Cache-Control": "no-store",
};

/**
 * Protected CRM sync — requires per-client leadsReadSecret header.
 * Secret stays server-side (manifest on disk); never bake into HTML/JS.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const { clientId: raw } = await context.params;
  const clientId = decodeURIComponent(raw || "").trim();

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400, headers: CORS_HEADERS });
  }

  const exists =
    Boolean(loadClientManifest(clientId)) ||
    Boolean(findDemoByClientId(clientId)) ||
    Boolean(findPendingByClientId(clientId));
  if (!exists) {
    return NextResponse.json({ error: "clientId not found" }, { status: 404, headers: CORS_HEADERS });
  }

  const token =
    request.headers.get("x-crm-leads-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!verifyLeadsReadSecret(clientId, token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  try {
    const [leads, jobApplications] = await Promise.all([
      listSiteLeads(clientId),
      listJobApplications(clientId),
    ]);
    return NextResponse.json(
      {
        clientId,
        clients: leads.clients,
        appointments: leads.appointments,
        orders: leads.orders,
        jobApplications,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list leads";
    console.error("[crm/leads] GET failed", { clientId, message });
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
