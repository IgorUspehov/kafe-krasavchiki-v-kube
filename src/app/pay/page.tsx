import { Suspense } from "react";

import { PayPageContent } from "@/components/pay-page";

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-white text-slate-600">
          Laden…
        </main>
      }
    >
      <PayPageContent />
    </Suspense>
  );
}
