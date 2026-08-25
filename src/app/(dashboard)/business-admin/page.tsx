import { LocalizedPageShell } from "@/components/localized-page-shell";
import { BusinessAdminPage } from "@/views/business-admin-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="businessAdmin">
      <BusinessAdminPage />
    </LocalizedPageShell>
  );
}
