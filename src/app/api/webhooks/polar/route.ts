import { Webhooks } from "@polar-sh/nextjs";

import { markTenantPaid, persistTenantPaid, persistZipUnlocked } from "@/lib/billing/paid-tenant";
import { fulfillCrmDemoOrder } from "@/lib/crm-demo/fulfillment";
import { fulfillCrmFullOrder } from "@/lib/crm-full/fulfillment";
import { fulfillMvpProOrder } from "@/lib/mvp-pro/fulfillment";
import {
  isPolarCheckoutSucceeded,
  resolveOrderClientId,
  resolveOrderEmail,
  resolveOrderId,
} from "@/lib/polar/order-context";
import { mergePolarOrderContext, resolvePolarClientId } from "@/lib/polar/hydrate-checkout";
import {
  resolvePolarProductKind,
  shouldUnlockDeployableZipFromPayload,
} from "@/lib/polar/product-match";
import { fulfillPaidSiteDelivery } from "@/lib/site-delivery/post-payment-email";
import { saveCheckoutReference } from "@/lib/polar/checkout-reference-store";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function applyPolarPaid(input: {
  clientId: string;
  email?: string;
  orderId?: string;
  source: string;
}): Promise<void> {
  markTenantPaid(input.clientId);
  await persistTenantPaid({
    clientId: input.clientId,
    email: input.email,
    orderId: input.orderId,
    source: input.source,
  });
}

async function unlockDeployableZip(input: {
  clientId: string;
  email?: string;
  orderId?: string;
  variantId: string;
}): Promise<void> {
  await persistZipUnlocked({
    clientId: input.clientId,
    email: input.email,
    orderId: input.orderId,
    source: "polar",
  });
  await fulfillMvpProOrder({
    clientId: input.clientId,
    email: input.email || "",
    orderId: input.orderId,
    variantId: input.variantId,
  });
  console.log("[polar] zip_unlocked persisted", {
    clientId: input.clientId,
    orderId: input.orderId ?? null,
  });
}

function mergeCheckoutContext(
  primary: Record<string, unknown>,
  checkout: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!checkout) return primary;
  return { ...primary, checkout };
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const data = payload.data as Record<string, unknown>;
    console.log("[polar] webhook received", {
      type: payload.type,
      id: pickString(data.id) || null,
      checkoutId: pickString(data.checkoutId) || pickString(data.checkout_id) || null,
      status: pickString(data.status) || null,
      clientIdHint: resolveOrderClientId(data) || null,
    });
  },
  onCheckoutCreated: async (payload) => {
    const checkout = payload.data as Record<string, unknown>;
    const checkoutId = pickString(checkout.id);
    const clientId = await resolvePolarClientId(checkout);
    if (checkoutId && clientId) {
      saveCheckoutReference(checkoutId, clientId);
      console.log("[polar] checkout.created reference saved", { checkoutId, clientId });
    }
  },
  onCheckoutUpdated: async (payload) => {
    const checkout = payload.data as Record<string, unknown>;
    const checkoutId = pickString(checkout.id);
    const metadataClientId = pickString(
      (checkout.metadata as Record<string, unknown> | undefined)?.client_id,
    );
    const clientId =
      metadataClientId || (await resolvePolarClientId(checkout));
    const email = resolveOrderEmail(checkout);
    const context = checkout;
    const { kind, productId, productName } = resolvePolarProductKind(context);

    if (checkoutId && clientId) {
      saveCheckoutReference(checkoutId, clientId);
      console.log("[polar] checkout.updated reference saved", {
        checkoutId,
        clientId,
        metadataClientId: metadataClientId || null,
        status: checkout.status ?? null,
      });
    } else if (checkoutId) {
      console.warn("[polar] checkout.updated missing clientId", {
        checkoutId,
        status: checkout.status ?? null,
        metadata: checkout.metadata ?? null,
        externalCustomerId: checkout.externalCustomerId ?? checkout.external_customer_id ?? null,
      });
    }

    if (clientId && isPolarCheckoutSucceeded(checkout)) {
      console.log("[polar] checkout succeeded — marking tenant paid", { checkoutId, clientId });
      await applyPolarPaid({
        clientId,
        email,
        orderId: checkoutId || undefined,
        source: "polar_checkout",
      });

      if (shouldUnlockDeployableZipFromPayload(context)) {
        console.log("[polar] checkout.updated — unlocking Deployable ZIP", {
          checkoutId,
          clientId,
          productId,
          productKind: kind,
          productName,
        });
        try {
          await unlockDeployableZip({
            clientId,
            email,
            orderId: checkoutId || undefined,
            variantId:
              kind === "deployable_zip"
                ? "polar_deployable_zip"
                : kind === "recurring"
                  ? "polar_recurring"
                  : "polar_crm_full",
          });
        } catch (error) {
          console.error("[polar] checkout.updated ZIP unlock failed", {
            clientId,
            checkoutId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } else {
        console.warn("[polar] checkout succeeded — ZIP unlock skipped", {
          checkoutId,
          clientId,
          productId,
          productKind: kind,
          productName,
        });
      }
    }
  },
  onOrderPaid: async (payload) => {
    const order = payload.data as Record<string, unknown>;
    const { clientId: mergedClientId, checkout } = await mergePolarOrderContext(order);
    const clientId = mergedClientId || (await resolvePolarClientId(order));
    const context = mergeCheckoutContext(order, checkout);
    const { kind, productId, productName } = resolvePolarProductKind(context);
    const email = resolveOrderEmail(context) || resolveOrderEmail(order);
    const orderId = resolveOrderId(order);
    const checkoutId =
      pickString(order.checkoutId) ||
      pickString(order.checkout_id) ||
      pickString(checkout?.id) ||
      null;

    const metadataClientId =
      pickString((order.metadata as Record<string, unknown> | undefined)?.client_id) ||
      pickString((checkout?.metadata as Record<string, unknown> | undefined)?.client_id) ||
      null;

    console.log("[polar] order.paid received", {
      orderId,
      checkoutId,
      clientId,
      metadataClientId,
      email: email || null,
      productId: productId || null,
      productName: productName || null,
      productKind: kind,
      hydratedCheckout: Boolean(checkout),
    });

    if (metadataClientId && clientId && metadataClientId !== clientId) {
      console.warn("[polar] order.paid clientId mismatch — preferring metadata.client_id", {
        resolvedClientId: clientId,
        metadataClientId,
        orderId,
        checkoutId,
      });
    }

    const unlockClientId = metadataClientId || clientId;

    if (checkoutId && unlockClientId) {
      saveCheckoutReference(checkoutId, unlockClientId);
    }

    if (!unlockClientId) {
      console.error("[polar] order.paid missing clientId/reference_id", {
        orderId,
        checkoutId,
        productId,
        productName,
        productKind: kind,
        metadata: order.metadata ?? null,
        checkoutMetadata: checkout?.metadata ?? null,
      });
      return;
    }

    await applyPolarPaid({
      clientId: unlockClientId,
      email,
      orderId,
      source: "polar_order",
    });

    try {
      if (shouldUnlockDeployableZipFromPayload(context)) {
        await unlockDeployableZip({
          clientId: unlockClientId,
          email,
          orderId,
          variantId:
            kind === "deployable_zip"
              ? "polar_deployable_zip"
              : kind === "recurring"
                ? "polar_recurring"
                : "polar_crm_full",
        });

        if (kind === "crm_full") {
          try {
            await fulfillCrmFullOrder({
              clientId: unlockClientId,
              email,
              orderId,
              variantId: "polar_crm_full",
            });
          } catch (provisionError) {
            console.error("[polar] crm_full provision failed (ZIP already granted)", {
              clientId: unlockClientId,
              orderId,
              error: provisionError instanceof Error ? provisionError.message : String(provisionError),
            });
          }
        }
        return;
      }

      if (kind === "crm_demo") {
        console.log("[polar] routing to fulfillCrmDemoOrder", {
          clientId: unlockClientId,
          email,
          orderId,
        });
        const delivery = await fulfillCrmDemoOrder({
          clientId: unlockClientId,
          email,
          orderId,
        });
        console.log("[polar] fulfillCrmDemoOrder result", {
          clientId: unlockClientId,
          orderId,
          ...delivery,
        });
        return;
      }

      console.error("[polar] unknown product on order.paid — no ZIP unlock", {
        productName,
        productId,
        clientId: unlockClientId,
        orderId,
        amount: order.amount ?? order.total_amount ?? null,
      });
      await fulfillPaidSiteDelivery({
        clientId: unlockClientId,
        email,
        orderId,
        productName,
      });
    } catch (error) {
      console.error("[polar] order.paid handler failed", {
        clientId: unlockClientId,
        orderId,
        productName,
        productId,
        productKind: kind,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  },
});
