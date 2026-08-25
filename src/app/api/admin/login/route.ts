import { NextResponse } from "next/server";

import { hydrateClientManifest, resolveMagicLinkClientId } from "@/lib/admin/lookup";
import { createMagicLink, ADMIN_MAGIC_LINK_FROM } from "@/lib/admin/magic-link";
import { buildZipAdminEnterPath } from "@/lib/admin/zip-client-session";
import { sendResendEmail, waitForResendDeliveryStatus } from "@/lib/email/resend";
import { resolveMagicLinkOrigin } from "@/lib/cloudflare/shared-project";
import { isDeployableZipRuntime } from "@/lib/deployable-zip/runtime";
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
  try {
    const packaged = readRootClientManifest();
    if (!packaged) return "";
    const id = packaged.clientId ?? packaged.client_id;
    return typeof id === "string" ? id.trim() : "";
  } catch {
    return "";
  }
}

function resolveRequestOrigin(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return resolveMagicLinkOrigin(request);
  }
}

/**
 * Resolve tenant for magic link. Deployable ZIP is single-tenant: trust packaged
 * clientId (or URL hint) when email lookup has no Firestore/manifest match.
 */
async function resolveLoginClientId(email: string, clientIdHint: string): Promise<string | null> {
  try {
    const fromLookup = await resolveMagicLinkClientId(email, clientIdHint || undefined);
    if (fromLookup) return fromLookup;
  } catch (error) {
    console.warn("[admin/login] lookup failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  if (!isDeployableZipRuntime()) return null;

  const packagedId = pickPackagedClientId();
  const hint = clientIdHint.trim();
  if (hint && (!packagedId || packagedId === hint)) return hint;
  if (packagedId) return packagedId;
  return null;
}

function zipEnterLoginUrl(origin: string, clientId: string): string {
  return `${origin.replace(/\/$/, "")}${buildZipAdminEnterPath(clientId)}`;
}

export async function POST(request: Request) {
  const zip = isDeployableZipRuntime();
  let email = "";
  let clientIdHint = "";

  try {
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

    const origin = resolveRequestOrigin(request);

    // Deployable ZIP: never mint magic links / call Resend / hit bypass — client enters via /admin/enter.
    if (zip) {
      const clientId =
        (await resolveLoginClientId(email, clientIdHint)) ||
        clientIdHint.trim() ||
        pickPackagedClientId();
      if (!clientId) {
        return NextResponse.json({
          ok: true,
          emailSent: false,
          deployableZip: true,
        });
      }
      return NextResponse.json({
        ok: true,
        emailSent: false,
        deployableZip: true,
        loginUrl: zipEnterLoginUrl(origin, clientId),
        clientId,
      });
    }

    const clientId = await resolveLoginClientId(email, clientIdHint);
    console.log("[admin/login] lookup", {
      email,
      clientIdHint: clientIdHint || null,
      clientId: clientId || null,
      deployableZip: false,
    });

    if (!clientId) {
      return NextResponse.json({ ok: true, emailSent: false });
    }

    const { token } = createMagicLink({ clientId, email });
    const loginUrl = `${origin}/api/admin/callback?token=${encodeURIComponent(token)}`;

    let businessName = "Website";
    try {
      const manifest = (await hydrateClientManifest(clientId)) || readRootClientManifest() || {};
      businessName = String(manifest.businessName || manifest.business_name || "Website");
    } catch {
      /* ignore */
    }

    let emailSent = false;
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
          emailSent = false;
          console.warn("[admin/login] delivery failed — returning on-screen loginUrl", { lastEvent });
        }
      }
    } else {
      console.error("[admin/login] resend failed — returning on-screen loginUrl", sendResult.error);
    }

    return NextResponse.json({
      ok: true,
      emailSent,
      loginUrl,
      clientId,
      businessName,
    });
  } catch (error) {
    console.error("[admin/login] unexpected failure", {
      message: error instanceof Error ? error.message : String(error),
      deployableZip: zip,
    });
    // ZIP must never 500 — hand the client an enter URL when possible.
    if (zip) {
      const fallbackId = clientIdHint.trim() || pickPackagedClientId();
      const origin = resolveRequestOrigin(request);
      if (fallbackId) {
        return NextResponse.json({
          ok: true,
          emailSent: false,
          deployableZip: true,
          loginUrl: zipEnterLoginUrl(origin, fallbackId),
          clientId: fallbackId,
        });
      }
      return NextResponse.json({ ok: true, emailSent: false, deployableZip: true });
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 },
    );
  }
}
