import { randomUUID } from "crypto";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

import { appendOrderRecord, isPackageAvailable } from "@/lib/client-orders/order-store";
import { appendNotification } from "@/lib/client-notifications/notification-store";
import { writeClientBuildStatus } from "@/lib/client-build/pipeline";

const DELIVER_COMMAND = "npm";
const DELIVER_ARGS = ["run", "client:deliver"];
const JOB_STATUS_PATH = path.join(process.cwd(), "artifacts/factory_output/job_status.json");
const DELIVERY_REPORT_PATH = path.join(
  process.cwd(),
  "artifacts/factory_output/client_one_command_delivery/delivery_report.json",
);
const FINAL_PACKAGE_PATH = path.join(process.cwd(), "output/client_delivery/final_package.zip");
const FINAL_PACKAGE_REL = "output/client_delivery/final_package.zip";

function writeJobStatus(status: "RUNNING" | "PASS" | "FAIL", error?: string) {
  const dir = path.dirname(JOB_STATUS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    JOB_STATUS_PATH,
    JSON.stringify(
      {
        status,
        started_at: status === "RUNNING" ? new Date().toISOString() : undefined,
        finished_at: status !== "RUNNING" ? new Date().toISOString() : undefined,
        error: error ?? null,
      },
      null,
      2,
    ),
  );
}

export async function POST() {
  const job_id = randomUUID();
  writeJobStatus("RUNNING");
  writeClientBuildStatus({
    status: "building",
    started_at: new Date().toISOString(),
    finished_at: undefined,
    error: undefined,
  });

  const child = spawn(DELIVER_COMMAND, DELIVER_ARGS, {
    cwd: process.cwd(),
    stdio: "pipe",
    detached: false,
  });

  child.on("close", (code) => {
    if (code === 0) {
      try {
        const report = JSON.parse(fs.readFileSync(DELIVERY_REPORT_PATH, "utf8"));
        if (report?.status === "PASS") {
          writeJobStatus("PASS");
          writeClientBuildStatus({
            status: "ready",
            finished_at: new Date().toISOString(),
            error: undefined,
          });
          const order = appendOrderRecord({
            delivery_status: "PASS",
            package_available: isPackageAvailable(),
            payment_status: "PAID",
          });
          appendNotification({
            event: "MVP_READY",
            order_id: order.order_id,
            business_name: order.business_name,
            email: order.email,
          });
          return;
        }
      } catch {
        // fall through to FAIL below
      }
      writeJobStatus("FAIL", "Report status not PASS");
      writeClientBuildStatus({
        status: "error",
        finished_at: new Date().toISOString(),
        error: "Report status not PASS",
      });
    } else {
      writeJobStatus("FAIL", `Process exited with code ${code}`);
      writeClientBuildStatus({
        status: "error",
        finished_at: new Date().toISOString(),
        error: `Process exited with code ${code}`,
      });
    }
  });

  child.on("error", (err) => {
    writeJobStatus("FAIL", err.message);
    writeClientBuildStatus({
      status: "error",
      finished_at: new Date().toISOString(),
      error: err.message,
    });
  });

  return NextResponse.json({ status: "STARTED", job_id });
}
