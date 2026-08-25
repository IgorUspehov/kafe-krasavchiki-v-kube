import { isClientZipUnlockedInStore } from "@/lib/billing/paid-tenant";
import { isDeployableZipRuntime } from "@/lib/deployable-zip/runtime";
import { loadMvpProEntitlement } from "@/lib/mvp-pro/entitlement-store";

export type ZipUnlockReason =
  | "bypass"
  | "deployable_zip"
  | "entitlement"
  | "firestore"
  | "payment_required";

/**
 * Who may download Deployable ZIP (€999 Polar entitlement):
 * - env DEPLOYABLE_ZIP_OWNER_BYPASS=1 (operator testing only)
 * - runtime IS_DEPLOYABLE_ZIP=true (buyer already hosts the paid ZIP package)
 * - local MVP Pro / Deployable ZIP entitlement for this clientId (Polar)
 * - Firestore clients/{clientId}.zip_unlocked === true (Polar webhook)
 *
 * Never free-unlock on SaaS without Polar entitlement / Firestore flag.
 */
export function canDownloadDeployableZip(clientId: string): {
  allowed: boolean;
  reason: ZipUnlockReason;
} {
  if (process.env.DEPLOYABLE_ZIP_OWNER_BYPASS?.trim() === "1") {
    return { allowed: true, reason: "bypass" };
  }
  // Self-hosted Deployable ZIP package — product already purchased; not a Polar bypass on SaaS.
  if (isDeployableZipRuntime()) {
    return { allowed: true, reason: "deployable_zip" };
  }
  const entitlement = loadMvpProEntitlement(clientId);
  if (entitlement?.downloadToken) {
    return { allowed: true, reason: "entitlement" };
  }
  // Fail closed — require Polar entitlement or Firestore zip_unlocked.
  return { allowed: false, reason: "payment_required" };
}

export async function resolveZipUnlock(clientId: string): Promise<{
  allowed: boolean;
  reason: ZipUnlockReason;
}> {
  const sync = canDownloadDeployableZip(clientId);
  if (sync.allowed) return sync;

  if (await isClientZipUnlockedInStore(clientId)) {
    return { allowed: true, reason: "firestore" };
  }

  return { allowed: false, reason: "payment_required" };
}
