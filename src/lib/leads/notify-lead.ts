import { sendTelegramMessage } from "@/lib/telegram/notify";

function formatBusinessTypeLabel(businessType: string): string {
  return businessType
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatContactLine(input: {
  phone: string;
  whatsapp: string;
  telegram: string;
}): string {
  const parts = [
    input.phone ? `тел: ${input.phone}` : "",
    input.whatsapp ? `WA: ${input.whatsapp}` : "",
    input.telegram ? `TG: ${input.telegram}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "контакты не указаны";
}

export async function notifyNewLead(input: {
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  clientId: string;
}): Promise<boolean> {
  const niche = formatBusinessTypeLabel(input.businessType);
  const contacts = formatContactLine(input);
  const text = [
    "🟡 Новый лид:",
    input.businessName,
    niche,
    input.email,
    contacts,
    `clientId: ${input.clientId}`,
  ].join("\n");

  const sent = await sendTelegramMessage(text);
  console.log("[lead-notify] telegram", { clientId: input.clientId, sent });
  return sent;
}
