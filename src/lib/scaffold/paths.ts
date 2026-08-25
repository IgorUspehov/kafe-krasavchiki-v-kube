export const SCAFFOLD_PATHS = {
  root: "artifacts/factory_output/scaffold",
  manifest: "artifacts/factory_output/scaffold/scaffold_manifest.json",
  report: "artifacts/factory_output/scaffold/scaffold_report.json",
  componentsJson: (projectName: string) =>
    `artifacts/factory_output/scaffold/${projectName}/components.json`,
  packageJson: (projectName: string) =>
    `artifacts/factory_output/scaffold/${projectName}/package.json`,
  viteConfig: (projectName: string) =>
    `artifacts/factory_output/scaffold/${projectName}/vite.config.ts`,
  tailwindConfig: (projectName: string) =>
    `artifacts/factory_output/scaffold/${projectName}/tailwind.config.ts`,
} as const;
