import {
  PACKAGE_ARTIFACT_ROOT,
  type AndroidManifestFoundation,
  type ApkReport,
  type CapacitorConfig,
  type PackageReadyStatus,
} from "@/lib/package/types";

const APK_ROOT = `${PACKAGE_ARTIFACT_ROOT}/apk`;

export function generateCapacitorConfig(projectName: string): CapacitorConfig {
  const appId = "com.saasidea.mvpfactory.web";

  return {
    appId,
    appName: projectName,
    webDir: "out",
    bundledWebRuntime: false,
    server: {
      androidScheme: "https",
    },
  };
}

export function generateAndroidManifestFoundation(): AndroidManifestFoundation {
  return {
    package: "com.saasidea.mvpfactory.web",
    versionCode: 1,
    versionName: "3.4.0",
    minSdkVersion: 24,
    targetSdkVersion: 34,
    permissions: ["INTERNET"],
    launchActivity: "com.saasidea.mvpfactory.web.MainActivity",
    note: "Capacitor APK foundation only — APK build not implemented in v3.4.",
  };
}

export function generateApkReport(status: PackageReadyStatus = "READY"): ApkReport {
  return {
    status,
    artifact_path: APK_ROOT,
    capacitor_config: `${APK_ROOT}/capacitor.config.json`,
    android_manifest: `${APK_ROOT}/android_manifest.json`,
    build_implemented: false,
    note: "APK foundation ready. Run Capacitor build in a future factory release.",
  };
}
