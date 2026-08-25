import { NextResponse } from "next/server";

import { buildDeployableZip, DeployableZipError } from "@/lib/deployable-zip";
import { verifyMvpProDownloadAccessAsync } from "@/lib/mvp-pro/entitlement-store";

export const runtime = "nodejs";

/**
 * Paid Deployable ZIP download (€999 Polar / MVP Pro entitlement).
 * Packs full Next.js source (src/, public/, configs) via Deployable ZIP builder.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const email = searchParams.get("email")?.trim() ?? undefined;

  if (!clientId || !token) {
    return NextResponse.json({ error: "clientId and token are required" }, { status: 400 });
  }

  const access = await verifyMvpProDownloadAccessAsync({ clientId, token, email });
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await buildDeployableZip({
      clientId,
      mode: "subscription_export",
      readme: {
        businessName: access.entitlement.businessName,
        businessType: access.entitlement.businessType,
        language: access.entitlement.language,
      },
    });

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
        "X-Deployable-Zip-Mode": "subscription_export",
        "X-Deployable-Zip-Client-Id": result.clientId,
      },
    });
  } catch (error) {
    if (error instanceof DeployableZipError) {
      const status =
        error.code === "DIST_MISSING" || error.code === "MANIFEST_MISSING" ? 404 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    const message = error instanceof Error ? error.message : "Failed to build ZIP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
