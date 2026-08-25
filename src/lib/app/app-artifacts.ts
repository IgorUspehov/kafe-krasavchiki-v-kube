import type { AppArtifactsSnapshot, AppManifest, AppReport } from "@/lib/app/types";

export const APP_ARTIFACT_BASE = "/artifacts/factory_output/app";
export const APP_MODULE_BASE = "/artifacts/app";

export async function fetchAppArtifactsSnapshot(): Promise<AppArtifactsSnapshot> {
  const [manifestRes, reportRes] = await Promise.all([
    fetch(`${APP_ARTIFACT_BASE}/app_manifest.json`),
    fetch(`${APP_ARTIFACT_BASE}/app_report.json`),
  ]);

  if (!manifestRes.ok || !reportRes.ok) {
    const [fallbackManifest, fallbackReport] = await Promise.all([
      fetch(`${APP_MODULE_BASE}/app_manifest.json`),
      fetch(`${APP_MODULE_BASE}/app_report.json`),
    ]);

    return {
      appManifest: fallbackManifest.ok
        ? ((await fallbackManifest.json()) as AppManifest)
        : null,
      appReport: fallbackReport.ok
        ? ((await fallbackReport.json()) as AppReport)
        : null,
    };
  }

  return {
    appManifest: (await manifestRes.json()) as AppManifest,
    appReport: (await reportRes.json()) as AppReport,
  };
}
