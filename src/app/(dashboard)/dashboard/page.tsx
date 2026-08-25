import { LocalizedPageShell } from "@/components/localized-page-shell";
import { DashboardPage } from "@/pages/dashboard-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="dashboard">
      <DashboardPage />
    </LocalizedPageShell>
  );
}
