import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

const QUESTIONNAIRE_PATH = path.join(process.cwd(), "input/client_onboarding_questionnaire.json");

function readQuestionnaire(): Record<string, unknown> | null {
  if (!fs.existsSync(QUESTIONNAIRE_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(QUESTIONNAIRE_PATH, "utf8")) as Record<string, unknown>;
}

function buildReadmeContent(questionnaire: Record<string, unknown>): string {
  const businessName = String(questionnaire.business_name ?? "Client").trim() || "Client";
  const email = String(questionnaire.email ?? "").trim() || "—";
  const language = String(questionnaire.language ?? "en").trim() || "en";
  const businessType = String(questionnaire.business_type ?? "—").trim() || "—";
  const generatedAt = new Date().toISOString();

  return `# ${businessName} — Client MVP Package

Generated: ${generatedAt}

## Client
- Business: ${businessName}
- Email: ${email}
- Language: ${language}
- Business type: ${businessType}

## Package contents
- manifest.json
- ZIP archive
- README
`;
}

export async function GET() {
  const questionnaire = readQuestionnaire();
  if (!questionnaire) {
    return NextResponse.json({ ok: false, error: "Questionnaire not found" }, { status: 404 });
  }

  const content = buildReadmeContent(questionnaire);

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'inline; filename="README.md"',
    },
  });
}
