import { LocalizedPageShell } from "@/components/localized-page-shell";
import { ClientNotificationsPage } from "@/pages/client-notifications-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="clientNotifications">
      <ClientNotificationsPage />
    </LocalizedPageShell>
  );
}
