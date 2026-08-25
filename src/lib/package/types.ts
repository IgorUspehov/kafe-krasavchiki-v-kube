export type PackageReadyStatus = "READY" | "PENDING";

export const FACTORY_PACKAGE_VERSION = "3.4";

export const PACKAGE_ARTIFACT_ROOT = "artifacts/package";

export interface PackageReport {
  web: PackageReadyStatus;
  pwa: PackageReadyStatus;
  apk: PackageReadyStatus;
  generated_at: string;
  factory_version: string;
}

export interface WebReport {
  status: PackageReadyStatus;
  artifact_path: string;
  framework: string;
  build_command: string;
  output: string;
}

export interface PwaManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  lang: string;
  orientation: string;
}

export interface PwaIcons {
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }>;
}

export interface PwaReport {
  status: PackageReadyStatus;
  artifact_path: string;
  manifest: string;
  icons: string;
  service_worker: string;
  note: string;
}

export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime: boolean;
  server?: {
    androidScheme: string;
  };
}

export interface AndroidManifestFoundation {
  package: string;
  versionCode: number;
  versionName: string;
  minSdkVersion: number;
  targetSdkVersion: number;
  permissions: string[];
  launchActivity: string;
  note: string;
}

export interface ApkReport {
  status: PackageReadyStatus;
  artifact_path: string;
  capacitor_config: string;
  android_manifest: string;
  build_implemented: boolean;
  note: string;
}

export interface PackagingPresentationFields {
  web_status: PackageReadyStatus;
  pwa_status: PackageReadyStatus;
  apk_status: PackageReadyStatus;
  web_artifact_path: string;
  pwa_artifact_path: string;
  apk_artifact_path: string;
}

export interface PackageBundle {
  packageReport: PackageReport;
  webReport: WebReport;
  pwaManifest: PwaManifest;
  pwaIcons: PwaIcons;
  pwaReport: PwaReport;
  capacitorConfig: CapacitorConfig;
  androidManifest: AndroidManifestFoundation;
  apkReport: ApkReport;
  presentationFields: PackagingPresentationFields;
}

export interface PackageArtifactsSnapshot {
  packageReport: PackageReport | null;
  presentation: PackagingPresentationFields | null;
}
