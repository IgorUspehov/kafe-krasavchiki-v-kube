import { LocalizedPageShell } from "@/components/localized-page-shell";
import { GithubPage } from "@/pages/github-page";

export default function Page() {
  return (
    <LocalizedPageShell pageKey="github">
      <GithubPage />
    </LocalizedPageShell>
  );
}
