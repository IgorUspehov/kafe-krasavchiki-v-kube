import { LocalizedPageShell } from "@/components/localized-page-shell";
import { ResearchPage } from "@/pages/research-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="research">
      <ResearchPage />
    </LocalizedPageShell>
  );
}
