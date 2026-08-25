import { loadAdminManifest } from "@/lib/admin/persist";
import { resolveMvpDistPath } from "@/lib/cloudflare/deploy";
import { resolvePublicAppOrigin } from "@/lib/cloudflare/shared-project";
import { DeployableZipError } from "@/lib/deployable-zip/types";
import {
  cleanupClientDist,
  prepareClientDistWithOgImage,
} from "@/lib/og-image/prepare-client-dist";
import {
  clientDistExists,
  persistClientDistSnapshot,
  resolveClientDistPath,
} from "@/lib/site-delivery/dist-store";

/**
 * Render free tier wipes /tmp — client-dists vanish on every deploy.
 * Rebuild from baked react_mvp dist + Firestore manifest, then persist snapshot.
 */
export async function rebuildClientDistFromTemplate(clientId: string): Promise<string> {
  const id = String(clientId || "").trim();
  if (!id) {
    throw new DeployableZipError("INVALID_CLIENT_ID", "clientId is required");
  }

  const manifest = await loadAdminManifest(id);
  if (!manifest) {
    throw new DeployableZipError(
      "MANIFEST_MISSING",
      `В Firestore отсутствует манифест для clientId=${id}`,
    );
  }

  const templatePath = resolveMvpDistPath();
  const siteUrl = resolvePublicAppOrigin();

  console.info("[deployable-zip] rebuilding client-dists from react_mvp template", {
    clientId: id,
    templatePath,
    businessType: manifest.businessType ?? manifest.business_type ?? null,
  });

  const stagingPath = await prepareClientDistWithOgImage(id, templatePath, manifest, siteUrl);

  try {
    persistClientDistSnapshot(id, stagingPath);
    const distPath = resolveClientDistPath(id);
    console.info("[deployable-zip] client-dists snapshot restored", { clientId: id, distPath });
    return distPath;
  } finally {
    cleanupClientDist(stagingPath);
  }
}

export async function resolveDeployableDistPathWithFallback(
  clientId: string,
  assertDist: (clientId: string, distPath: string) => string,
  distPath?: string,
): Promise<string> {
  if (distPath?.trim()) {
    return assertDist(clientId, distPath.trim());
  }
  if (clientDistExists(clientId)) {
    return assertDist(clientId, resolveClientDistPath(clientId));
  }
  const rebuilt = await rebuildClientDistFromTemplate(clientId);
  return assertDist(clientId, rebuilt);
}
