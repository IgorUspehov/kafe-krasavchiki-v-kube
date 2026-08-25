/**
 * Process-lifetime in-memory store for demo manifests + registry.
 * Survives ephemeral/read-only disk failures within a single Render/Node session.
 */

type DemoRegistryEntry = {
  slug: string;
  clientId: string;
  deploymentId: string;
  deploymentUrl: string;
  projectName: string;
  deployedAt: string;
  deleteAt: string;
  paid?: boolean;
};

type SessionStore = {
  manifests: Map<string, Record<string, unknown>>;
  demoRegistry: DemoRegistryEntry[] | null;
};

const GLOBAL_KEY = "__saas_mvp_session_store__";

function getStore(): SessionStore {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: SessionStore };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      manifests: new Map(),
      demoRegistry: null,
    };
  }
  return g[GLOBAL_KEY];
}

export function cacheClientManifest(
  clientId: string,
  manifest: Record<string, unknown>,
): void {
  const id = String(clientId ?? "").trim();
  if (!id) return;
  getStore().manifests.set(id, structuredClone(manifest));
}

export function readCachedClientManifest(
  clientId: string,
): Record<string, unknown> | null {
  const id = String(clientId ?? "").trim();
  if (!id) return null;
  const cached = getStore().manifests.get(id);
  return cached ? structuredClone(cached) : null;
}

export function dropCachedClientManifest(clientId: string): void {
  const id = String(clientId ?? "").trim();
  if (!id) return;
  getStore().manifests.delete(id);
}

export function readCachedDemoRegistry(): DemoRegistryEntry[] | null {
  const cached = getStore().demoRegistry;
  return cached ? structuredClone(cached) : null;
}

export function writeCachedDemoRegistry(entries: DemoRegistryEntry[]): void {
  getStore().demoRegistry = structuredClone(entries);
}
