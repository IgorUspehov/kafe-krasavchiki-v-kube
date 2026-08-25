import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

const FEEDBACK_DIR = path.join(process.cwd(), "docs/market_validation/v9_feedback");

type FeedbackPayload = {
  expectations_met?: string;
  liked_most?: string;
  unclear?: string;
  missing?: string;
  would_use_in_business?: string;
  would_pay?: string;
  stated_wtp?: string | number;
  business_type?: string;
  email?: string;
};

function normalizePayload(body: FeedbackPayload) {
  return {
    expectations_met: String(body.expectations_met ?? "").trim(),
    liked_most: String(body.liked_most ?? "").trim(),
    unclear: String(body.unclear ?? "").trim(),
    missing: String(body.missing ?? "").trim(),
    would_use_in_business: String(body.would_use_in_business ?? "").trim(),
    would_pay: String(body.would_pay ?? "").trim(),
    stated_wtp: String(body.stated_wtp ?? "").trim(),
    business_type: String(body.business_type ?? "").trim(),
    email: String(body.email ?? "").trim(),
  };
}

function buildFeedbackRecord(body: FeedbackPayload) {
  const payload = normalizePayload(body);
  const submittedAt = new Date().toISOString();
  const feedbackId = `fb_showcase_${submittedAt.replace(/[:.]/g, "-")}`;
  const expectationsYes =
    payload.expectations_met === "yes" || payload.expectations_met === "да";

  return {
    feedback_id: feedbackId,
    run_id: null,
    source: "v9_showcase_feedback_form",
    module: "V9_SHOWCASE",
    expectations_met: payload.expectations_met,
    client_happy: expectationsYes,
    feedback_result: expectationsYes ? "yes" : "no",
    liked_most: payload.liked_most || null,
    unclear: payload.unclear || null,
    missing: payload.missing || null,
    would_use_in_business: payload.would_use_in_business || null,
    would_pay: payload.would_pay || null,
    stated_wtp: payload.stated_wtp || null,
    business_type: payload.business_type || null,
    email: payload.email || null,
    feedback_submitted_at: submittedAt,
    llm_used: false,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeedbackPayload;
    const payload = normalizePayload(body);

    if (!payload.expectations_met) {
      return NextResponse.json(
        { ok: false, error: "expectations_met is required" },
        { status: 400 },
      );
    }

    if (!payload.would_use_in_business) {
      return NextResponse.json(
        { ok: false, error: "would_use_in_business is required" },
        { status: 400 },
      );
    }

    if (!payload.would_pay) {
      return NextResponse.json(
        { ok: false, error: "would_pay is required" },
        { status: 400 },
      );
    }

    const record = buildFeedbackRecord(body);
    fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
    const filePath = path.join(FEEDBACK_DIR, `${record.feedback_id}.json`);
    fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

    return NextResponse.json({
      ok: true,
      feedback_id: record.feedback_id,
      path: `docs/market_validation/v9_feedback/${record.feedback_id}.json`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feedback save failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
