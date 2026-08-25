import { NextResponse } from "next/server";

import { readPaymentStatusResponse } from "@/lib/payment/payment-service";

export async function GET() {
  try {
    const commercial = readPaymentStatusResponse();
    return NextResponse.json({
      status: "PASS",
      payment_status: commercial.payment_status,
      plan: commercial.plan,
      amount: commercial.amount,
      currency: commercial.currency,
      llm_used: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read payment status";
    return NextResponse.json(
      {
        status: "FAIL",
        payment_status: "PENDING",
        plan: "Professional",
        amount: 99,
        currency: "EUR",
        llm_used: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
