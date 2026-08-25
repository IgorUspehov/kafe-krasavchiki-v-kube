import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(
  process.cwd(),
  "artifacts",
  "factory_output",
  "client_delivery_v2"
);

function readJson(filePath: string): unknown {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function getString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") return value;
  }
  return null;
}

function getNestedString(source: Record<string, unknown>, objectKey: string, valueKey: string): string | null {
  const nested = asRecord(source[objectKey]);
  const value = nested[valueKey];
  return typeof value === "string" ? value : null;
}

function getModules(source: Record<string, unknown>): unknown[] | Record<string, unknown> {
  const modules = source.modules || source.selected_modules || source.module_flags;
  if (Array.isArray(modules)) return modules;
  if (typeof modules === "object" && modules !== null) return modules as Record<string, unknown>;
  return [];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function GET() {
  try {
    const manifestPath = path.join(OUT_DIR, "manifest.json");
    const packagePath = path.join(OUT_DIR, "final_package.zip");

    const manifestRaw = readJson(manifestPath);
    const manifest = asRecord(manifestRaw);

    const businessName =
      getString(manifest, ["business_name"]) ||
      getNestedString(manifest, "client", "business_name") ||
      getNestedString(manifest, "questionnaire", "business_name");

    const businessType =
      getString(manifest, ["business_type"]) ||
      getNestedString(manifest, "client", "business_type") ||
      getNestedString(manifest, "questionnaire", "business_type");

    const templateId =
      getString(manifest, ["template_id", "selected_template"]) ||
      getNestedString(manifest, "template", "template_id");

    return NextResponse.json({
      ok: true,
      status: fs.existsSync(manifestPath) ? "PASS" : "WAITING",
      pipeline: "CLIENT_DELIVERY_V2",
      output_dir: OUT_DIR,
      manifest_exists: fs.existsSync(manifestPath),
      package_exists: fs.existsSync(packagePath),
      package_file: packagePath,
      business_name: businessName,
      business_type: businessType,
      template_id: templateId,
      modules: getModules(manifest),
      manifest: manifestRaw,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        status: "FAIL",
        pipeline: "CLIENT_DELIVERY_V2",
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
