import { LocalizedPageShell } from "@/components/localized-page-shell";
import { PresentationPage } from "@/pages/presentation-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="presentation">
      <PresentationPage />
    </LocalizedPageShell>
  );
}
