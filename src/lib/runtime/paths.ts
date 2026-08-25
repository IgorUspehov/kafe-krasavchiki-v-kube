export const RUNTIME_PATHS = {
  root: "artifacts/factory_output/runtime",
  manifest: "artifacts/factory_output/runtime/runtime_manifest.json",
  report: "artifacts/factory_output/runtime/runtime_report.json",
  startSh: (projectName: string) =>
    `artifacts/factory_output/runtime/${projectName}/run/start.sh`,
  stopSh: (projectName: string) =>
    `artifacts/factory_output/runtime/${projectName}/run/stop.sh`,
  statusSh: (projectName: string) =>
    `artifacts/factory_output/runtime/${projectName}/run/status.sh`,
  manifestYml: (projectName: string) =>
    `artifacts/factory_output/runtime/${projectName}/config/manifest.yml`,
  readmeTxt: (projectName: string) =>
    `artifacts/factory_output/runtime/${projectName}/README.txt`,
} as const;
