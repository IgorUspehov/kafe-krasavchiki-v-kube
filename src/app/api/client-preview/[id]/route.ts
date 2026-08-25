import { NextResponse } from "next/server";

import { buildPreviewPayload } from "@/lib/client-preview/preview-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const payload = buildPreviewPayload(id);

  if (!payload.ok) {
    return NextResponse.json(payload, { status: 404 });
  }

  return NextResponse.json(payload);
}
