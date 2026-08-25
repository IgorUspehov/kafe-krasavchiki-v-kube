import { generateApkReport, generateAndroidManifestFoundation, generateCapacitorConfig } from "@/lib/package/apk-generator";
import { generatePwaIcons, generatePwaManifest, generatePwaReport } from "@/lib/package/pwa-generator";
import {
  FACTORY_PACKAGE_VERSION,
  PACKAGE_ARTIFACT_ROOT,
  type PackageBundle,
  type PackageReadyStatus,
  type PackageReport,
  type PackagingPresentationFields,
  type WebReport,
} from "@/lib/package/types";

const WEB_ROOT = `${PACKAGE_ARTIFACT_ROOT}/web`;
const PWA_ROOT = `${PACKAGE_ARTIFACT_ROOT}/pwa`;
const APK_ROOT = `${PACKAGE_ARTIFACT_ROOT}/apk`;

export const PACKAGE_PATHS = {
  root: PACKAGE_ARTIFACT_ROOT,
  web: WEB_ROOT,
  pwa: PWA_ROOT,
  apk: APK_ROOT,
  packageReport: `${PACKAGE_ARTIFACT_ROOT}/package_report.json`,
} as const;

export function generateWebReport(status: PackageReadyStatus = "READY"): WebReport {
  return {
    status,
    artifact_path: WEB_ROOT,
    framework: "Next.js 15",
    build_command: "npm run build",
    output: ".next / static export foundation",
  };
}

export function generatePackageReport(
  status: PackageReadyStatus = "READY"
): PackageReport {
  return {
    web: status,
    pwa: status,
    apk: status,
    generated_at: new Date().toISOString(),
    factory_version: FACTORY_PACKAGE_VERSION,
  };
}

export function generatePresentationPackagingFields(
  status: PackageReadyStatus = "READY"
): PackagingPresentationFields {
  return {
    web_status: status,
    pwa_status: status,
    apk_status: status,
    web_artifact_path: WEB_ROOT,
    pwa_artifact_path: PWA_ROOT,
    apk_artifact_path: APK_ROOT,
  };
}

export function generatePackageBundle(
  projectName = "SAAS_IDEA_AI_MVP_FACTORY_WEB"
): PackageBundle {
  const status: PackageReadyStatus = "READY";

  return {
    packageReport: generatePackageReport(status),
    webReport: generateWebReport(status),
    pwaManifest: generatePwaManifest(projectName),
    pwaIcons: generatePwaIcons(),
    pwaReport: generatePwaReport(status),
    capacitorConfig: generateCapacitorConfig(projectName),
    androidManifest: generateAndroidManifestFoundation(),
    apkReport: generateApkReport(status),
    presentationFields: generatePresentationPackagingFields(status),
  };
}
