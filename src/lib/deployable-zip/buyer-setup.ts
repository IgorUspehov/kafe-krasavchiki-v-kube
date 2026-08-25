import {
  firebaseConfigured,
  readManifestFromFirestore,
} from "@/lib/manifest/firestore-sync";

/** Bundled at build time — Deployable ZIP overwrites root file before buyer `next build`. */
import packagedManifest from "../../../client-manifest.json";

export type BuyerFirebaseSetupState = {
  nicheLabel: string;
  clientId: string;
};

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatNicheLabel(raw: string): string {
  return String(raw || "business")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Root `client-manifest.json` shipped only in the €999 Deployable ZIP. */
export function readRootClientManifest(): Record<string, unknown> | null {
  const parsed = packagedManifest as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  // SaaS stub is `{}` — treat as absent so marketing home stays unchanged.
  if (Object.keys(record).length === 0) {
    return null;
  }
  return record;
}

function resolveNicheLabel(manifest: Record<string, unknown>): string {
  const raw =
    pickString(manifest.businessType) ||
    pickString(manifest.business_type) ||
    pickString(manifest.niche) ||
    "business";
  return formatNicheLabel(raw);
}

function isLiveManifestEmpty(manifest: Record<string, unknown> | null): boolean {
  if (!manifest) return true;
  const keys = Object.keys(manifest);
  if (keys.length === 0) return true;

  const hasIdentity = Boolean(
    pickString(manifest.businessName) ||
      pickString(manifest.business_name) ||
      pickString(manifest.businessType) ||
      pickString(manifest.business_type) ||
      pickString(manifest.niche),
  );
  return !hasIdentity;
}

/**
 * Deployable ZIP buyer deploys set `IS_DEPLOYABLE_ZIP=true`.
 * SaaS production (webstudio-muenchen.com) does not — keep the marketing home there.
 *
 * When the flag is set and Firebase is missing / client not found / live
 * manifest empty, show a neutral setup stub (niche from client-manifest.json)
 * instead of the SaaS marketing landing.
 */
export async function resolveBuyerFirebaseSetup(): Promise<BuyerFirebaseSetupState | null> {
  if (process.env.IS_DEPLOYABLE_ZIP !== "true") {
    return null;
  }

  const packaged = readRootClientManifest();
  const nicheLabel = packaged
    ? resolveNicheLabel(packaged)
    : formatNicheLabel("business");
  const clientId = packaged
    ? pickString(packaged.clientId) || pickString(packaged.client_id)
    : "";

  if (!firebaseConfigured()) {
    return { nicheLabel, clientId };
  }

  if (!clientId) {
    return { nicheLabel, clientId: "" };
  }

  const live = await readManifestFromFirestore(clientId);
  if (isLiveManifestEmpty(live)) {
    return { nicheLabel, clientId };
  }

  return { nicheLabel, clientId };
}
