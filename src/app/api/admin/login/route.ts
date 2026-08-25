import { NextResponse } from "next/server";

import { hydrateClientManifest, resolveMagicLinkClientId } from "@/lib/admin/lookup";
import { createMagicLink, ADMIN_MAGIC_LINK_FROM } from "@/lib/admin/magic-link";
import { sendResendEmail, waitForResendDeliveryStatus } from "@/lib/email/resend";
import { resolveMagicLinkOrigin } from "@/lib/cloudflare/shared-project";
import { readRootClientManifest } from "@/lib/deployable-zip/buyer-setup";

export const runtime = "nodejs";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pickPackagedClientId(): string {
  const packaged = readRootClientManifest();
  if (!packaged) return "";
  const id = packaged.clientId ?? packaged.client_id;
  return typeof id === "string" ? id.trim() : "";
}

function isDeployableZip(): boolean {
  return process.env.IS_DEPLOYABLE_ZIP === "true";
}

/**
 * Resolve tenant for magic link. Deployable ZIP is single-tenant: trust packaged
 * clientId (or URL hint) when email lookup has no Firestore/manifest match.
 */
async function resolveLoginClientId(email: string, clientIdHint: string): Promise<string | null> {
  const fromLookup = await resolveMagicLinkClientId(email, clientIdHint || undefined);
  if (fromLookup) return fromLookup;

  if (!isDeployableZip()) return null;

  const packagedId = pickPackagedClientId();
  const hint = clientIdHint.trim();
  if (hint && (!packagedId || packagedId === hint)) return hint;
  if (packagedId) return packagedId;
  return null;
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

  const clientId = await resolveLoginClientId(email, clientIdHint);
  console.log("[admin/login] lookup", {
    email,
    clientIdHint: clientIdHint || null,
    clientId: clientId || null,
    deployableZip: isDeployableZip(),
  });

  if (!clientId) {
    // Privacy: do not reveal whether the email exists.
    return NextResponse.json({ ok: true, emailSent: false });
  }

  const { token } = createMagicLink({ clientId, email });
  let origin = resolveMagicLinkOrigin(request);
  if (isDeployableZip()) {
    try {
      origin = new URL(request.url).origin;
    } catch {
      /* keep resolveMagicLinkOrigin */
    }
  }
  const loginUrl = `${origin}/api/admin/callback?token=${encodeURIComponent(token)}`;
  const manifest = (await hydrateClientManifest(clientId)) || readRootClientManifest() || {};
  const businessName = String(manifest.businessName || manifest.business_name || "Website");

  const skipEmail = isDeployableZip();
  let emailSent = false;

  if (!skipEmail) {
    const sendResult = await sendResendEmail({
      to: email,
      from: ADMIN_MAGIC_LINK_FROM,
      subject: "Ihr Admin-Login — Webstudio München",
      text: `Öffnen Sie diesen Link, um Ihre Website zu bearbeiten.\n\n${businessName}\n${loginUrl}\n`,
      html: `<p>Öffnen Sie diesen Link, um Ihre Website zu bearbeiten.</p><p><strong>${escapeHtml(businessName)}</strong><br /><a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>`,
      logPrefix: "[admin/login] resend",
    });

    if (sendResult.ok) {
      emailSent = true;
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
          // Fall through: still return loginUrl so the user can sign in without email.
          emailSent = false;
          console.warn("[admin/login] delivery failed — returning on-screen loginUrl", { lastEvent });
        }
      }
    } else {
      console.error("[admin/login] resend failed — returning on-screen loginUrl", sendResult.error);
    }
  } else {
    console.info("[admin/login] Deployable ZIP — skip Resend, return on-screen loginUrl", { clientId });
  }

  // Never fail the UX when we already minted a valid magic link.
  return NextResponse.json({
    ok: true,
    emailSent,
    loginUrl,
    clientId,
    businessName,
  });
}
