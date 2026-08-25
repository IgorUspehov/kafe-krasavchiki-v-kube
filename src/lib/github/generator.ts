import { generateReadmeReady } from "@/lib/github/readme-ready-generator";
import { generateReleaseBody } from "@/lib/github/release-body-generator";
import {
  generateRepoDescription,
  generateRepositoryManifest,
  generateTopics,
  slugifyRepositoryName,
} from "@/lib/github/repo-manifest-generator";
import {
  GITHUB_ARTIFACT_ROOT,
  GITHUB_FACTORY_VERSION,
  type GithubPackageBundle,
  type GithubPublishReport,
  type GithubReleaseTag,
  type GithubSourceContext,
} from "@/lib/github/types";

export const GITHUB_PATHS = {
  root: GITHUB_ARTIFACT_ROOT,
  readmeReady: `${GITHUB_ARTIFACT_ROOT}/README_READY.md`,
  license: `${GITHUB_ARTIFACT_ROOT}/LICENSE`,
  gitignore: `${GITHUB_ARTIFACT_ROOT}/.gitignore`,
  repoDescription: `${GITHUB_ARTIFACT_ROOT}/repo_description.txt`,
  topics: `${GITHUB_ARTIFACT_ROOT}/topics.json`,
  releaseTag: `${GITHUB_ARTIFACT_ROOT}/release_tag.json`,
  releaseBody: `${GITHUB_ARTIFACT_ROOT}/github_release_body.md`,
  repositoryManifest: `${GITHUB_ARTIFACT_ROOT}/repository_manifest.json`,
  publishReport: `${GITHUB_ARTIFACT_ROOT}/github_publish_report.json`,
} as const;

const MIT_LICENSE = `MIT License

Copyright (c) ${new Date().getFullYear()} SAAS_IDEA_AI_MVP_FACTORY

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const GITIGNORE = `# dependencies
node_modules/
.pnp
.pnp.js

# build
.next/
out/
dist/
build/

# env
.env
.env.local
.env.*.local

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ide
.idea/
.vscode/
*.swp

# os
.DS_Store
Thumbs.db

# factory staging
.release-staging/
`;

export function generateReleaseTag(version = GITHUB_FACTORY_VERSION): GithubReleaseTag {
  return {
    version,
    tag: `v${version}`,
    status: "READY",
  };
}

export function generatePublishReport(ready: boolean): GithubPublishReport {
  return {
    status: ready ? "READY_TO_PUBLISH" : "PENDING",
    github_ready: ready,
    release_ready: ready,
    readme_ready: ready,
  };
}

export function generateGithubPackage(
  ctx: GithubSourceContext,
  t: (key: string) => string
): GithubPackageBundle {
  const repositoryManifest = generateRepositoryManifest(ctx);
  const ready =
    ctx.buildStatus === "PASS" || ctx.buildStatus === "READY" || ctx.releaseReady;

  return {
    readmeReady: generateReadmeReady(ctx, t),
    license: MIT_LICENSE,
    gitignore: GITIGNORE,
    repoDescription: generateRepoDescription(ctx),
    topics: generateTopics(),
    releaseTag: generateReleaseTag(ctx.version),
    releaseBody: generateReleaseBody(ctx),
    repositoryManifest,
    publishReport: generatePublishReport(ready),
  };
}

export function buildDefaultSourceContext(
  projectName: string,
  overrides: Partial<GithubSourceContext> = {}
): GithubSourceContext {
  return {
    projectName,
    idea: "",
    version: GITHUB_FACTORY_VERSION,
    demoVideo: false,
    screenshotsCount: 0,
    pwaReady: false,
    apkReady: false,
    releaseReady: false,
    buildStatus: "READY",
    ...overrides,
  };
}

export { slugifyRepositoryName };
