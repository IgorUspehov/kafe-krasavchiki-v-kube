import { Suspense } from "react";

import { ClientWizardPage } from "@/client-wizard/page";
import { RecaptchaScript } from "@/components/recaptcha-script";

export default function Page() {
  return (
    <>
      <RecaptchaScript />
      <Suspense fallback={null}>
        <ClientWizardPage />
      </Suspense>
    </>
  );
}
