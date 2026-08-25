import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

import { readDeliveryStatusProfile } from "@/lib/client-delivery/delivery-status-profile";
import { resolveJobStatusForApi } from "@/lib/client-delivery/job-status";
import { resolveClientBuildStatusForApi } from "@/lib/client-build/pipeline";
import { readAcceptanceStatus } from "@/lib/legal/legal-service";
import { readPaymentStatusResponse } from "@/lib/payment/payment-service";

type CheckStatus = "PASS" | "FAIL" | "MISSING";

const FINAL_PACKAGE_REL = "output/client_delivery/final_package.zip";
const CLIENT_PROFILE_PATHS = [
  "output/client_delivery/client_profile.json",
  "artifacts/factory_output/client_data/client_profile.json",
];
const FULL_DELIVERY_REPORT = "artifacts/factory_output/client_full_delivery/full_delivery_report.json";
const FULL_DELIVERY_PASS = "output/CLIENT_FULL_DELIVERY_ORCHESTRATOR_V1_PASS.txt";
const DEMO_VIDEO = "output/client_delivery/demo.mp4";
const DEPLOY_METADATA_PATHS = [
  "output/client_delivery/deploy_report.json",
  "artifacts/factory_output/deploy/deploy_report.json",
];
const QUALITY_GATE_PASS = "output/FINAL_V3_QUALITY_GATE_V1_PASS.txt";
const QUALITY_GATE_REPORT = "artifacts/factory_output/final_v3_quality_gate/quality_gate_report.json";
const ONE_COMMAND_REPORT = "artifacts/factory_output/client_one_command_delivery/delivery_report.json";
const DELIVERY_MANIFEST = "output/client_delivery/delivery_manifest.json";

function resolvePath(rel: string) {
  return path.join(process.cwd(), rel);
}

function safeExists(rel: string) {
  try {
    return fs.existsSync(resolvePath(rel));
  } catch {
    return false;
  }
}

function safeReadJson(rel: string): Record<string, unknown> | null {
  if (!safeExists(rel)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(resolvePath(rel), "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function filePass(rel: string): CheckStatus {
  if (!safeExists(rel)) {
    return "MISSING";
  }
  try {
    const stat = fs.statSync(resolvePath(rel));
    if (stat.isFile() && stat.size > 0) {
      return "PASS";
    }
    return "FAIL";
  } catch {
    return "MISSING";
  }
}

function reportPass(rel: string): CheckStatus {
  const data = safeReadJson(rel);
  if (!data) {
    return "MISSING";
  }
  return data.status === "PASS" ? "PASS" : "FAIL";
}

function checkClientProfile(): CheckStatus {
  for (const rel of CLIENT_PROFILE_PATHS) {
    const data = safeReadJson(rel);
    if (data && String(data.business_name ?? "").trim()) {
      return "PASS";
    }
  }
  return "MISSING";
}

function checkFullDelivery(): CheckStatus {
  const reportStatus = reportPass(FULL_DELIVERY_REPORT);
  if (reportStatus !== "MISSING") {
    return reportStatus;
  }
  return filePass(FULL_DELIVERY_PASS);
}

function checkDemoVideo(): CheckStatus {
  return filePass(DEMO_VIDEO);
}

function checkDeployMetadata(): CheckStatus {
  for (const rel of DEPLOY_METADATA_PATHS) {
    const status = filePass(rel);
    if (status === "PASS") {
      return "PASS";
    }
  }
  return "MISSING";
}

function checkFinalPackage(): CheckStatus {
  return filePass(FINAL_PACKAGE_REL);
}

function checkQualityGate(): CheckStatus {
  const passFile = filePass(QUALITY_GATE_PASS);
  if (passFile === "PASS") {
    return "PASS";
  }
  const reportStatus = reportPass(QUALITY_GATE_REPORT);
  return reportStatus === "MISSING" ? passFile : reportStatus;
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
}

function formatTimestamp(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

function readPackageMetadata() {
  if (!safeExists(FINAL_PACKAGE_REL)) {
    return {
      package_ready: false,
      package_name: "MISSING",
      package_size: "MISSING",
      package_timestamp: "MISSING",
    };
  }
  try {
    const stat = fs.statSync(resolvePath(FINAL_PACKAGE_REL));
    return {
      package_ready: stat.isFile() && stat.size > 0,
      package_name: path.basename(FINAL_PACKAGE_REL),
      package_size: formatBytes(stat.size),
      package_timestamp: formatTimestamp(stat.mtime),
    };
  } catch {
    return {
      package_ready: false,
      package_name: "MISSING",
      package_size: "MISSING",
      package_timestamp: "MISSING",
    };
  }
}

function resolveUpdatedAt() {
  const candidates = [ONE_COMMAND_REPORT, DELIVERY_MANIFEST, FINAL_PACKAGE_REL];
  for (const rel of candidates) {
    const data = safeReadJson(rel);
    if (data?.generated_at) {
      return String(data.generated_at);
    }
    if (data?.created_at) {
      return String(data.created_at);
    }
    if (safeExists(rel)) {
      try {
        return fs.statSync(resolvePath(rel)).mtime.toISOString();
      } catch {
        continue;
      }
    }
  }
  return new Date().toISOString();
}

export async function GET() {
  try {
    const checks = [
      { name: "Client Profile", status: checkClientProfile() },
      { name: "Full Delivery", status: checkFullDelivery() },
      { name: "Demo Video", status: checkDemoVideo() },
      { name: "Deploy Metadata", status: checkDeployMetadata() },
      { name: "Final Package", status: checkFinalPackage() },
      { name: "Quality Gate", status: checkQualityGate() },
    ];

    const profile = readDeliveryStatusProfile();
    const qualityGate = checks.find((check) => check.name === "Quality Gate")?.status ?? "MISSING";
    const allPass = checks.every((check) => check.status === "PASS");
    const anyFail = checks.some((check) => check.status === "FAIL");
    const overallStatus = allPass ? "PASS" : anyFail ? "FAIL" : "MISSING";
    const finalPackage = safeExists(FINAL_PACKAGE_REL) ? FINAL_PACKAGE_REL : "MISSING";

const packageMeta = readPackageMetadata();
    const payment = readPaymentStatusResponse();
    const acceptance = readAcceptanceStatus();

    const clientBuildStatus = resolveClientBuildStatusForApi();

    return NextResponse.json({
      status: overallStatus,
      client_build_status: clientBuildStatus,
      job_status: resolveJobStatusForApi(),
      llm_used: false,
      business_name: String(profile.business_name ?? "MISSING"),
      business_type: String(profile.business_type ?? "MISSING"),
      language: String(profile.language ?? "MISSING"),
      currency: String(profile.currency ?? "MISSING"),
      checks,
      final_package: finalPackage,
      quality_gate: qualityGate,
      updated_at: resolveUpdatedAt(),
      package_ready: packageMeta.package_ready,
      package_name: packageMeta.package_name,
      package_size: packageMeta.package_size,
      package_timestamp: packageMeta.package_timestamp,
      plan: payment.plan,
      payment_status: payment.payment_status,
      amount: payment.amount,
      terms_accepted: acceptance.terms_accepted,
      privacy_accepted: acceptance.privacy_accepted,
      accepted_at: acceptance.accepted_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read delivery status";
    return NextResponse.json(
      {
        status: "MISSING",
        client_build_status: resolveClientBuildStatusForApi(),
        job_status: resolveJobStatusForApi(),
        llm_used: false,
        business_name: "MISSING",
        business_type: "MISSING",
        language: "MISSING",
        currency: "MISSING",
        checks: [
          { name: "Client Profile", status: "MISSING" },
          { name: "Full Delivery", status: "MISSING" },
          { name: "Demo Video", status: "MISSING" },
          { name: "Deploy Metadata", status: "MISSING" },
          { name: "Final Package", status: "MISSING" },
          { name: "Quality Gate", status: "MISSING" },
        ],
        final_package: "MISSING",
        quality_gate: "MISSING",
        updated_at: new Date().toISOString(),
        error: message,
      },
      { status: 200 },
    );
  }
}
