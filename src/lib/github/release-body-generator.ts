import type { GithubSourceContext } from "@/lib/github/types";

export function generateReleaseBody(ctx: GithubSourceContext): string {
  const en = `## ${ctx.projectName} v${ctx.version}

### Highlights
- Self-presenting MVP dashboard
- Demo video: ${ctx.demoVideo ? "included" : "pending"}
- Screenshots: ${ctx.screenshotsCount}
- PWA foundation: ${ctx.pwaReady ? "READY" : "PENDING"}
- APK foundation: ${ctx.apkReady ? "READY" : "PENDING"}
- Release bundle: ${ctx.releaseReady ? "READY" : "PENDING"}

### Artifacts
- README_READY.md
- project_bundle.zip (from release factory)
- package/ (web, pwa, apk)

**Status:** READY_TO_PUBLISH (preparation only)
`;

  const de = `## ${ctx.projectName} v${ctx.version}

### Highlights
- Self-Presenting MVP Dashboard
- Demo-Video: ${ctx.demoVideo ? "enthalten" : "ausstehend"}
- Screenshots: ${ctx.screenshotsCount}
- PWA Foundation: ${ctx.pwaReady ? "BEREIT" : "AUSSTEHEND"}
- APK Foundation: ${ctx.apkReady ? "BEREIT" : "AUSSTEHEND"}
- Release Bundle: ${ctx.releaseReady ? "BEREIT" : "AUSSTEHEND"}

### Artefakte
- README_READY.md
- project_bundle.zip
- package/ (web, pwa, apk)

**Status:** READY_TO_PUBLISH (nur Vorbereitung)
`;

  const ru = `## ${ctx.projectName} v${ctx.version}

### Highlights
- Self-Presenting MVP dashboard
- Demo video: ${ctx.demoVideo ? "включено" : "ожидается"}
- Screenshots: ${ctx.screenshotsCount}
- PWA foundation: ${ctx.pwaReady ? "READY" : "PENDING"}
- APK foundation: ${ctx.apkReady ? "READY" : "PENDING"}
- Release bundle: ${ctx.releaseReady ? "READY" : "PENDING"}

### Artifacts
- README_READY.md
- project_bundle.zip
- package/ (web, pwa, apk)

**Status:** READY_TO_PUBLISH (только подготовка)
`;

  return `## English\n\n${en}\n\n---\n\n## Deutsch\n\n${de}\n\n---\n\n## Русский\n\n${ru}\n`;
}
