import type {
  GithubArtifactsSnapshot,
  GithubPublishReport,
  GithubReleaseTag,
  GithubRepositoryManifest,
  GithubTopics,
} from "@/lib/github/types";

export const GITHUB_ARTIFACT_BASE = "/artifacts/github";

export async function fetchGithubArtifactsSnapshot(): Promise<GithubArtifactsSnapshot> {
  const [reportRes, manifestRes, topicsRes, tagRes] = await Promise.all([
    fetch(`${GITHUB_ARTIFACT_BASE}/github_publish_report.json`),
    fetch(`${GITHUB_ARTIFACT_BASE}/repository_manifest.json`),
    fetch(`${GITHUB_ARTIFACT_BASE}/topics.json`),
    fetch(`${GITHUB_ARTIFACT_BASE}/release_tag.json`),
  ]);

  const publishReport = reportRes.ok
    ? ((await reportRes.json()) as GithubPublishReport)
    : null;

  const repositoryManifest = manifestRes.ok
    ? ((await manifestRes.json()) as GithubRepositoryManifest)
    : null;

  const topics = topicsRes.ok ? ((await topicsRes.json()) as GithubTopics) : null;

  const releaseTag = tagRes.ok ? ((await tagRes.json()) as GithubReleaseTag) : null;

  return { publishReport, repositoryManifest, topics, releaseTag };
}
