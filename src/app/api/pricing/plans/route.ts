import { NextResponse } from "next/server";

import { loadPricingCatalog } from "@/lib/payment/payment-service";

export async function GET() {
  try {
    const catalog = loadPricingCatalog();
    return NextResponse.json({
      status: "PASS",
      llm_used: false,
      plans: catalog.plans,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pricing plans";
    return NextResponse.json(
      {
        status: "FAIL",
        llm_used: false,
        plans: [],
        error: message,
      },
      { status: 500 },
    );
  }
}
