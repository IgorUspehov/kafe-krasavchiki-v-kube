import { z } from "zod";

import { resolveLeadFormMode } from "@/lib/leads/niche-mode";

const langSchema = z
  .string()
  .trim()
  .min(2)
  .transform((value) => {
    const lower = value.toLowerCase();
    if (lower.startsWith("ru")) return "ru";
    if (lower.startsWith("en")) return "en";
    return "de";
  });

const themeSchema = z.object({
  primary: z.string().min(1),
  secondary: z.string().min(1),
  accent: z.string().min(1),
  hero_bg: z.string().min(1),
  text: z.string().min(1),
  border: z.string().min(1),
});

const promotionSchema = z.object({
  ru: z.string().min(1),
  de: z.string().min(1),
  en: z.string().min(1),
});

const socialLinksSchema = z
  .object({
    instagram: z.string().optional().default(""),
    facebook: z.string().optional().default(""),
    tiktok: z.string().optional().default(""),
    website: z.string().optional().default(""),
    linkedin: z.string().optional().default(""),
    other: z.string().optional().default(""),
  })
  .partial()
  .optional();

/**
 * Strict client MVP manifest used for site/CRM bake.
 * Extra keys (leadsReadSecret, scenario, demoData, …) are allowed via passthrough.
 */
export const clientManifestSchema = z
  .object({
    businessName: z.string().trim().min(1, "businessName is required"),
    ownerName: z.string().trim().min(1, "ownerName is required"),
    businessType: z.string().trim().min(1, "businessType is required"),
    niche: z.string().trim().min(1, "niche is required"),
    language: langSchema,
    city: z.string().trim().min(1, "city is required"),
    phone: z.string().trim().min(1, "phone is required"),
    email: z.string().trim().min(1, "email is required"),
    address: z.string().trim().min(1, "address is required"),
    whatsapp: z.string().optional().default(""),
    postalCode: z.string().optional().default(""),
    sectorId: z.union([z.string().trim().min(1), z.null()]).optional(),
    sector_id: z.union([z.string().trim().min(1), z.null()]).optional(),
    primaryColor: z.string().min(1),
    theme: themeSchema,
    promotion: promotionSchema,
    pages: z.array(z.string().min(1)).min(1, "pages must be a non-empty array"),
    features: z.array(z.string()).optional(),
    galleryPhotos: z.array(z.string()).optional(),
    heroPhoto: z.string().optional(),
    logo: z.string().optional().default(""),
    description: z.string().optional().default(""),
    subtitle: z.string().optional().default(""),
    socialLinks: socialLinksSchema,
    social_links: socialLinksSchema,
    workingHours: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const sector = value.sectorId ?? value.sector_id;
    if (sector === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["sectorId"],
        message: "sectorId (or sector_id) must be present (string or null)",
      });
    }

    // Cross-check form mode via explicit sector config (no substring heuristics).
    const mode = resolveLeadFormMode(
      value.businessType,
      typeof sector === "string" ? sector : null,
    );
    if (
      mode !== "appointment" &&
      mode !== "order" &&
      mode !== "reservation" &&
      mode !== "inquiry"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["businessType"],
        message: `unsupported lead form mode for businessType=${value.businessType}`,
      });
    }
  });

export type ClientManifest = z.infer<typeof clientManifestSchema>;

export type ManifestValidationResult =
  | { ok: true; data: ClientManifest }
  | { ok: false; error: string; issues: string[] };

export function formatManifestIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
}

export function validateClientManifest(input: unknown): ManifestValidationResult {
  const parsed = clientManifestSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  const issues = formatManifestIssues(parsed.error);
  return {
    ok: false,
    error: `manifest_validation_failed: ${issues.join("; ")}`,
    issues,
  };
}

/** Assert for pipeline gate — throws with a single loggable message. */
export function assertValidClientManifest(input: unknown): ClientManifest {
  const result = validateClientManifest(input);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.data;
}
