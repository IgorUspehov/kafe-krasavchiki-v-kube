import type { GithubSourceContext } from "@/lib/github/types";

export type GithubTranslateFn = (key: string) => string;

export function generateReadmeReady(
  ctx: GithubSourceContext,
  t: GithubTranslateFn
): string {
  const screenshotsSection = ctx.screenshotsCount
    ? `${t("githubReadme.screenshotsIncluded")} (${ctx.screenshotsCount})`
  : t("githubReadme.screenshotsPending");

  const demoSection = ctx.demoVideo
    ? t("githubReadme.demoIncluded")
    : t("githubReadme.demoPending");

  return `# ${ctx.projectName}

## ${t("githubReadme.description")}

${ctx.idea || t("githubReadme.descriptionFallback")}

## ${t("githubReadme.features")}

- ${t("githubReadme.featureDashboard")}
- ${t("githubReadme.featurePresentation")}
- ${t("githubReadme.featurePackaging")}
- ${t("githubReadme.featureRelease")}
- ${t("githubReadme.featureGithub")}

## ${t("githubReadme.installation")}

\`\`\`bash
git clone https://github.com/your-org/${slugify(ctx.projectName)}.git
cd ${slugify(ctx.projectName)}
npm install
\`\`\`

## ${t("githubReadme.run")}

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## ${t("githubReadme.screenshots")}

${screenshotsSection}

## ${t("githubReadme.demoVideo")}

${demoSection}

## ${t("githubReadme.pwa")}

${ctx.pwaReady ? "PWA_READY" : "PENDING"} — \`artifacts/package/pwa/manifest.json\`

## ${t("githubReadme.apk")}

${ctx.apkReady ? "APK_READY (foundation)" : "PENDING"} — \`artifacts/package/apk/capacitor.config.json\`

## ${t("githubReadme.license")}

MIT License — see [LICENSE](LICENSE)

---
_${t("githubReadme.footer")} · v${ctx.version}_
`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mvp-project";
}
