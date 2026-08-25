import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

import { appendNotification } from "@/lib/client-notifications/notification-store";
import { getActiveArtifactAssessment } from "@/lib/client-preview/delivery-artifacts";
import {
  ensureClientDeliveryMaterialized,
  LIVE_ZIP,
} from "@/lib/client-preview/client-delivery-materializer";

const LEGACY_PATHS = [
  "output/client_delivery/final_package.zip",
  "output/final_package.zip",
];

function resolvePackagePath(): string | null {
  const assessment = getActiveArtifactAssessment("latest");
  if (!assessment.consistent) {
    return null;
  }

  ensureClientDeliveryMaterialized(assessment);
  if (fs.existsSync(LIVE_ZIP) && fs.statSync(LIVE_ZIP).isFile() && fs.statSync(LIVE_ZIP).size > 0) {
    return LIVE_ZIP;
  }

  for (const rel of LEGACY_PATHS) {
    const fullPath = path.join(process.cwd(), rel);
    try {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile() && fs.statSync(fullPath).size > 0) {
        return fullPath;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function GET() {
  const packagePath = resolvePackagePath();
  if (!packagePath) {
    return NextResponse.json(
      {
        status: "FAIL",
        error: "FINAL_PACKAGE_NOT_FOUND",
        llm_used: false,
      },
      { status: 404 },
    );
  }

  appendNotification({ event: "DOWNLOAD_CONFIRMED" });

  const fileBuffer = fs.readFileSync(packagePath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="final_package.zip"',
      "Content-Length": String(fileBuffer.length),
    },
  });
}
