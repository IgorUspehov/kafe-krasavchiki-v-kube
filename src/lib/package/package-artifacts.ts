import type {
  PackageArtifactsSnapshot,
  PackageReport,
  PackagingPresentationFields,
} from "@/lib/package/types";

export const PACKAGE_ARTIFACT_BASE = "/artifacts/package";

export async function fetchPackageArtifactsSnapshot(): Promise<PackageArtifactsSnapshot> {
  const [reportRes, presentationRes] = await Promise.all([
    fetch(`${PACKAGE_ARTIFACT_BASE}/package_report.json`),
    fetch("/artifacts/presentation/presentation.json"),
  ]);

  const packageReport = reportRes.ok
    ? ((await reportRes.json()) as PackageReport)
    : null;

  let presentation: PackagingPresentationFields | null = null;
  if (presentationRes.ok) {
    const data = (await presentationRes.json()) as PackagingPresentationFields & Record<string, unknown>;
    presentation = {
      web_status: data.web_status ?? "PENDING",
      pwa_status: data.pwa_status ?? "PENDING",
      apk_status: data.apk_status ?? "PENDING",
      web_artifact_path: data.web_artifact_path ?? "artifacts/package/web",
      pwa_artifact_path: data.pwa_artifact_path ?? "artifacts/package/pwa",
      apk_artifact_path: data.apk_artifact_path ?? "artifacts/package/apk",
    };
  }

  return { packageReport, presentation };
}
