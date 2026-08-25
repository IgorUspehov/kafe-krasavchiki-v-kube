/**
 * Extension point for admin notifications on public-site leads.
 * Email / Telegram / WhatsApp wiring comes later — currently logs only.
 */
export async function notifyNewLead(input: {
  clientId: string;
  businessName: string;
  businessType: string;
  name: string;
  phone: string;
  service?: string;
  mode: string;
  bookingId?: string;
  orderId?: string;
}): Promise<void> {
  console.log("[notifyNewLead] site form lead", {
    clientId: input.clientId,
    businessName: input.businessName,
    businessType: input.businessType,
    name: input.name,
    phone: input.phone,
    service: input.service || null,
    mode: input.mode,
    bookingId: input.bookingId || null,
    orderId: input.orderId || null,
  });
}
