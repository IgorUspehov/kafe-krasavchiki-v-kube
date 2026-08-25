import type {
  GithubPublishReport,
  ReleaseArtifactsSnapshot,
  ReleaseManifest,
  ReleasePresentationFields,
  ReleaseReport,
} from "@/lib/release/types";

export const RELEASE_ARTIFACT_BASE = "/artifacts/release";

export async function fetchReleaseArtifactsSnapshot(): Promise<ReleaseArtifactsSnapshot> {
  const [manifestRes, reportRes, githubRes, presentationRes] = await Promise.all([
    fetch(`${RELEASE_ARTIFACT_BASE}/release_manifest.json`),
    fetch(`${RELEASE_ARTIFACT_BASE}/release_report.json`),
    fetch(`${RELEASE_ARTIFACT_BASE}/github/github_publish_report.json`),
    fetch("/artifacts/presentation/presentation.json"),
  ]);

  const releaseManifest = manifestRes.ok
    ? ((await manifestRes.json()) as ReleaseManifest)
    : null;

  const releaseReport = reportRes.ok
    ? ((await reportRes.json()) as ReleaseReport)
    : null;

  const githubReport = githubRes.ok
    ? ((await githubRes.json()) as GithubPublishReport)
    : null;

  let presentation: ReleasePresentationFields | null = null;
  if (presentationRes.ok) {
    const data = (await presentationRes.json()) as ReleasePresentationFields & Record<string, unknown>;
    presentation = {
      release_ready: Boolean(data.release_ready),
      bundle_path: data.bundle_path ?? "artifacts/release/bundle/project_bundle.zip",
      release_manifest: data.release_manifest ?? "artifacts/release/release_manifest.json",
      release_notes: data.release_notes ?? "artifacts/release/github/release_notes.md",
    };
  }

  return {
    releaseManifest,
    releaseReport,
    githubReport,
    presentation,
  };
}
