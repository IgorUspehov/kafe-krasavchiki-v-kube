import { LocalizedPageShell } from "@/components/localized-page-shell";
import { ClientCleanupPage } from "@/pages/client-cleanup-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="clientCleanup">
      <ClientCleanupPage />
    </LocalizedPageShell>
  );
}
