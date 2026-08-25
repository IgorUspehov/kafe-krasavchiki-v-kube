import { NextResponse } from "next/server";

import { hydrateClientManifest, resolveMagicLinkClientId } from "@/lib/admin/lookup";
import { createMagicLink, ADMIN_MAGIC_LINK_FROM } from "@/lib/admin/magic-link";
import { sendResendEmail, waitForResendDeliveryStatus } from "@/lib/email/resend";
import { resolveMagicLinkOrigin } from "@/lib/cloudflare/shared-project";

export const runtime = "nodejs";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let email = "";
  let clientIdHint = "";
  try {
    const body = (await request.json()) as { email?: unknown; clientId?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    clientIdHint = typeof body.clientId === "string" ? body.clientId.trim() : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }

  const clientId = await resolveMagicLinkClientId(email, clientIdHint);
  console.log("[admin/login] lookup", {
    email,
    clientIdHint: clientIdHint || null,
    clientId: clientId || null,
  });

  if (!clientId) {
    const payload: Record<string, unknown> = { ok: true };
    if (process.env.NODE_ENV !== "production") {
      payload.devLinks = [];
    }
    return NextResponse.json(payload);
  }

  const { token } = createMagicLink({ clientId, email });
  const origin = resolveMagicLinkOrigin(request);
  const url = `${origin}/api/admin/callback?token=${encodeURIComponent(token)}`;
  const manifest = (await hydrateClientManifest(clientId)) || {};
  const businessName = String(manifest.businessName || manifest.business_name || "Website");

  const sendResult = await sendResendEmail({
    to: email,
    from: ADMIN_MAGIC_LINK_FROM,
    subject: "Ihr Admin-Login — Webstudio München",
    text: `Öffnen Sie diesen Link, um Ihre Website zu bearbeiten. Er läuft in 30 Minuten ab und kann nur einmal verwendet werden.\n\n${businessName}\n${url}\n`,
    html: `<p>Öffnen Sie diesen Link, um Ihre Website zu bearbeiten. Er läuft in 30 Minuten ab und kann nur einmal verwendet werden.</p><p><strong>${escapeHtml(businessName)}</strong><br /><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`,
    logPrefix: "[admin/login] resend",
  });
  if (!sendResult.ok) {
    console.error("[admin/login] resend failed", sendResult.error);
    return NextResponse.json(
      { ok: false, error: sendResult.errorMessage || sendResult.error || "E-Mail konnte nicht gesendet werden." },
      { status: 502 },
    );
  }
  if (sendResult.emailId) {
    const delivery = await waitForResendDeliveryStatus(sendResult.emailId, {
      attempts: 3,
      delayMs: 1500,
      logPrefix: "[admin/login] resend",
    });
    const lastEvent = (delivery.lastEvent || "").toLowerCase();
    console.log("[admin/login] delivery", {
      emailId: sendResult.emailId,
      lastEvent: lastEvent || null,
      recipient: delivery.recipient ?? email,
      clientId,
    });
    if (lastEvent === "bounced" || lastEvent === "failed" || lastEvent === "suppressed") {
      return NextResponse.json(
        { ok: false, error: `E-Mail wurde nicht zugestellt (${lastEvent}).` },
        { status: 502 },
      );
    }
  }

  const payload: Record<string, unknown> = { ok: true };
  if (process.env.NODE_ENV !== "production") {
    payload.devLinks = [{ clientId, url, businessName }];
  }
  return NextResponse.json(payload);
}
