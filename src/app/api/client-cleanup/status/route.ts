import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

const CONFIG_PATH = path.join(process.cwd(), "config/client_cleanup_config.json");
const HISTORY_PATH = path.join(
  process.cwd(),
  "artifacts/factory_output/client_cleanup/cleanup_history.json",
);
const REPORT_PATH = path.join(
  process.cwd(),
  "artifacts/factory_output/client_cleanup/cleanup_report.json",
);

const DELETABLE_PATHS = [
  "output/client_delivery/final_package.zip",
  "output/final_package.zip",
  "output/client_delivery/demo.mp4",
  "output/demo.mp4",
  "output/client_delivery/screenshots",
  "artifacts/factory_output/react_ui/client_package",
  "artifacts/runtime_test/client_package_runtime",
  "output/client_delivery/apk",
  "output/client_delivery/exports",
  "output/client_delivery/build",
  "output/client_delivery/deploy_artifacts",
];

function readJson(filePath: string, fallback: unknown) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  } catch {
    return fallback;
  }
}

function buildScheduledFiles(retentionHours: number) {
  const scheduled: Array<{ path: string; expires_at: string; expired: boolean }> = [];
  for (const rel of DELETABLE_PATHS) {
    const fullPath = path.join(process.cwd(), rel);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    const stat = fs.statSync(fullPath);
    const expiresAt = new Date(stat.mtimeMs + retentionHours * 60 * 60 * 1000);
    scheduled.push({
      path: rel,
      expires_at: expiresAt.toISOString(),
      expired: Date.now() >= expiresAt.getTime(),
    });
  }
  return scheduled;
}

export async function GET() {
  try {
    const config = (readJson(CONFIG_PATH, { enabled: true, retention_hours: 48 }) ?? {}) as {
      enabled?: boolean;
      retention_hours?: number;
    };
    const history = readJson(HISTORY_PATH, []) as unknown[];
    const report = (readJson(REPORT_PATH, {}) ?? {}) as {
      last_cleanup?: string;
      next_cleanup?: string;
    };
    const retentionHours = Number(config.retention_hours ?? 48);

    return NextResponse.json({
      status: "PASS",
      enabled: config.enabled !== false,
      retention_hours: retentionHours,
      allowed_retention_hours: [24, 48, 72],
      scheduled_files: buildScheduledFiles(retentionHours),
      cleanup_history: Array.isArray(history) ? history : [],
      last_cleanup: report.last_cleanup ?? null,
      next_cleanup: report.next_cleanup ?? null,
      llm_used: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read cleanup status";
    return NextResponse.json(
      {
        status: "FAIL",
        enabled: false,
        retention_hours: 48,
        cleanup_history: [],
        llm_used: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
