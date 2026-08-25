import type {
  ScaffoldArtifactsSnapshot,
  ScaffoldManifest,
  ScaffoldReport,
} from "@/lib/scaffold/types";

export const SCAFFOLD_ARTIFACT_BASE = "/artifacts/factory_output/scaffold";
export const SCAFFOLD_MODULE_BASE = "/artifacts/scaffold";

export async function fetchScaffoldArtifactsSnapshot(): Promise<ScaffoldArtifactsSnapshot> {
  const [manifestRes, reportRes] = await Promise.all([
    fetch(`${SCAFFOLD_ARTIFACT_BASE}/scaffold_manifest.json`),
    fetch(`${SCAFFOLD_ARTIFACT_BASE}/scaffold_report.json`),
  ]);

  if (!manifestRes.ok || !reportRes.ok) {
    const [fallbackManifest, fallbackReport] = await Promise.all([
      fetch(`${SCAFFOLD_MODULE_BASE}/scaffold_manifest.json`),
      fetch(`${SCAFFOLD_MODULE_BASE}/scaffold_report.json`),
    ]);

    return {
      scaffoldManifest: fallbackManifest.ok
        ? ((await fallbackManifest.json()) as ScaffoldManifest)
        : null,
      scaffoldReport: fallbackReport.ok
        ? ((await fallbackReport.json()) as ScaffoldReport)
        : null,
    };
  }

  return {
    scaffoldManifest: (await manifestRes.json()) as ScaffoldManifest,
    scaffoldReport: (await reportRes.json()) as ScaffoldReport,
  };
}
