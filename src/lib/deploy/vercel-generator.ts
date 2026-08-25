import { DEPLOY_ARTIFACT_ROOT, type VercelReport } from "@/lib/deploy/types";

const VERCEL_ROOT = `${DEPLOY_ARTIFACT_ROOT}/vercel`;

export function generateVercelJson(): Record<string, unknown> {
  return {
    version: 2,
    buildCommand: "npm run build",
    outputDirectory: ".next",
    framework: "nextjs",
  };
}

export function generateVercelReport(): VercelReport {
  return {
    status: "READY",
    config_path: `${VERCEL_ROOT}/vercel.json`,
    framework: "nextjs",
    build_command: "npm run build",
    output_directory: ".next",
  };
}
