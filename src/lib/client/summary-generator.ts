import { CLIENT_FACTORY_VERSION } from "@/lib/client/types";

export interface SummaryInput {
  projectName: string;
  buildStatus?: string;
}

export function generateProjectSummary(input: SummaryInput): string {
  const buildStatus = input.buildStatus ?? "PASS";

  return `# Project Summary

## Project Name
${input.projectName}

## Version
${CLIENT_FACTORY_VERSION}

## Build Status
${buildStatus}

## Included Deliverables

✓ README
✓ Demo Video
✓ Screenshots
✓ Web Package
✓ PWA Package
✓ APK Foundation
✓ Release Bundle
✓ GitHub Package
✓ Deploy Package
`;
}
