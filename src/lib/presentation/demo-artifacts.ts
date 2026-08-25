import type { DemoStatus, PresentationManifest, ScreenshotsManifest } from "@/lib/presentation/types";

export const DEMO_ARTIFACT_BASE = "/artifacts/presentation";

export interface DemoArtifactsSnapshot {
  presentation: PresentationManifest | null;
  screenshots: ScreenshotsManifest | null;
  capturedCount: number;
  totalScreenshots: number;
  demoVideoPath: string;
  demoStatus: DemoStatus;
}

const EMPTY_SCREENSHOTS: ScreenshotsManifest = {
  dashboard: "",
  projects: "",
  pipeline: "",
  research: "",
  options: "",
  builds: "",
  artifacts: "",
  presentation: "",
  settings: "",
};

export async function fetchDemoArtifactsSnapshot(): Promise<DemoArtifactsSnapshot> {
  const [presentationRes, screenshotsRes] = await Promise.all([
    fetch(`${DEMO_ARTIFACT_BASE}/presentation.json`),
    fetch(`${DEMO_ARTIFACT_BASE}/screenshots/screenshots.json`),
  ]);

  const presentation = presentationRes.ok
    ? ((await presentationRes.json()) as PresentationManifest)
    : null;

  const screenshots = screenshotsRes.ok
    ? ((await screenshotsRes.json()) as ScreenshotsManifest)
    : null;

  const manifest = screenshots ?? EMPTY_SCREENSHOTS;
  const capturedCount = Object.values(manifest).filter((path) => path.length > 0).length;
  const totalScreenshots = Object.keys(manifest).length;

  return {
    presentation,
    screenshots: manifest,
    capturedCount,
    totalScreenshots,
    demoVideoPath: presentation?.demo_video ?? "artifacts/presentation/demo.mp4",
    demoStatus: presentation?.demo_status ?? "PENDING",
  };
}

export function publicScreenshotUrl(manifestPath: string): string {
  if (!manifestPath) return "";
  if (manifestPath.startsWith("/")) return manifestPath;
  if (manifestPath.startsWith("artifacts/")) {
    return `/${manifestPath}`;
  }
  return `${DEMO_ARTIFACT_BASE}/screenshots/${manifestPath}`;
}
