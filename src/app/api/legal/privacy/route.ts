import { NextResponse } from "next/server";

import { loadPrivacyDocument } from "@/lib/legal/legal-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const language = url.searchParams.get("language") ?? "en";
  try {
    const document = loadPrivacyDocument(language);
    return NextResponse.json({
      status: "PASS",
      llm_used: false,
      ...document,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load privacy policy";
    return NextResponse.json(
      { status: "FAIL", llm_used: false, error: message },
      { status: 500 },
    );
  }
}
