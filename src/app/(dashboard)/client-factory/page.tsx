import { LocalizedPageShell } from "@/components/localized-page-shell";
import { ClientFactoryDashboardPage } from "@/views/client-factory-dashboard-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="clientFactory">
      <ClientFactoryDashboardPage />
    </LocalizedPageShell>
  );
}
