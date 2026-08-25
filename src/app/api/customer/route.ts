import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

const CUSTOMER_PATHS = [
  path.join(process.cwd(), "artifacts/factory_output/customer/customer_report.json"),
  path.join(process.cwd(), "public/artifacts/factory_output/customer/customer_report.json"),
];

const CUSTOMER_FALLBACK_PATHS = [
  path.join(process.cwd(), "artifacts/factory_output/customer/customer.json"),
  path.join(process.cwd(), "public/artifacts/factory_output/customer/customer.json"),
];

function readReport(filePath: string) {
  const report = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    customers_total?: number;
    active_customers?: number;
    trial_customers?: number;
    status?: string;
    plans_count?: number;
    commercial_readiness_score?: number;
  };

  return NextResponse.json({
    customers_total: report.customers_total ?? 0,
    active_customers: report.active_customers ?? 0,
    trial_customers: report.trial_customers ?? 0,
    status: report.status === "CUSTOMER_READY" ? "ACTIVE" : (report.status ?? "ACTIVE"),
  });
}

function readCustomerSummary(filePath: string) {
  const customer = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    status?: string;
    summary?: {
      customers_total?: number;
      active_customers?: number;
      trial_customers?: number;
      plans_count?: number;
    };
  };

  const summary = customer.summary ?? {};

  return NextResponse.json({
    customers_total: summary.customers_total ?? 0,
    active_customers: summary.active_customers ?? 0,
    trial_customers: summary.trial_customers ?? 0,
    status: customer.status ?? "ACTIVE",
  });
}

export async function GET() {
  for (const filePath of CUSTOMER_PATHS) {
    if (!fs.existsSync(filePath)) continue;
    try {
      return readReport(filePath);
    } catch {
      continue;
    }
  }

  for (const filePath of CUSTOMER_FALLBACK_PATHS) {
    if (!fs.existsSync(filePath)) continue;
    try {
      return readCustomerSummary(filePath);
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "customer data not found" }, { status: 404 });
}
