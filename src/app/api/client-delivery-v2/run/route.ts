import { NextResponse } from "next/server";
import { execSync } from "child_process";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getCommandOutput(error: unknown, key: "stdout" | "stderr"): string {
  if (
    typeof error === "object" &&
    error !== null &&
    key in error
  ) {
    const value = (error as Record<string, unknown>)[key];
    if (Buffer.isBuffer(value)) return value.toString();
    if (typeof value === "string") return value;
  }
  return "";
}

export async function POST() {
  try {
    execSync("npm run client:deliver:v2", {
      cwd: process.cwd(),
      stdio: "pipe",
      shell: "/bin/bash",
    });

    return NextResponse.json({
      ok: true,
      status: "PASS",
      pipeline: "CLIENT_DELIVERY_V2",
      message: "CLIENT_DELIVERY_V2 pipeline completed",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        status: "FAIL",
        pipeline: "CLIENT_DELIVERY_V2",
        error: getErrorMessage(error),
        stdout: getCommandOutput(error, "stdout"),
        stderr: getCommandOutput(error, "stderr"),
      },
      { status: 500 }
    );
  }
}
