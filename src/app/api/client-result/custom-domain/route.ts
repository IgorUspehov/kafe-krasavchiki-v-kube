import { NextResponse } from "next/server";

import { readNetlifyDeployUrl } from "@/lib/client-preview/delivery-artifacts";

export async function GET() {
  return NextResponse.json({
    ok: true,
    netlify_url: readNetlifyDeployUrl(),
  });
}
