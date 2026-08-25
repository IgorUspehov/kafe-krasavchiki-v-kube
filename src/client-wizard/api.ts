import type { PreviewApiResponse, ResultApiResponse } from "@/client-wizard/types";
import { SECTOR_ID_TO_BUSINESS_TYPE } from "@/lib/sector-mapping";

export const SECTOR_TO_BUSINESS_TYPE: Record<string, string> = SECTOR_ID_TO_BUSINESS_TYPE;

export const LANG_LABEL_TO_CODE: Record<string, string> = {
  English: "en",
  Deutsch: "de",
  "Русский": "ru",
};

export async function fetchPreviewLatest(): Promise<PreviewApiResponse> {
  const response = await fetch("/api/client-preview/latest");
  return (await response.json()) as PreviewApiResponse;
}

export async function fetchResultLatest(): Promise<ResultApiResponse> {
  const response = await fetch("/api/client-result/latest");
  return (await response.json()) as ResultApiResponse;
}

export type ClientBuildStatusResponse = {
  status: "idle" | "building" | "ready" | "error";
  netlify_url?: string | null;
  step?: string;
  error?: string;
  started_at?: string;
  finished_at?: string;
  business_type?: string;
};

export async function fetchBuildStatus(): Promise<ClientBuildStatusResponse> {
  const response = await fetch("/api/client-build/status");
  return (await response.json()) as ClientBuildStatusResponse;
}

export async function saveQuestionnaire(
  payload: Record<string, unknown>,
  recaptchaToken?: string | null,
): Promise<{
  ok: boolean;
  redirectUrl?: string;
  publicSiteUrl?: string;
  path?: string;
  clientId?: string;
  siteId?: string;
  siteUrl?: string;
  slug?: string;
}> {
  console.log("POST payload:", payload);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch("/api/client-questionnaire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        recaptcha_token: recaptchaToken ?? "",
      }),
      signal: controller.signal,
    });
    const data = (await response.json()) as {
      ok?: boolean;
      success?: boolean;
      redirectUrl?: string;
      publicSiteUrl?: string;
      error?: string;
      path?: string;
      clientId?: string;
      siteId?: string;
      siteUrl?: string;
      slug?: string;
    };
    if (!response.ok || !data.ok) {
      if (response.status === 429) {
        throw new Error(data.error ?? "Too many requests");
      }
      if (response.status === 403) {
        throw new Error(data.error ?? "Bot detected");
      }
      throw new Error(data.error ?? "Could not save questionnaire");
    }
    return {
      ok: true,
      redirectUrl: data.redirectUrl,
      publicSiteUrl: data.publicSiteUrl,
      path: data.path,
      clientId: data.clientId,
      siteId: data.siteId,
      siteUrl: data.siteUrl,
      slug: data.slug,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out after 120 seconds");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function buildQuestionnairePayload(input: {
  name: string;
  businessName: string;
  email: string;
  businessType: string;
  language: string;
  postalCode?: string;
  city?: string;
  address?: string;
}) {
  return {
    name: input.name,
    business_name: input.businessName,
    email: input.email,
    business_type: input.businessType,
    language: input.language,
    phone: "",
    telegram: "",
    whatsapp: "",
    postal_code: input.postalCode ?? "",
    city: input.city ?? "",
    address: input.address ?? "",
    website: "",
    logo: "assets/logo.png",
    currency: "EUR",
    plan_id: "free",
    plan: "Free",
    amount: 0,
    payment_status: "FREE",
    terms_accepted: true,
    privacy_accepted: true,
    accepted_at: new Date().toISOString(),
    working_hours: {
      monday: "09:00-18:00",
      tuesday: "09:00-18:00",
      wednesday: "09:00-18:00",
      thursday: "09:00-18:00",
      friday: "09:00-18:00",
      saturday: "10:00-15:00",
      sunday: "closed",
    },
    social_links: { instagram: "", facebook: "", tiktok: "", website: "" },
    business_questions: {},
  };
}
