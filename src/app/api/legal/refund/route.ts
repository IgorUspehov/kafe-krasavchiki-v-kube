import { NextResponse } from "next/server";

import { loadRefundDocument } from "@/lib/legal/legal-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const language = url.searchParams.get("language") ?? "en";
  try {
    const document = loadRefundDocument(language);
    return NextResponse.json({
      status: "PASS",
      llm_used: false,
      ...document,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load refund policy";
    return NextResponse.json(
      { status: "FAIL", llm_used: false, error: message },
      { status: 500 },
    );
  }
}
