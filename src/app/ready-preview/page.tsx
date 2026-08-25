import { Suspense } from "react";

import { ReadyPreviewClient } from "./ready-preview-client";

export default function ReadyPreviewPage() {
  return (
    <Suspense fallback={<main style={{ padding: 40 }}>Loading…</main>}>
      <ReadyPreviewClient />
    </Suspense>
  );
}
