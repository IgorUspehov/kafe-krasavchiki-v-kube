import { LocalizedPageShell } from "@/components/localized-page-shell";
import { OptionsPage } from "@/pages/options-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="options">
      <OptionsPage />
    </LocalizedPageShell>
  );
}
