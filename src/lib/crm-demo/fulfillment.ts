import { markCrmDemoEmailSent } from "@/lib/crm-demo/delivery-status";
import { resolvePublicAppOrigin } from "@/lib/cloudflare/shared-project";
import { sendResendEmail, waitForResendDeliveryStatus } from "@/lib/email/resend";
import { buildMvpRedirectUrl, loadClientManifest } from "@/lib/manifest/storage";
import { runStorageCleanup } from "@/lib/manifest/storage-manager";
import { findPendingByClientId } from "@/lib/cloudflare/scheduler";
import { grantSiteDownloadAccess } from "@/lib/site-delivery/download-access";
import { markClientDistEmailDelivered } from "@/lib/site-delivery/dist-protection";
import { clientDistExists, resolveClientDistPath } from "@/lib/site-delivery/dist-store";

const CRM_DEMO_SUBJECT = "Your Website + CRM + Booking is ready";
const CRM_DEMO_DELIVERY_TEST_SUBJECT = "Website + CRM + Booking delivery test";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function resolveFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
}

function resolveQuestionnaireEmail(manifest: Record<string, unknown> | null): string {
  if (!manifest) {
    return "";
  }

  const topLevel = pickString(manifest.email);
  if (topLevel) {
    return topLevel;
  }

  const contacts = manifest.client_contacts as Record<string, unknown> | undefined;
  return pickString(contacts?.email);
}

function buildCrmDemoEmailText(siteUrl: string, _downloadUrl?: string): string {
  return `Hello.

Your Website + CRM + Booking subscription is active.

Website:
${siteUrl}

Admin panel:
https://webstudio-muenchen.com/admin/login

Need a downloadable static package for your own hosting?
Unlock Deployable ZIP (€999 one-time) in Admin → Integrations.

Thank you.`;
}

function buildCrmDemoDeliveryTestText(siteUrl: string, downloadUrl: string): string {
  return `Site: ${siteUrl}
Download ZIP: ${downloadUrl}`;
}

function resolveSiteBaseUrl(): string {
  // Prefer NEXT_PUBLIC_SITE_URL via resolvePublicAppOrigin — never localhost:10000.
  return resolvePublicAppOrigin();
}

function resolveDownloadUrl(clientId: string): string {
  const token = grantSiteDownloadAccess(clientId);
  return `${resolveSiteBaseUrl()}/api/download-site?clientId=${encodeURIComponent(clientId)}&token=${encodeURIComponent(token)}`;
}

type FulfillmentContext = {
  clientId: string;
  orderId?: string;
  recipient: string;
  siteUrl: string;
  distPath: string;
  distReady: boolean;
};

async function sendAndVerifyResendEmail(input: {
  clientId: string;
  orderId?: string;
  recipient: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<{
  emailSent: boolean;
  resendEmailId?: string;
  resendStatus?: string;
  resendResponse?: {
    httpStatus?: number;
    body?: string;
    error?: string;
    errorName?: string;
    errorMessage?: string;
  };
  error?: string;
}> {
  const resendResult = await sendResendEmail({
    from: resolveFromAddress(),
    to: input.recipient,
    subject: input.subject,
    text: input.text,
    attachments: input.attachments,
    logPrefix: "[crm-demo] resend",
  });

  const resendResponse = {
    httpStatus: resendResult.status,
    body: resendResult.body,
    error: resendResult.error,
    errorName: resendResult.errorName,
    errorMessage: resendResult.errorMessage,
  };

  console.log("[crm-demo] resend response=", {
    ok: resendResult.ok,
    emailId: resendResult.emailId ?? null,
    ...resendResponse,
    from: resendResult.from ?? null,
    to: resendResult.to ?? null,
  });

  if (!resendResult.ok || !resendResult.emailId) {
    console.error("[crm-demo] EMAIL_SENT=false", {
      clientId: input.clientId,
      orderId: input.orderId,
      recipient: input.recipient,
      ...resendResponse,
    });
    return {
      emailSent: false,
      resendResponse,
      error: resendResult.error ?? "RESEND_FAILED",
    };
  }

  const deliveryStatus = await waitForResendDeliveryStatus(resendResult.emailId, {
    logPrefix: "[crm-demo] resend",
    attempts: 6,
    delayMs: 3000,
  });
  console.log("[crm-demo] resend delivery status=", {
    clientId: input.clientId,
    emailId: resendResult.emailId,
    lastEvent: deliveryStatus.lastEvent ?? null,
    recipient: deliveryStatus.recipient ?? input.recipient,
    httpStatus: deliveryStatus.status ?? null,
    body: deliveryStatus.body ?? null,
    error: deliveryStatus.error ?? null,
  });

  const blockedEvents = new Set(["bounced", "failed", "suppressed", "complained"]);
  const lastEvent = pickString(deliveryStatus.lastEvent).toLowerCase();
  if (!deliveryStatus.ok || !lastEvent) {
    console.error("[crm-demo] EMAIL_SENT=false", {
      clientId: input.clientId,
      orderId: input.orderId,
      recipient: input.recipient,
      resendEmailId: resendResult.emailId,
      resendStatus: deliveryStatus.lastEvent ?? null,
      reason: deliveryStatus.error ?? "RESEND_STATUS_UNKNOWN",
    });
    return {
      emailSent: false,
      resendEmailId: resendResult.emailId,
      resendStatus: deliveryStatus.lastEvent,
      resendResponse,
      error: deliveryStatus.error ?? "RESEND_STATUS_UNKNOWN",
    };
  }

  if (blockedEvents.has(lastEvent)) {
    console.error("[crm-demo] EMAIL_SENT=false", {
      clientId: input.clientId,
      orderId: input.orderId,
      recipient: input.recipient,
      resendEmailId: resendResult.emailId,
      resendStatus: deliveryStatus.lastEvent,
      reason: "RESEND_DELIVERY_FAILED",
    });
    return {
      emailSent: false,
      resendEmailId: resendResult.emailId,
      resendStatus: deliveryStatus.lastEvent,
      resendResponse,
      error: `RESEND_DELIVERY_${lastEvent.toUpperCase()}`,
    };
  }

  if (lastEvent !== "delivered") {
    console.error("[crm-demo] EMAIL_SENT=false", {
      clientId: input.clientId,
      orderId: input.orderId,
      recipient: input.recipient,
      resendEmailId: resendResult.emailId,
      resendStatus: deliveryStatus.lastEvent,
      reason: `RESEND_DELIVERY_${lastEvent.toUpperCase()}`,
    });
    return {
      emailSent: false,
      resendEmailId: resendResult.emailId,
      resendStatus: deliveryStatus.lastEvent,
      resendResponse,
      error: `RESEND_DELIVERY_${lastEvent.toUpperCase()}`,
    };
  }

  console.log("[crm-demo] EMAIL_SENT=true", {
    clientId: input.clientId,
    orderId: input.orderId,
    recipient: input.recipient,
    resendEmailId: resendResult.emailId,
    resendStatus: deliveryStatus.lastEvent ?? "queued",
  });

  return {
    emailSent: true,
    resendEmailId: resendResult.emailId,
    resendStatus: deliveryStatus.lastEvent ?? "queued",
    resendResponse,
  };
}

function resolveFulfillmentContext(input: {
  clientId: string;
  email?: string;
  orderId?: string;
}): {
  context?: FulfillmentContext;
  error?: string;
  siteUrl?: string;
  distReady: boolean;
  zipAttached: boolean;
  recipient?: string;
} {
  const manifest = loadClientManifest(input.clientId);
  const manifestEmail = resolveQuestionnaireEmail(manifest as Record<string, unknown> | null);
  const polarEmail = pickString(input.email);
  const recipient = manifestEmail || polarEmail;

  const pending = findPendingByClientId(input.clientId);
  const siteUrl = pending?.siteUrl
    ? buildMvpRedirectUrl(pending.siteUrl, input.clientId)
    : undefined;
  const distPath = resolveClientDistPath(input.clientId);
  const distReady = clientDistExists(input.clientId);

  console.log("[crm-demo] clientId=", input.clientId);
  console.log("[crm-demo] recipient=", recipient || "(empty)");
  console.log("[crm-demo] recipientSource=", manifestEmail ? "manifest.email" : polarEmail ? "polar.checkout" : "none");
  console.log("[crm-demo] siteUrl=", siteUrl ?? "(missing)");
  console.log("[crm-demo] pendingSiteUrl=", pending?.siteUrl ?? "(missing)");
  console.log("[crm-demo] distPath=", distPath);
  console.log("[crm-demo] distExists=", distReady);

  if (!recipient) {
    console.error("[crm-demo] EMAIL_MISSING", {
      clientId: input.clientId,
      orderId: input.orderId,
      manifestEmail: manifestEmail || null,
      polarEmail: polarEmail || null,
    });
    return { error: "EMAIL_MISSING", siteUrl, distReady, zipAttached: false };
  }

  if (!siteUrl) {
    console.error("[crm-demo] SITE_URL_MISSING", {
      clientId: input.clientId,
      orderId: input.orderId,
      pendingFound: Boolean(pending),
    });
    return { error: "SITE_URL_MISSING", distReady, zipAttached: false, recipient };
  }

  return {
    context: {
      clientId: input.clientId,
      orderId: input.orderId,
      recipient,
      siteUrl,
      distPath,
      distReady,
    },
    distReady,
    zipAttached: false,
    recipient,
    siteUrl,
  };
}

export async function fulfillCrmDemoDeliveryTest(input: {
  clientId: string;
  email?: string;
  orderId?: string;
}): Promise<{
  emailed: boolean;
  emailSent: boolean;
  siteUrl?: string;
  downloadUrl?: string;
  distReady: boolean;
  zipAttached: boolean;
  recipient?: string;
  resendEmailId?: string;
  resendStatus?: string;
  resendResponse?: {
    httpStatus?: number;
    body?: string;
    error?: string;
    errorName?: string;
    errorMessage?: string;
  };
  error?: string;
}> {
  console.log("[crm-demo] delivery test start", {
    clientId: input.clientId,
    orderId: input.orderId ?? null,
    polarEmail: pickString(input.email) || null,
  });

  const resolved = resolveFulfillmentContext(input);
  if (!resolved.context) {
    return {
      emailed: false,
      emailSent: false,
      siteUrl: resolved.siteUrl,
      distReady: resolved.distReady,
      zipAttached: false,
      recipient: resolved.recipient,
      error: resolved.error,
    };
  }

  if (!resolved.context.distReady) {
    console.error("[crm-demo] DIST_MISSING", {
      clientId: resolved.context.clientId,
      orderId: resolved.context.orderId,
      distPath: resolved.context.distPath,
    });
  }

  const downloadUrl = resolved.context.distReady
    ? resolveDownloadUrl(resolved.context.clientId)
    : undefined;
  const sendResult = await sendAndVerifyResendEmail({
    clientId: resolved.context.clientId,
    orderId: resolved.context.orderId,
    recipient: resolved.context.recipient,
    subject: CRM_DEMO_DELIVERY_TEST_SUBJECT,
    text: buildCrmDemoDeliveryTestText(
      resolved.context.siteUrl,
      downloadUrl ?? "(download unavailable — site files not ready)",
    ),
  });

  if (sendResult.emailSent && resolved.context.distReady) {
    markClientDistEmailDelivered(resolved.context.clientId);
  }

  return {
    emailed: sendResult.emailSent,
    emailSent: sendResult.emailSent,
    siteUrl: resolved.context.siteUrl,
    downloadUrl,
    distReady: resolved.context.distReady,
    zipAttached: false,
    recipient: resolved.context.recipient,
    resendEmailId: sendResult.resendEmailId,
    resendStatus: sendResult.resendStatus,
    resendResponse: sendResult.resendResponse,
    error: sendResult.error,
  };
}

export async function fulfillCrmDemoOrder(input: {
  clientId: string;
  email?: string;
  orderId?: string;
}): Promise<{
  emailed: boolean;
  emailSent: boolean;
  siteUrl?: string;
  distReady: boolean;
  zipAttached: boolean;
  recipient?: string;
  resendEmailId?: string;
  resendStatus?: string;
  resendResponse?: {
    httpStatus?: number;
    body?: string;
    error?: string;
    errorName?: string;
    errorMessage?: string;
  };
  error?: string;
}> {
  console.log("[crm-demo] fulfillment start", {
    clientId: input.clientId,
    orderId: input.orderId ?? null,
    polarEmail: pickString(input.email) || null,
    resendApiKeyConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    resendFromConfigured: Boolean(process.env.RESEND_FROM_EMAIL?.trim()),
  });

  const resolved = resolveFulfillmentContext(input);
  if (!resolved.context) {
    return {
      emailed: false,
      emailSent: false,
      siteUrl: resolved.siteUrl,
      distReady: resolved.distReady,
      zipAttached: false,
      recipient: resolved.recipient,
      error: resolved.error,
    };
  }

  const { context } = resolved;
  if (!context.distReady) {
    console.error("[crm-demo] DIST_MISSING", {
      clientId: context.clientId,
      orderId: context.orderId,
      distPath: context.distPath,
    });
  }

  const downloadUrl = context.distReady ? resolveDownloadUrl(context.clientId) : undefined;

  console.log("[crm-demo] resend start", {
    clientId: context.clientId,
    recipient: context.recipient,
    from: resolveFromAddress(),
    zipAttached: false,
    downloadUrl: downloadUrl ?? null,
    resendApiKeyConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
  });

  let sendResult;
  try {
    sendResult = await sendAndVerifyResendEmail({
      clientId: context.clientId,
      orderId: context.orderId,
      recipient: context.recipient,
      subject: CRM_DEMO_SUBJECT,
      text: buildCrmDemoEmailText(context.siteUrl, downloadUrl),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[crm-demo] resend threw", {
      clientId: context.clientId,
      orderId: context.orderId,
      recipient: context.recipient,
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.log("[crm-demo] EMAIL_SENT=false");
    return {
      emailed: false,
      emailSent: false,
      siteUrl: context.siteUrl,
      distReady: context.distReady,
      zipAttached: false,
      recipient: context.recipient,
      error: message,
    };
  }

  if (!sendResult.emailSent) {
    return {
      emailed: false,
      emailSent: false,
      siteUrl: context.siteUrl,
      distReady: context.distReady,
      zipAttached: false,
      recipient: context.recipient,
      resendEmailId: sendResult.resendEmailId,
      resendStatus: sendResult.resendStatus,
      resendResponse: sendResult.resendResponse,
      error: sendResult.error ?? "RESEND_FAILED",
    };
  }

  markCrmDemoEmailSent({
    clientId: context.clientId,
    recipient: context.recipient,
    siteUrl: context.siteUrl,
    orderId: context.orderId,
    zipAttached: false,
  });

  if (context.distReady) {
    markClientDistEmailDelivered(context.clientId);
  }

  runStorageCleanup();

  return {
    emailed: true,
    emailSent: true,
    siteUrl: context.siteUrl,
    distReady: context.distReady,
    zipAttached: false,
    recipient: context.recipient,
    resendEmailId: sendResult.resendEmailId,
    resendStatus: sendResult.resendStatus,
    resendResponse: sendResult.resendResponse,
  };
}
