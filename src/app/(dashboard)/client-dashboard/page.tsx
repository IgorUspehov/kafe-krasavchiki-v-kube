import { LocalizedPageShell } from "@/components/localized-page-shell";
import { ClientPage } from "@/pages/client-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="client">
      <ClientPage />
    </LocalizedPageShell>
  );
}
