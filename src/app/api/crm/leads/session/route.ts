import { NextResponse } from "next/server";

import { findDemoByShortId, findDemoBySlug } from "@/lib/cloudflare/demo-registry";
import { listJobApplications } from "@/lib/jobs/store";
import {
  readLeadsSessionClientId,
  setLeadsSessionCookie,
} from "@/lib/leads/session-cookie";
import { listSiteLeads } from "@/lib/leads/store";

export const runtime = "nodejs";

/**
 * Bind httpOnly session after proving demo slug/shortId → clientId mapping.
 * Never returns leadsReadSecret.
 */
export async function POST(request: Request) {
  let body: { clientId?: string; slug?: string; shortId?: string };
  try {
    body = (await request.json()) as { clientId?: string; slug?: string; shortId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clientId = String(body.clientId || "").trim();
  const slug = String(body.slug || "").trim();
  const shortId = String(body.shortId || "").trim();
  if (!clientId || (!slug && !shortId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const matched = slug ? findDemoBySlug(slug) : findDemoByShortId(shortId);
  if (!matched || matched.clientId !== clientId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await setLeadsSessionCookie(clientId);
  return NextResponse.json({ ok: true });
}

/** Leads for the httpOnly session client only. */
export async function GET() {
  const clientId = await readLeadsSessionClientId();
  if (!clientId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
