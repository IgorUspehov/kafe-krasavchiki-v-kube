import os from "os";
import path from "path";

/**
 * Persistent (or session) data root for manifests, demo-registry, client-dists.
 *
 * Priority:
 * 1. RAILWAY_VOLUME_MOUNT_PATH / explicit volume mount
 * 2. On Render (or USE_TMP_DATA_DIR=1): /tmp/saas-mvp-funnel-data (writable for the process lifetime)
 * 3. ./data under cwd (local dev)
 */
export function resolvePersistentDataDir(): string {
  const volumePath =
    process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim() ||
    process.env.RENDER_DISK_MOUNT_PATH?.trim() ||
    process.env.PERSISTENT_DATA_DIR?.trim();
  if (volumePath) {
    return volumePath;
  }

  const useTmp =
    process.env.USE_TMP_DATA_DIR === "1" ||
    process.env.RENDER === "true" ||
    Boolean(process.env.RENDER_SERVICE_ID?.trim());

  if (useTmp) {
    return path.join(os.tmpdir(), "saas-mvp-funnel-data");
  }

  return path.join(process.cwd(), "data");
}
