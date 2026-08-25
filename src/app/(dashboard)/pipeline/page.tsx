import { LocalizedPageShell } from "@/components/localized-page-shell";
import { PipelinePage } from "@/pages/pipeline-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="pipeline">
      <PipelinePage />
    </LocalizedPageShell>
  );
}
