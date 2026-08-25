import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

const COMMERCIAL_REPORT_PATHS = [
  path.join(process.cwd(), "artifacts/factory_output/commercial/commercial_report.json"),
  path.join(process.cwd(), "public/artifacts/factory_output/commercial/commercial_report.json"),
];

const COMMERCIAL_FALLBACK_PATHS = [
  path.join(process.cwd(), "artifacts/factory_output/commercial/commercial.json"),
  path.join(process.cwd(), "public/artifacts/factory_output/commercial/commercial.json"),
];

type CommercialReportData = {
  status?: string;
  billing_status?: string;
  subscription_status?: string;
  pricing_status?: string;
  license_status?: string;
  customer_status?: string;
  sales_status?: string;
  commercial_readiness_score?: number;
  modules_completed?: number;
  modules_total?: number;
  revenue_models_count?: number;
  pricing_plans_count?: number;
  customers_count?: number;
  active_customers?: number;
  conversion_rate?: number;
  mrr?: number;
  arr?: number;
  summary?: CommercialReportData;
  modules?: {
    billing?: { status?: string };
    subscription?: { status?: string };
    pricing?: { status?: string };
    license?: { status?: string };
    customer?: { status?: string };
    sales?: { status?: string };
  };
};

function toApiResponse(data: CommercialReportData, statusOverride?: string) {
  const summary = data.summary ?? data;
  const modules = data.modules ?? {};

  return {
    status:
      statusOverride ??
      (data.status === "COMMERCIAL_READY" ? "ACTIVE" : data.status ?? "PENDING"),
    commercial_readiness_score: summary.commercial_readiness_score ?? 0,
    modules_completed: summary.modules_completed ?? 0,
    modules_total: summary.modules_total ?? 6,
    billing_status: data.billing_status ?? modules.billing?.status ?? "PENDING",
    subscription_status: data.subscription_status ?? modules.subscription?.status ?? "PENDING",
    pricing_status: data.pricing_status ?? modules.pricing?.status ?? "PENDING",
    license_status: data.license_status ?? modules.license?.status ?? "PENDING",
    customer_status: data.customer_status ?? modules.customer?.status ?? "PENDING",
    sales_status: data.sales_status ?? modules.sales?.status ?? "PENDING",
    revenue_models_count: summary.revenue_models_count ?? 0,
    pricing_plans_count: summary.pricing_plans_count ?? 0,
    customers_count: summary.customers_count ?? 0,
    active_customers: summary.active_customers ?? 0,
    conversion_rate: summary.conversion_rate ?? 0,
    mrr: summary.mrr ?? 0,
    arr: summary.arr ?? 0,
  };
}

export async function GET() {
  for (const filePath of COMMERCIAL_REPORT_PATHS) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const report = JSON.parse(fs.readFileSync(filePath, "utf8")) as CommercialReportData;
      return NextResponse.json(toApiResponse(report, report.status === "COMMERCIAL_READY" ? "ACTIVE" : undefined));
    } catch {
      continue;
    }
  }

  for (const filePath of COMMERCIAL_FALLBACK_PATHS) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const commercial = JSON.parse(fs.readFileSync(filePath, "utf8")) as CommercialReportData;
      return NextResponse.json(toApiResponse(commercial, commercial.status ?? "PENDING"));
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "commercial data not found" }, { status: 404 });
}
