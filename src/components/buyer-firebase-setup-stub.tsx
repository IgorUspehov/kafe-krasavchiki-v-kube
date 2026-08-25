type BuyerFirebaseSetupStubProps = {
  nicheLabel: string;
};

/**
 * Neutral home for Deployable ZIP buyers who have not wired Firebase yet.
 * No SaaS / studio branding.
 */
export function BuyerFirebaseSetupStub({ nicheLabel }: BuyerFirebaseSetupStubProps) {
  const niche = nicheLabel.trim() || "Business";

  return (
    <main
      data-buyer-firebase-setup
      className="flex min-h-svh items-center justify-center bg-slate-50 px-6 py-16 text-slate-900"
    >
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Добро пожаловать — {niche}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          Настройте ваш Firebase и домен согласно README.md
        </p>
      </div>
    </main>
  );
}
