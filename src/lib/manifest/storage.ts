import fs from "fs";
import path from "path";

import {
  readManifestFromFirestore,
  writeManifestToFirestore,
} from "@/lib/manifest/firestore-sync";
import { isEnospcError, runStorageCleanup } from "@/lib/manifest/storage-manager";
import { resolveManifestsDir } from "@/lib/manifest/storage-paths";
import {
  cacheClientManifest,
  readCachedClientManifest,
} from "@/lib/runtime-session-store";

export { resolveManifestsDir };

function writeClientManifestFile(clientId: string, manifest: Record<string, unknown>): void {
  const dir = resolveManifestsDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${clientId}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

/**
 * Persist client manifesto: memory → Firestore (durable) → local disk (/tmp on Render).
 * Callers that must survive redeploy should await this (questionnaire, admin save).
 */
export async function saveClientManifest(
  clientId: string,
  manifest: Record<string, unknown>,
): Promise<void> {
  const id = String(clientId || "").trim();
  if (!id) {
    throw new Error("clientId is required to save manifest");
  }

  // Always keep an in-process copy so demos work on ephemeral Render disks.
  cacheClientManifest(id, manifest);

  // Firestore is the durable source of truth — /tmp manifests vanish on every deploy.
  try {
    await writeManifestToFirestore(id, manifest);
    console.log("[manifest-storage] Firestore manifest saved", {
      clientId: id,
      path: `clients/${id}`,
      businessName:
        (typeof manifest.businessName === "string" && manifest.businessName) ||
        (typeof manifest.business_name === "string" && manifest.business_name) ||
        null,
    });
  } catch (error) {
    console.error("[manifest-storage] Firestore manifest write threw", {
      clientId: id,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  runStorageCleanup();

  try {
    writeClientManifestFile(id, manifest);
  } catch (error) {
    if (isEnospcError(error)) {
      console.warn("[manifest-storage] ENOSPC while saving manifest, pruning and retrying once");
      try {
        runStorageCleanup({ aggressive: true, maxManifests: 30, maxClientDists: 8 });
        writeClientManifestFile(id, manifest);
        return;
      } catch (retryError) {
        console.warn("[manifest-storage] disk write failed after prune — using memory + Firestore", {
          clientId: id,
          message: retryError instanceof Error ? retryError.message : String(retryError),
        });
        return;
      }
    }

    console.warn("[manifest-storage] disk write failed — using memory + Firestore", {
      clientId: id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export function loadClientManifest(clientId: string): Record<string, unknown> | null {
  const cached = readCachedClientManifest(clientId);
  if (cached) {
    return cached;
  }

  const filePath = path.join(resolveManifestsDir(), `${clientId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
    cacheClientManifest(clientId, manifest);
    return manifest;
  } catch {
    return null;
  }
}

/**
 * Load manifest: in-process cache → Firestore → local /tmp disk.
 * Use for /site and any path that must survive Render redeploys.
 */
export async function loadClientManifestAsync(
  clientId: string,
): Promise<Record<string, unknown> | null> {
  const id = String(clientId || "").trim();
  if (!id) return null;

  const cached = readCachedClientManifest(id);
  if (cached) return cached;

  const fromFirestore = await readManifestFromFirestore(id);
  if (fromFirestore) {
    cacheClientManifest(id, fromFirestore);
    try {
      writeClientManifestFile(id, fromFirestore);
    } catch {
      // disk optional on ephemeral hosts
    }
    return fromFirestore;
  }

  return loadClientManifest(id);
}

export function buildMvpRedirectUrl(baseUrl: string, clientId: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("clientId", clientId);
  return url.toString();
}
