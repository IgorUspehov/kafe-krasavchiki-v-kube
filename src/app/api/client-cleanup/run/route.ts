import { execSync } from "child_process";

import { NextResponse } from "next/server";

export async function POST() {
  try {
    execSync("npm run client-cleanup:run", {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe",
    });
    const fs = await import("fs");
    const path = await import("path");
    const reportPath = path.join(process.cwd(), "artifacts/factory_output/client_cleanup/cleanup_report.json");
    let deletedFiles = 0;
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as { deleted_files?: number };
      deletedFiles = report.deleted_files ?? 0;
    }
    return NextResponse.json({
      status: "PASS",
      deleted_files: deletedFiles,
      llm_used: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cleanup failed";
    return NextResponse.json(
      {
        status: "FAIL",
        deleted_files: 0,
        llm_used: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
