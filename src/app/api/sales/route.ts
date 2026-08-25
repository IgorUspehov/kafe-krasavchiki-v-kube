import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

const SALES_REPORT_PATHS = [
  path.join(process.cwd(), "artifacts/factory_output/sales/sales_report.json"),
  path.join(process.cwd(), "public/artifacts/factory_output/sales/sales_report.json"),
];

const SALES_FALLBACK_PATHS = [
  path.join(process.cwd(), "artifacts/factory_output/sales/sales.json"),
  path.join(process.cwd(), "public/artifacts/factory_output/sales/sales.json"),
];

function readFromReport(filePath: string) {
  const report = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    leads?: number;
    customers?: number;
    mrr?: number;
    arr?: number;
    revenue?: number;
    status?: string;
  };

  return NextResponse.json({
    leads: report.leads ?? 0,
    customers: report.customers ?? 0,
    mrr: report.mrr ?? 0,
    arr: report.arr ?? 0,
    revenue: report.revenue ?? 0,
    status: report.status === "SALES_READY" ? "ACTIVE" : (report.status ?? "ACTIVE"),
  });
}

function readFromSales(filePath: string) {
  const sales = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    status?: string;
    funnel?: { leads?: number; customers?: number };
    metrics?: { mrr?: number; arr?: number; revenue?: number };
  };

  return NextResponse.json({
    leads: sales.funnel?.leads ?? 0,
    customers: sales.funnel?.customers ?? 0,
    mrr: sales.metrics?.mrr ?? 0,
    arr: sales.metrics?.arr ?? 0,
    revenue: sales.metrics?.revenue ?? 0,
    status: sales.status ?? "ACTIVE",
  });
}

export async function GET() {
  for (const filePath of SALES_REPORT_PATHS) {
    if (!fs.existsSync(filePath)) continue;
    try {
      return readFromReport(filePath);
    } catch {
      continue;
    }
  }

  for (const filePath of SALES_FALLBACK_PATHS) {
    if (!fs.existsSync(filePath)) continue;
    try {
      return readFromSales(filePath);
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "sales data not found" }, { status: 404 });
}
