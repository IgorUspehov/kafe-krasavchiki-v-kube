import { isIP } from "net";

import { NextResponse } from "next/server";

import { findDemoByClientId } from "@/lib/cloudflare/demo-registry";
import { findPendingByClientId } from "@/lib/cloudflare/scheduler";
import { resolveLeadFormMode } from "@/lib/leads/niche-mode";
import { notifyNewLead } from "@/lib/leads/notify-site-lead";
import { assertLeadRateLimit } from "@/lib/leads/rate-limit";
import { ensureLeadsReadSecret, ManifestNotFoundError } from "@/lib/leads/read-secret";
import { withRetries } from "@/lib/leads/retry";
import { createSiteLead } from "@/lib/leads/store";
import { validateLeadPayload } from "@/lib/leads/validate";
import { loadClientManifest } from "@/lib/manifest/storage";
import { DEFAULT_BUSINESS_TYPE } from "@/lib/sector-mapping";

export const runtime = "nodejs";

/** Public form endpoint — POST only. No lead listing. */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function clientIdExists(clientId: string): boolean {
  if (loadClientManifest(clientId)) return true;
  if (findDemoByClientId(clientId)) return true;
  if (findPendingByClientId(clientId)) return true;
  return false;
}

function resolveBusinessMeta(clientId: string): {
  businessType: string;
  businessName: string;
  language: string;
  sectorId: string | null;
} {
  const manifest = loadClientManifest(clientId) || {};
  const businessType = String(
    manifest.businessType ?? manifest.business_type ?? DEFAULT_BUSINESS_TYPE,
  );
  const businessName = String(
    manifest.businessName ?? manifest.business_name ?? "Business",
  );
  const language = String(manifest.language ?? manifest.lang ?? "de");
  const sectorRaw = manifest.sectorId ?? manifest.sector_id;
  const sectorId =
    typeof sectorRaw === "string" && sectorRaw.trim() ? sectorRaw.trim() : null;
  return { businessType, businessName, language, sectorId };
}

/**
 * Client IP behind Railway: prefer platform x-real-ip; otherwise the
 * rightmost X-Forwarded-For hop (appended by the trusted proxy), never
 * the leftmost spoofable value alone when a chain is present.
 */
function readClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && isIP(realIp)) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part && isIP(part));
    if (parts.length === 1) return parts[0]!;
    if (parts.length > 1) return parts[parts.length - 1]!;
  }

  return "unknown";
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed" },
    { status: 405, headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" } },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const { clientId: raw } = await context.params;
  const clientId = decodeURIComponent(raw || "").trim();

  if (!clientId) {
    return NextResponse.json(
      { error: "clientId required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (!clientIdExists(clientId)) {
    return NextResponse.json(
      { error: "clientId not found" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const validated = validateLeadPayload(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error },
      { status: validated.status, headers: CORS_HEADERS },
    );
  }

  const ip = readClientIp(request);
  try {
    const limited = await assertLeadRateLimit({ clientId, ip });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "rate_limit_exceeded", retryAfterSec: limited.retryAfterSec },
        {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            "Retry-After": String(limited.retryAfterSec),
          },
        },
      );
    }
  } catch (error) {
    console.error("[leads] rate limit error", error);
    return NextResponse.json(
      { error: "rate limit unavailable" },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  const meta = resolveBusinessMeta(clientId);
  const mode = resolveLeadFormMode(meta.businessType, meta.sectorId);
  const payload = {
    ...validated.data,
    language: validated.data.language || meta.language,
  };

  try {
    // Ensure CRM sync secret exists for this tenant (not returned publicly).
    await ensureLeadsReadSecret(clientId);

    const result = await withRetries(
      async (attempt) => {
        try {
          return await createSiteLead({
            clientId,
            businessType: meta.businessType,
            payload,
            mode,
          });
        } catch (error) {
          console.warn("[leads] createSiteLead attempt failed", {
            clientId,
            attempt,
            message: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      },
      {
        attempts: 3,
        baseDelayMs: 250,
        maxDelayMs: 1_500,
      },
    );

    // Notify is best-effort — a lead already persisted must not become a false failure
    // (that would trigger client retries and duplicate bookings).
    try {
      await notifyNewLead({
        clientId,
        businessName: meta.businessName,
        businessType: meta.businessType,
        name: payload.name,
        phone: payload.phone,
        service: payload.service,
        mode,
        bookingId: result.booking?.id,
        orderId: result.order?.id,
      });
    } catch (notifyError) {
      console.error("[leads] notify failed after successful write", {
        clientId,
        message: notifyError instanceof Error ? notifyError.message : String(notifyError),
      });
    }

    // Public response: no names, phones, or record payloads.
    return NextResponse.json(
      {
        ok: true,
        mode,
      },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    if (error instanceof ManifestNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404, headers: CORS_HEADERS },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create lead";
    console.error("[leads] POST failed after retries", { clientId, message });
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
