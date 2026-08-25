import { LocalizedPageShell } from "@/components/localized-page-shell";
import { ReleasePage } from "@/pages/release-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="release">
      <ReleasePage />
    </LocalizedPageShell>
  );
}
