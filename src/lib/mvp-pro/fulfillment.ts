import { appendNotification } from "@/lib/client-notifications/notification-store";
import { persistZipUnlocked } from "@/lib/billing/paid-tenant";
import { loadClientManifest } from "@/lib/manifest/storage";
import { LEMONSQUEEZY_VARIANT_MVP_PRO } from "@/lib/mvp-pro/constants";
import { grantMvpProEntitlement, type MvpProEntitlement } from "@/lib/mvp-pro/entitlement-store";
import { clientDistExists } from "@/lib/site-delivery/dist-store";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function resolveLanguage(manifest: Record<string, unknown> | null): "ru" | "de" | "en" {
  const language = pickString(manifest?.language).toLowerCase();
  if (language === "ru" || language === "de" || language === "en") {
    return language;
  }
  return "en";
}

async function sendDownloadEmail(entitlement: MvpProEntitlement, downloadUrl: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return false;
  }

  const subjects = {
    ru: "Ваш Deployable ZIP (€999) готов к скачиванию",
    de: "Ihr Deployable ZIP (€999) ist zum Download bereit",
    en: "Your Deployable ZIP (€999) is ready to download",
  } as const;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://webstudio-muenchen.com";
  const siteBase = siteUrl.replace(/\/$/, "");
  const id = encodeURIComponent(entitlement.clientId);
  const adminUrl = `${siteBase}/admin/login?clientId=${id}`;
  const vacanciesUrl = `${siteBase}/site/${id}/job`;
  const bookingUrl = `${siteBase}/site/${id}/booking`;

  const bodies = {
    ru: `Оплата Deployable ZIP (€999) подтверждена.\n\nСкачайте ZIP вашего сайта:\n${downloadUrl}\n\nВаши ссылки:\n• Admin (текст, контакты, фото): ${adminUrl}\n• Вакансии: ${vacanciesUrl}\n• Бронирование: ${bookingUrl}\n\nВ Admin введите email, с которым оплачивали — придёт ссылка для входа.\n\nClient ID: ${entitlement.clientId}\n\nВ архиве — статическая сборка Website + CRM для размещения на любом хостинге.`,
    de: `Zahlung für Deployable ZIP (€999) bestätigt.\n\nZIP herunterladen:\n${downloadUrl}\n\nIhre Links:\n• Admin (Texte, Kontakte, Fotos): ${adminUrl}\n• Stellen: ${vacanciesUrl}\n• Buchung: ${bookingUrl}\n\nIm Admin die E-Mail der Zahlung eingeben — Login-Link per E-Mail.\n\nKunden-ID: ${entitlement.clientId}\n\nDas Archiv enthält Ihr statisches Website + CRM-Paket für jedes Hosting.`,
    en: `Deployable ZIP (€999) payment confirmed.\n\nDownload your ZIP:\n${downloadUrl}\n\nYour links:\n• Admin (copy, contacts, photos): ${adminUrl}\n• Jobs: ${vacanciesUrl}\n• Booking: ${bookingUrl}\n\nIn Admin, enter the email used at checkout — you will receive a login link.\n\nClient ID: ${entitlement.clientId}\n\nThe archive is your static Website + CRM package for any host.`,
  } as const;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [entitlement.email],
      subject: subjects[entitlement.language],
      text: bodies[entitlement.language],
    }),
  });

  return response.ok;
}

export async function fulfillMvpProOrder(input: {
  clientId: string;
  email: string;
  orderId?: string;
  variantId?: string;
}): Promise<MvpProEntitlement> {
  const manifest = loadClientManifest(input.clientId);
  const language = resolveLanguage(manifest);
  const businessName =
    pickString(manifest?.business_name) || pickString(manifest?.businessName) || "Website + CRM";
  const businessType =
    pickString(manifest?.business_type) || pickString(manifest?.businessType) || "business";

  if (!clientDistExists(input.clientId)) {
    console.error("[mvp-pro] DIST_MISSING at fulfill — entitlement granted, download will 404 until dist exists", {
      clientId: input.clientId,
      orderId: input.orderId ?? null,
    });
  }

  const entitlement = grantMvpProEntitlement({
    clientId: input.clientId,
    email: input.email,
    language,
    businessName,
    businessType,
    orderId: input.orderId,
    variantId: input.variantId ?? LEMONSQUEEZY_VARIANT_MVP_PRO,
  });

  await persistZipUnlocked({
    clientId: input.clientId,
    email: input.email,
    orderId: input.orderId,
    source: "mvp_pro_fulfillment",
    downloadToken: entitlement.downloadToken,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://webstudio-muenchen.com";
  const downloadUrl = `${siteUrl.replace(/\/$/, "")}/api/download-zip?clientId=${encodeURIComponent(entitlement.clientId)}&token=${encodeURIComponent(entitlement.downloadToken)}`;

  const emailed = await sendDownloadEmail(entitlement, downloadUrl);

  appendNotification({
    event: "MVP_READY",
    language: entitlement.language,
    business_name: entitlement.businessName,
    email: entitlement.email,
    order_id: entitlement.orderId ?? entitlement.clientId,
  });

  console.log("[mvp-pro] fulfillment complete", {
    clientId: entitlement.clientId,
    emailed,
    downloadUrl,
    distReady: clientDistExists(input.clientId),
  });

  return entitlement;
}
