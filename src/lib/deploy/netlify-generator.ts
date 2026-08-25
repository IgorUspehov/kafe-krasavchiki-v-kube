import { DEPLOY_ARTIFACT_ROOT, type NetlifyReport } from "@/lib/deploy/types";

const NETLIFY_ROOT = `${DEPLOY_ARTIFACT_ROOT}/netlify`;

export function generateNetlifyToml(): string {
  return `[build]
command = "npm run build"
publish = ".next"

[build.environment]
NODE_VERSION = "22"
`;
}

export function generateNetlifyReport(): NetlifyReport {
  return {
    status: "READY",
    config_path: `${NETLIFY_ROOT}/netlify.toml`,
    build_command: "npm run build",
    publish_directory: ".next",
    node_version: "22",
  };
}
