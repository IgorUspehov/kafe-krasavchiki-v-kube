import { LocalizedPageShell } from "@/components/localized-page-shell";
import { TermsPage } from "@/pages/terms-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="terms">
      <TermsPage />
    </LocalizedPageShell>
  );
}
