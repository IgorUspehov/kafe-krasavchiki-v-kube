import type OpenAI from "openai";

import {
  assertValidClientManifest,
  formatManifestIssues,
  validateClientManifest,
  type ClientManifest,
} from "@/lib/manifest/schema";
import { z } from "zod";

const MAX_SELF_CORRECTIONS = 2;

function parseJsonObject(raw: string): Record<string, unknown> {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch (firstError) {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw firstError;
  }
}

/**
 * Ask the LLM to fix Zod validation errors on a draft manifest.
 * Returns the corrected JSON object (may still be invalid — caller re-validates).
 */
export async function requestManifestSelfCorrection(input: {
  openai: OpenAI;
  invalidManifest: Record<string, unknown>;
  questionnairePayload: Record<string, unknown>;
  zodIssues: string[];
  attempt: number;
}): Promise<Record<string, unknown>> {
  const completion = await input.openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 2000,
    messages: [
      {
        role: "system",
        content:
          "You fix invalid CRM client manifests. Return ONLY valid JSON. No markdown.",
      },
      {
        role: "user",
        content: `Attempt ${input.attempt}/${MAX_SELF_CORRECTIONS}.
Fix this manifest so it passes schema validation.

Zod errors:
${input.zodIssues.map((line) => `- ${line}`).join("\n")}

Questionnaire (source of truth for identity fields):
${JSON.stringify(
  {
    name: input.questionnairePayload.name,
    business_name: input.questionnairePayload.business_name,
    business_type: input.questionnairePayload.business_type,
    sector_id: input.questionnairePayload.sector_id,
    language: input.questionnairePayload.language,
    city: input.questionnairePayload.city,
    address: input.questionnairePayload.address,
    phone: input.questionnairePayload.phone,
    email: input.questionnairePayload.email,
    whatsapp: input.questionnairePayload.whatsapp,
  },
  null,
  2,
)}

Invalid manifest:
${JSON.stringify(input.invalidManifest, null, 2)}

Rules:
- businessType MUST equal questionnaire business_type
- niche must match the niche for that businessType
- ownerName = questionnaire name; businessName = questionnaire business_name
- language must be en, de, or ru
- Keep theme/promotion/pages if already valid; otherwise omit them so the server can refill
Return the full corrected JSON object.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return parseJsonObject(raw);
}

export { MAX_SELF_CORRECTIONS };

/**
 * Validate a normalized manifest. On failure, optionally run LLM self-correction
 * then re-normalize via `normalize` before validating again.
 */
export async function validateManifestWithOptionalCorrection(input: {
  manifest: Record<string, unknown>;
  payload: Record<string, unknown>;
  openai: OpenAI | null;
  normalize: (
    draft: Record<string, unknown>,
    payload: Record<string, unknown>,
  ) => Record<string, unknown>;
}): Promise<ClientManifest> {
  let current = input.manifest;
  let result = validateClientManifest(current);
  if (result.ok) return result.data;

  if (!input.openai) {
    throw new Error(result.error);
  }

  for (let attempt = 1; attempt <= MAX_SELF_CORRECTIONS; attempt += 1) {
    console.warn("[manifest] validation failed — self-correction", {
      attempt,
      issues: result.ok ? [] : result.issues,
    });
    try {
      const corrected = await requestManifestSelfCorrection({
        openai: input.openai,
        invalidManifest: current,
        questionnairePayload: input.payload,
        zodIssues: result.ok ? [] : result.issues,
        attempt,
      });
      current = input.normalize(corrected, input.payload);
      result = validateClientManifest(current);
      if (result.ok) {
        console.log("[manifest] self-correction succeeded", { attempt });
        return result.data;
      }
    } catch (error) {
      console.error("[manifest] self-correction call failed", {
        attempt,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw new Error(
    result.ok
      ? "manifest_validation_failed"
      : `manifest_validation_failed after ${MAX_SELF_CORRECTIONS} corrections: ${result.issues.join("; ")}`,
  );
}

export function zodErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return formatManifestIssues(error).join("; ");
  }
  return error instanceof Error ? error.message : String(error);
}

export { assertValidClientManifest, validateClientManifest };
