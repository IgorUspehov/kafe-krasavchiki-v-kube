import fs from "fs";
import path from "path";

import { FieldValue } from "firebase-admin/firestore";

import { extractOwnerEmail, readSiteContent } from "@/lib/admin/site-content";
import { CLIENT_MANIFEST_ARTIFACT } from "@/lib/og-image/prepare-client-dist";
import {
  firebaseConfigured,
  readManifestFromFirestore,
} from "@/lib/manifest/firestore-sync";
import { loadClientManifest, saveClientManifest } from "@/lib/manifest/storage";
import { clientDistExists, resolveClientDistPath } from "@/lib/site-delivery/dist-store";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Recover manifest baked into client-dists after Render /tmp manifest wipe. */
function loadManifestFromClientDistArtifact(clientId: string): Record<string, unknown> | null {
  if (!clientDistExists(clientId)) return null;

  const artifactPath = path.join(resolveClientDistPath(clientId), CLIENT_MANIFEST_ARTIFACT);
  if (!fs.existsSync(artifactPath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(artifactPath, "utf8")) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    console.info("[admin] recovered manifest from client-dists artifact", { clientId });
    return parsed;
  } catch (error) {
    console.warn("[admin] failed to read client-dists manifest artifact", {
      clientId,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function cacheRecoveredManifest(clientId: string, manifest: Record<string, unknown>): Record<string, unknown> {
  void saveClientManifest(clientId, manifest).catch((error) => {
    console.warn("[admin] recovered manifest Firestore sync failed", {
      clientId,
      message: error instanceof Error ? error.message : String(error),
    });
  });
  return manifest;
}

/**
 * Admin source of truth: prefer Firestore manifest, then local disk/memory.
 * Keeps local cache in sync so /site and other readers see the same data.
 */
export async function loadAdminManifest(
  clientId: string,
): Promise<Record<string, unknown> | null> {
  const id = String(clientId || "").trim();
  if (!id) return null;

  if (firebaseConfigured()) {
    try {
      const fromFs = await readManifestFromFirestore(id);
      if (fromFs) {
        return cacheRecoveredManifest(id, fromFs);
      }
    } catch (error) {
      console.warn("[admin] Firestore manifest load failed, falling back to disk", {
        clientId: id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const local = loadClientManifest(id);
  if (local) return local;

  const fromDist = loadManifestFromClientDistArtifact(id);
  if (fromDist) {
    return cacheRecoveredManifest(id, fromDist);
  }

  return null;
}

export async function persistClientManifest(
  clientId: string,
  manifest: Record<string, unknown>,
): Promise<void> {
  await saveClientManifest(clientId, manifest);

  const content = readSiteContent(manifest);
  if (!firebaseConfigured()) {
    return;
  }

  try {
    const { getFirestoreDb } = await import("@/lib/firebase/admin");
    await getFirestoreDb()
      .collection("clients")
      .doc(clientId)
      .set(
        {
          name: manifest.ownerName ?? content.businessName,
          businessName: content.businessName,
          email: content.email || extractOwnerEmail(manifest),
          phone: content.phone,
          whatsapp: content.whatsapp,
          city: content.city,
          address: content.address,
          postalCode: content.postalCode,
          manifest,
          adminEditedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  } catch (error) {
    console.error("[admin] Firestore manifest sync failed", {
      clientId,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      error instanceof Error
        ? `Firestore save failed: ${error.message}`
        : "Firestore save failed",
    );
  }
}

export async function requireClientManifest(clientId: string): Promise<Record<string, unknown>> {
  const manifest = await loadAdminManifest(clientId);
  if (!manifest) {
    throw new Error("Manifest not found");
  }
  return manifest;
}
