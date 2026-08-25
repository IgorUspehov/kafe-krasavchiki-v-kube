import { LocalizedPageShell } from "@/components/localized-page-shell";
import { PrivacyPage } from "@/pages/privacy-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="privacy">
      <PrivacyPage />
    </LocalizedPageShell>
  );
}
