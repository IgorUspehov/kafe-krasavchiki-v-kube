import { Suspense } from "react";

import { SuccessPageContent } from "@/components/success-page";

export default function SuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-svh bg-white" />}>
      <SuccessPageContent />
    </Suspense>
  );
}
