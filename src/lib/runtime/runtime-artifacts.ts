import type {
  RuntimeArtifactsSnapshot,
  RuntimeManifest,
  RuntimeReport,
} from "@/lib/runtime/types";

export const RUNTIME_ARTIFACT_BASE = "/artifacts/factory_output/runtime";
export const RUNTIME_MODULE_BASE = "/artifacts/runtime";

export async function fetchRuntimeArtifactsSnapshot(): Promise<RuntimeArtifactsSnapshot> {
  const [manifestRes, reportRes] = await Promise.all([
    fetch(`${RUNTIME_ARTIFACT_BASE}/runtime_manifest.json`),
    fetch(`${RUNTIME_ARTIFACT_BASE}/runtime_report.json`),
  ]);

  if (!manifestRes.ok || !reportRes.ok) {
    const [fallbackManifest, fallbackReport] = await Promise.all([
      fetch(`${RUNTIME_MODULE_BASE}/runtime_manifest.json`),
      fetch(`${RUNTIME_MODULE_BASE}/runtime_report.json`),
    ]);

    const runtimeManifest = fallbackManifest.ok
      ? ((await fallbackManifest.json()) as RuntimeManifest)
      : null;

    const runtimeReport = fallbackReport.ok
      ? ((await fallbackReport.json()) as RuntimeReport)
      : null;

    return { runtimeManifest, runtimeReport };
  }

  const runtimeManifest = (await manifestRes.json()) as RuntimeManifest;
  const runtimeReport = (await reportRes.json()) as RuntimeReport;

  return { runtimeManifest, runtimeReport };
}
