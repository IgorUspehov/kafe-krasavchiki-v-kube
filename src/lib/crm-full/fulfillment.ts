import { provisionCrmFullClient, type ProvisionCrmFullResult } from "@/lib/firebase/provision";
import { loadClientManifest } from "@/lib/manifest/storage";
import { LEMONSQUEEZY_VARIANT_CRM_FULL } from "@/lib/crm-full/constants";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function fulfillCrmFullOrder(input: {
  clientId: string;
  email?: string;
  orderId?: string;
  variantId?: string;
}): Promise<ProvisionCrmFullResult> {
  const manifest = loadClientManifest(input.clientId);
  const businessType =
    pickString(manifest?.business_type) || pickString(manifest?.businessType) || "beauty_salon";

  const result = await provisionCrmFullClient(input.clientId, businessType);

  console.log("[crm-full] provision complete", {
    clientId: input.clientId,
    email: input.email,
    orderId: input.orderId,
    variantId: input.variantId ?? LEMONSQUEEZY_VARIANT_CRM_FULL,
    businessType: result.businessType,
    entities: result.entities,
    seededCollections: result.seededCollections,
  });

  return result;
}
