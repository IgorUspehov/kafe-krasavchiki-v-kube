import type { ReleaseManifest } from "@/lib/release/types";

export type ReleaseTranslateFn = (key: string) => string;

export function generateReleaseNotes(
  projectName: string,
  manifest: ReleaseManifest,
  t: ReleaseTranslateFn
): string {
  const artifactLines = [
    `- README.md: ${manifest.readme ? t("releaseNotes.included") : t("releaseNotes.missing")}`,
    `- project_card.json: ${manifest.project_card ? t("releaseNotes.included") : t("releaseNotes.missing")}`,
    `- presentation.json: ${t("releaseNotes.included")}`,
    `- demo.mp4: ${manifest.demo_video ? t("releaseNotes.included") : t("releaseNotes.missing")}`,
    `- screenshots/: ${manifest.screenshots ? t("releaseNotes.included") : t("releaseNotes.missing")}`,
    `- package/: ${manifest.package_artifacts ? t("releaseNotes.included") : t("releaseNotes.missing")}`,
    `- release_manifest.json: ${t("releaseNotes.included")}`,
    `- repository_manifest.json: ${t("releaseNotes.included")}`,
  ].join("\n");

  const section = (langLabel: string, body: string) =>
    `## ${langLabel}\n\n${body}`;

  const enBody = `# ${projectName}

## ${t("releaseNotes.projectName")}
${projectName}

## ${t("releaseNotes.version")}
${manifest.version}

## ${t("releaseNotes.features")}
- ${t("releaseNotes.featureDashboard")}
- ${t("releaseNotes.featurePresentation")}
- ${t("releaseNotes.featurePackaging")}
- ${t("releaseNotes.featureRelease")}

## ${t("releaseNotes.artifactsIncluded")}
${artifactLines}

## ${t("releaseNotes.buildStatus")}
${manifest.bundle_ready ? "PASS" : "PENDING"}

## ${t("releaseNotes.presentationStatus")}
SELF_PRESENTING_READY

## ${t("releaseNotes.packagingStatus")}
WEB_READY · PWA_READY · APK_READY
`;

  const deBody = `# ${projectName}

## Projektname
${projectName}

## Version
${manifest.version}

## Funktionen
- Dashboard mit Factory-Metriken
- Self-Presenting MVP Artefakte
- Web / PWA / APK Packaging Foundation
- Release Bundle Factory v3.5

## Enthaltene Artefakte
${artifactLines}

## Build-Status
${manifest.bundle_ready ? "PASS" : "PENDING"}

## Präsentations-Status
SELF_PRESENTING_READY

## Packaging-Status
WEB_READY · PWA_READY · APK_READY
`;

  const ruBody = `# ${projectName}

## Название проекта
${projectName}

## Версия
${manifest.version}

## Возможности
- Dashboard с метриками фабрики
- Self-Presenting MVP артефакты
- Web / PWA / APK packaging foundation
- Release Bundle Factory v3.5

## Включённые артефакты
${artifactLines}

## Статус сборки
${manifest.bundle_ready ? "PASS" : "PENDING"}

## Статус презентации
SELF_PRESENTING_READY

## Статус packaging
WEB_READY · PWA_READY · APK_READY
`;

  return [
    section("English", enBody),
    section("Deutsch", deBody),
    section("Русский", ruBody),
  ].join("\n\n---\n\n");
}
