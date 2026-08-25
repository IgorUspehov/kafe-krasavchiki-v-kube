import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

const PRICING_PATHS = [
  path.join(process.cwd(), "artifacts/factory_output/pricing/pricing.json"),
  path.join(process.cwd(), "public/artifacts/factory_output/pricing/pricing.json"),
];

export async function GET() {
  for (const filePath of PRICING_PATHS) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const pricing = JSON.parse(content);
      return NextResponse.json(pricing);
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "pricing.json not found" }, { status: 404 });
}
