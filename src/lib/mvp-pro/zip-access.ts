import { isClientZipUnlockedInStore } from "@/lib/billing/paid-tenant";
import { loadMvpProEntitlement } from "@/lib/mvp-pro/entitlement-store";

export type ZipUnlockReason = "bypass" | "entitlement" | "firestore" | "payment_required";

/**
 * Who may download Deployable ZIP:
 * - env DEPLOYABLE_ZIP_OWNER_BYPASS=1 (operator testing)
 * - local MVP Pro / Deployable ZIP entitlement for this clientId
 * - Firestore clients/{clientId}.zip_unlocked === true (Polar webhook)
 */
export function canDownloadDeployableZip(clientId: string): {
  allowed: boolean;
  reason: ZipUnlockReason;
} {
  if (process.env.DEPLOYABLE_ZIP_OWNER_BYPASS?.trim() === "1") {
    return { allowed: true, reason: "bypass" };
  }
  const entitlement = loadMvpProEntitlement(clientId);
  if (entitlement?.downloadToken) {
    return { allowed: true, reason: "entitlement" };
  }
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
