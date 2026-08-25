import { NextResponse } from "next/server";

import { readClientBuildStatus } from "@/lib/client-build/pipeline";

export async function GET() {
  const status = readClientBuildStatus();
  return NextResponse.json(status);
}
