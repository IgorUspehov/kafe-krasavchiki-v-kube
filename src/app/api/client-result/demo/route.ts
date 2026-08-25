import fs from "fs";

import { NextResponse } from "next/server";

import { getActiveArtifactAssessment, resolveDemoPath } from "@/lib/client-preview/delivery-artifacts";
import { ensureClientDeliveryMaterialized } from "@/lib/client-preview/client-delivery-materializer";
import { assessDemoVideoSync } from "@/lib/client-preview/demo-video-sync";

export async function GET() {
  const assessment = getActiveArtifactAssessment("latest");
  if (!assessment.consistent) {
    return NextResponse.json(
      { ok: false, error: assessment.sync_warning || "Artifacts are out of sync" },
      { status: 409 },
    );
  }

  ensureClientDeliveryMaterialized(assessment);

  const demoSync = assessDemoVideoSync(assessment.canonical);
  if (!demoSync.synced) {
    return NextResponse.json(
      { ok: false, error: demoSync.warning || "Demo video not synced" },
      { status: 409 },
    );
  }

  const demoPath = resolveDemoPath("latest");
  if (!demoPath) {
    return NextResponse.json({ ok: false, error: "demo.mp4 not found" }, { status: 404 });
  }

  const file = fs.readFileSync(demoPath);
  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": 'inline; filename="demo.mp4"',
    },
  });
}
