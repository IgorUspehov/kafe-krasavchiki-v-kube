import { NextResponse } from "next/server";

import { readOrders } from "@/lib/client-orders/order-store";

export async function GET() {
  try {
    const orders = readOrders();
    return NextResponse.json({
      status: "PASS",
      llm_used: false,
      orders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read orders";
    return NextResponse.json(
      {
        status: "FAIL",
        llm_used: false,
        orders: [],
        error: message,
      },
      { status: 500 },
    );
  }
}
