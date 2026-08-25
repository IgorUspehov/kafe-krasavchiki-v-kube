import { NextResponse } from "next/server";

import { AdminUnauthorizedError, requireAdminSession, unauthorizedResponse } from "@/lib/admin/authorize";
import { loadClientManifest } from "@/lib/manifest/storage";
import { resolveZipUnlock } from "@/lib/mvp-pro/zip-access";
import { resolveOwnerIntegrations } from "@/lib/owner/integrations";
import {
  POLAR_CHECKOUT_DEPLOYABLE_ZIP,
  isFactoryOwnedCrmFullCheckout,
} from "@/lib/polar/constants";
import { clientDistExists } from "@/lib/site-delivery/dist-store";

export const runtime = "nodejs";

function pickEmail(manifest: Record<string, unknown> | null): string {
  const raw = manifest?.email ?? manifest?.contactEmail ?? manifest?.ownerEmail;
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * Integrations status for the authenticated admin session's clientId.
 * Exposes whether Deployable ZIP (€999) is unlocked (Firestore zip_unlocked / entitlement).
 */
export async function GET(request: Request) {
  try {
    const session = requireAdminSession(request);
    const clientId = session.clientId;
    const zipAccess = await resolveZipUnlock(clientId);
    const manifest = loadClientManifest(clientId);
    const integrations = resolveOwnerIntegrations().map((item) => {
      if (item.id !== "zip") return item;
      if (zipAccess.allowed) {
        return {
          ...item,
          status: "ready" as const,
          actionable: true,
          note:
            zipAccess.reason === "bypass"
              ? "Owner bypass (DEPLOYABLE_ZIP_OWNER_BYPASS=1)"
              : zipAccess.reason === "deployable_zip"
                ? "Full license — Deployable ZIP runtime"
                : "Unlocked after €999 Deployable ZIP payment",
        };
      }
      return {
        ...item,
        status: "not_configured" as const,
        actionable: true,
        note: "Pay €999 once to unlock Deployable ZIP download",
      };
    });

    return NextResponse.json({
      ok: true,
      clientId,
      distReady: clientDistExists(clientId),
      zipUnlocked: zipAccess.allowed,
      zipUnlockReason: zipAccess.reason,
      email: pickEmail(manifest),
      // Ready only when Render has a SaaS checkout path (API token or non-Factory link).
      checkoutConfigured: Boolean(
        process.env.POLAR_ACCESS_TOKEN?.trim() ||
          (POLAR_CHECKOUT_DEPLOYABLE_ZIP &&
            !isFactoryOwnedCrmFullCheckout(POLAR_CHECKOUT_DEPLOYABLE_ZIP)),
      ),
      integrations,
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return unauthorizedResponse();
    const message = error instanceof Error ? error.message : "Failed to load integrations";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
