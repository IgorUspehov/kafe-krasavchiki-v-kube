export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logCloudflareEnvPresence } = await import("@/lib/cloudflare/deploy");
    logCloudflareEnvPresence("startup");
    const { startDeletionScheduler } = await import("@/lib/cloudflare/scheduler");
    const { startStorageScheduler } = await import("@/lib/manifest/storage-manager");
    startDeletionScheduler();
    startStorageScheduler();
  }
}
