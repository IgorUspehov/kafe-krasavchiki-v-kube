import { LocalizedPageShell } from "@/components/localized-page-shell";
import { ClientOrdersPage } from "@/pages/client-orders-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="clientOrders">
      <ClientOrdersPage />
    </LocalizedPageShell>
  );
}
