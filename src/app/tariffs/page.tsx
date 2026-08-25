import { Suspense } from "react";

import { TariffChooser } from "@/components/tariff-chooser";

export default function TariffsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-slate-950 text-slate-300">
          Loading…
        </main>
      }
    >
      <TariffChooser />
    </Suspense>
  );
}
