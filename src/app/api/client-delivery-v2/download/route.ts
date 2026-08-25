import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const packagePath = path.join(
    process.cwd(),
    "artifacts",
    "factory_output",
    "client_delivery_v2",
    "final_package.zip"
  );

  if (!fs.existsSync(packagePath)) {
    return NextResponse.json(
      {
        ok: false,
        status: "FAIL",
        error: "final_package.zip not found",
        package_file: packagePath,
      },
      { status: 404 }
    );
  }

  const file = fs.readFileSync(packagePath);

  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="final_package.zip"',
    },
  });
}
