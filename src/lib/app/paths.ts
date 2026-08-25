export const APP_PATHS = {
  root: "artifacts/factory_output/app",
  manifest: "artifacts/factory_output/app/app_manifest.json",
  report: "artifacts/factory_output/app/app_report.json",
  indexHtml: (projectName: string) =>
    `artifacts/factory_output/app/${projectName}/app/index.html`,
  packageJson: (projectName: string) =>
    `artifacts/factory_output/app/${projectName}/app/package.json`,
  mainJs: (projectName: string) =>
    `artifacts/factory_output/app/${projectName}/app/src/main.js`,
  stylesCss: (projectName: string) =>
    `artifacts/factory_output/app/${projectName}/app/src/styles.css`,
} as const;
