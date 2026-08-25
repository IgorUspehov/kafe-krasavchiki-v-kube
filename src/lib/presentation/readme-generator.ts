import type { PresentationSourceData, TranslateFn } from "@/lib/presentation/types";

export function generateReadme(data: PresentationSourceData, t: TranslateFn): string {
  const screenshotLines = [
    t("readme.screenshotHome"),
    t("readme.screenshotDashboard"),
    t("readme.screenshotPipeline"),
    t("readme.screenshotArtifacts"),
    t("readme.screenshotProjects"),
    t("readme.screenshotMobile"),
  ]
    .map((label) => `- ${label}: _${t("readme.pending")}_`)
    .join("\n");

  const features =
    data.features.length > 0
      ? data.features.map((f) => `- ${f}`).join("\n")
      : `- ${t("readme.featurePipeline")}\n- ${t("readme.featureArtifacts")}\n- ${t("readme.featureDashboard")}`;

  const stack =
    data.stack.length > 0
      ? data.stack.map((s) => `- ${s}`).join("\n")
      : `- React · Next.js · Tailwind CSS · shadcn/ui`;

  return `# ${data.projectName}

## ${t("readme.description")}

${data.idea || t("readme.descriptionFallback")}

## ${t("readme.features")}

${features}

## ${t("readme.stack")}

${stack}

## ${t("readme.screenshots")}

${screenshotLines}

## ${t("readme.installation")}

\`\`\`bash
cd SAAS_IDEA_AI_MVP_FACTORY_WEB
npm install
\`\`\`

## ${t("readme.run")}

\`\`\`bash
npm run dev
\`\`\`

## ${t("readme.build")}

\`\`\`bash
npm run build
\`\`\`

## ${t("readme.status")}

| ${t("readme.field")} | ${t("readme.value")} |
| --- | --- |
| ${t("readme.projectType")} | ${data.projectType} |
| ${t("readme.repository")} | ${data.repository} |
| ${t("readme.template")} | ${data.template} |
| ${t("readme.uiLibrary")} | ${data.uiLibrary} |
| ${t("readme.complexity")} | ${data.complexity} |
| ${t("readme.mvpStatus")} | ${data.mvpStatus} |
| ${t("readme.auditStatus")} | ${data.auditStatus} |
| Factory | v${data.factoryVersion} |

---
_${t("readme.footer")}_
`;
}
