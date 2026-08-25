import { LocalizedPageShell } from "@/components/localized-page-shell";
import { ClientDeliveryStatusPage } from "@/pages/client-delivery-status-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="clientDeliveryStatus">
      <ClientDeliveryStatusPage />
    </LocalizedPageShell>
  );
}
