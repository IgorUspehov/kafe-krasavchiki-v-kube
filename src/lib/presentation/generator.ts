import { generateReadme } from "@/lib/presentation/readme-generator";
import type {
  PresentationBundle,
  PresentationSourceData,
  ProjectCard,
  ScreenshotsManifest,
  TranslateFn,
} from "@/lib/presentation/types";
import { fetchPipelineSnapshot } from "@/lib/factory-api";
import { fetchStatus } from "@/lib/api";

const ARTIFACT_ROOT = "artifacts/presentation";

export const EMPTY_SCREENSHOTS: ScreenshotsManifest = {
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

export function buildSourceData(
  status: Awaited<ReturnType<typeof fetchStatus>>,
  pipeline: Awaited<ReturnType<typeof fetchPipelineSnapshot>>
): PresentationSourceData {
  const projectName =
    status.project_name ?? "SAAS_IDEA_AI_MVP_FACTORY_WEB";

  return {
    projectName,
    idea: status.idea ?? "",
    factoryVersion: status.factory_version ?? "3.3",
    mvpStatus: status.status ?? "PENDING",
    projectType: pipeline.projectType?.project_type ?? "—",
    repository: pipeline.repository?.best_repo ?? "—",
    template: pipeline.template?.best_template ?? "—",
    uiLibrary: pipeline.ui?.best_ui ?? "—",
    complexity: pipeline.complexity?.complexity ?? "—",
    estimatedCost: pipeline.cost?.cost_eur
      ? `${pipeline.cost.cost_eur} EUR`
      : "—",
    estimatedTime: pipeline.cost?.hours ? `${pipeline.cost.hours}h` : "—",
    auditStatus: pipeline.audit?.ready_for_v3 ? "READY FOR V3" : "PENDING",
    features: [
      "Dashboard with factory metrics",
      "Pipeline snapshot (rankers + estimators)",
      "Artifacts browser",
      "i18n EN / DE / RU",
    ],
    stack: ["React", "Next.js", "Tailwind CSS", "shadcn/ui", "TypeScript"],
  };
}

export function generateProjectCard(data: PresentationSourceData): ProjectCard {
  return {
    project_name: data.projectName,
    project_type: data.projectType,
    repository: data.repository,
    template: data.template,
    ui_library: data.uiLibrary,
    complexity: data.complexity,
    estimated_cost: data.estimatedCost,
    estimated_time: data.estimatedTime,
    audit_status: data.auditStatus,
    presentation_ready: true,
  };
}

export function generateScreenshotsManifest(): ScreenshotsManifest {
  return { ...EMPTY_SCREENSHOTS };
}

export function generatePresentationManifest(
  data: PresentationSourceData,
  screenshots: ScreenshotsManifest
) {
  const screenshotPaths = Object.entries(screenshots)
    .filter(([, path]) => path.length > 0)
    .map(([, path]) => path);

  return {
    project_name: data.projectName,
    screenshots: screenshotPaths,
    readme: `${ARTIFACT_ROOT}/README.md`,
    project_card: `${ARTIFACT_ROOT}/project_card.json`,
    demo_video: `${ARTIFACT_ROOT}/demo.mp4`,
    demo_status: "PENDING" as const,
    status: "SELF_PRESENTING_READY" as const,
  };
}

export function generatePresentationBundle(
  data: PresentationSourceData,
  t: TranslateFn
): PresentationBundle {
  const screenshots = generateScreenshotsManifest();
  const projectCard = generateProjectCard(data);
  const presentation = generatePresentationManifest(data, screenshots);
  const readme = generateReadme(data, t);

  return {
    readme,
    projectCard,
    presentation,
    screenshots,
  };
}

export async function fetchPresentationBundle(
  t: TranslateFn
): Promise<PresentationBundle> {
  const [status, pipeline] = await Promise.all([
    fetchStatus(),
    fetchPipelineSnapshot(),
  ]);
  const data = buildSourceData(status, pipeline);
  return generatePresentationBundle(data, t);
}

export const PRESENTATION_ARTIFACT_PATHS = {
  root: ARTIFACT_ROOT,
  readme: `${ARTIFACT_ROOT}/README.md`,
  projectCard: `${ARTIFACT_ROOT}/project_card.json`,
  presentation: `${ARTIFACT_ROOT}/presentation.json`,
  screenshots: `${ARTIFACT_ROOT}/screenshots/screenshots.json`,
  demoVideo: `${ARTIFACT_ROOT}/demo.mp4`,
} as const;
