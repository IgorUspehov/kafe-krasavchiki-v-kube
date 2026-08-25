import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

const LICENSE_PATHS = [
  path.join(process.cwd(), "artifacts/factory_output/license/license.json"),
  path.join(process.cwd(), "public/artifacts/factory_output/license/license.json"),
];

export async function GET() {
  for (const filePath of LICENSE_PATHS) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const license = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
        license_type?: string;
        status?: string;
        commercial_use?: boolean;
      };

      return NextResponse.json({
        license_type: license.license_type ?? "ENTERPRISE",
        status: license.status ?? "ACTIVE",
        commercial_use: license.commercial_use ?? false,
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "license.json not found" }, { status: 404 });
}
