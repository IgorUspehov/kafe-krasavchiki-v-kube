import fs from "fs";
import path from "path";

import {
  clientDistExists,
  resolveClientDistPath as resolveVolumeClientDistPath,
} from "@/lib/site-delivery/dist-store";

/**
 * Prefer personalized volume snapshot. Do not fall back to the shared MVP shell —
 * that would ship a non-personalized package under a client filename.
 */
export function resolveClientDistPath(clientId: string): string {
  const volumeDist = resolveVolumeClientDistPath(clientId);
  if (clientDistExists(clientId)) {
    return volumeDist;
  }

  const legacyArtifacts = path.join(process.cwd(), "artifacts", clientId, "dist");
  if (fs.existsSync(path.join(legacyArtifacts, "index.html"))) {
    return legacyArtifacts;
  }

  throw new Error(`DIST_MISSING: no client-dists snapshot for clientId=${clientId}`);
}

/** @deprecated Prefer client-dists snapshots created at questionnaire time. */
export function snapshotClientDist(clientId: string): string {
  if (clientDistExists(clientId)) {
    return resolveVolumeClientDistPath(clientId);
  }
  throw new Error(`DIST_MISSING: cannot snapshot — no client-dists for clientId=${clientId}`);
}
