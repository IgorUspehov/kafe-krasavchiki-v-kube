import {
  PACKAGE_ARTIFACT_ROOT,
  type PackageReadyStatus,
  type PwaIcons,
  type PwaManifest,
  type PwaReport,
} from "@/lib/package/types";

const PWA_ROOT = `${PACKAGE_ARTIFACT_ROOT}/pwa`;

export function generatePwaManifest(projectName: string): PwaManifest {
  return {
    name: projectName,
    short_name: "MVP Factory",
    description: "SAAS_IDEA_AI_MVP_FACTORY Web Dashboard PWA",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    lang: "en",
    orientation: "portrait-primary",
  };
}

export function generatePwaIcons(): PwaIcons {
  return {
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}

export function generatePwaReport(status: PackageReadyStatus = "READY"): PwaReport {
  return {
    status,
    artifact_path: PWA_ROOT,
    manifest: `${PWA_ROOT}/manifest.json`,
    icons: `${PWA_ROOT}/icons.json`,
    service_worker: "planned-v3.4.1",
    note: "PWA foundation artifacts generated. Service worker not bundled in v3.4.",
  };
}
