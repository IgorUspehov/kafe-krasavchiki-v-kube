import path from "path";

import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";

export function resolveManifestsDir(): string {
  return path.join(resolvePersistentDataDir(), "manifests");
}

export function resolvePendingDeletionsPath(): string {
  return path.join(resolvePersistentDataDir(), "pending-deletions.json");
}

export function resolveTempZipsDir(): string {
  return path.join(resolvePersistentDataDir(), "temp-zips");
}

export function resolveTempZipPath(clientId: string): string {
  const safeId = clientId.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(resolveTempZipsDir(), `${safeId || "site"}.zip`);
}
