import type { GithubRepositoryManifest, GithubSourceContext } from "@/lib/github/types";

export function slugifyRepositoryName(projectName: string): string {
  return projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mvp-project";
}

export function generateRepositoryManifest(ctx: GithubSourceContext): GithubRepositoryManifest {
  return {
    repository_name: slugifyRepositoryName(ctx.projectName),
    version: ctx.version,
    build_status: ctx.buildStatus,
    demo_video: ctx.demoVideo,
    screenshots_count: ctx.screenshotsCount,
    pwa_ready: ctx.pwaReady,
    apk_ready: ctx.apkReady,
    release_ready: ctx.releaseReady,
  };
}

export function generateRepoDescription(ctx: GithubSourceContext): string {
  const text = `Self-presenting MVP by SAAS_IDEA_AI_MVP_FACTORY — ${ctx.projectName}`;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

export function generateTopics(): { topics: string[] } {
  return {
    topics: ["ai", "mvp", "saas", "automation", "react", "nextjs", "pwa"],
  };
}
