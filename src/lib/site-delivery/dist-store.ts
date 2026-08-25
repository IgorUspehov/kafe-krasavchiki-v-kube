import fs from "fs";
import path from "path";

import { resolvePersistentDataDir } from "@/lib/site-delivery/data-dir";
import {
  isClientDistProtected,
  listActiveProtectedClientIds,
} from "@/lib/site-delivery/dist-protection";

export function resolveClientDistsRoot(): string {
  return path.join(resolvePersistentDataDir(), "client-dists");
}

export function resolveClientDistPath(clientId: string): string {
  return path.join(resolveClientDistsRoot(), clientId, "dist");
}

export function resolveClientDistClientRoot(clientId: string): string {
  return path.join(resolveClientDistsRoot(), clientId);
}

export function persistClientDistSnapshot(clientId: string, stagingDir: string): string {
  const targetDir = resolveClientDistPath(clientId);
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(stagingDir, targetDir, { recursive: true });
  return targetDir;
}

export function clientDistExists(clientId: string): boolean {
  return fs.existsSync(path.join(resolveClientDistPath(clientId), "index.html"));
}

/**
 * Delete volume snapshot for an unpaid expired demo.
 * Double-checks protection (record + active set) before and immediately before rm.
 */
export function removeClientDistIfUnprotected(clientId: string): boolean {
  const id = String(clientId ?? "").trim();
  if (!id) {
    return false;
  }

  if (isClientDistProtected(id)) {
    console.info("[dist-store] skip client-dist delete — isClientDistProtected", { clientId: id });
    return false;
  }
  if (listActiveProtectedClientIds().has(id)) {
    console.info("[dist-store] skip client-dist delete — listActiveProtectedClientIds", {
      clientId: id,
    });
    return false;
  }

  const clientRoot = resolveClientDistClientRoot(id);
  if (!fs.existsSync(clientRoot)) {
    return false;
  }

  // Second pass immediately before rm
  if (isClientDistProtected(id) || listActiveProtectedClientIds().has(id)) {
    console.info("[dist-store] skip client-dist delete — protected at rm time", { clientId: id });
    return false;
  }

  try {
    fs.rmSync(clientRoot, { recursive: true, force: true });
    console.info("[dist-store] deleted unpaid client-dist", { clientId: id, path: clientRoot });
    return true;
  } catch (error) {
    console.error("[dist-store] failed to delete client-dist", { clientId: id, error });
    return false;
  }
}
