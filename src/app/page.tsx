import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BuyerFirebaseSetupStub } from "@/components/buyer-firebase-setup-stub";
import { SaasHomeLanding } from "@/components/saas-home-landing";
import { resolveBuyerFirebaseSetup } from "@/lib/deployable-zip/buyer-setup";

import manifest from "../../client-manifest.json";

export async function generateMetadata(): Promise<Metadata> {
  const setup = await resolveBuyerFirebaseSetup();
  if (!setup) {
    return {};
  }

  const title = `Добро пожаловать — ${setup.nicheLabel}`;
  return {
    title,
    description: "Настройте ваш Firebase и домен согласно README.md",
    openGraph: {
      title,
      description: "Настройте ваш Firebase и домен согласно README.md",
      images: [],
    },
    twitter: {
      card: "summary",
      title,
      description: "Настройте ваш Firebase и домен согласно README.md",
      images: [],
    },
  };
}

export default async function Page() {
  const clientId =
    typeof (manifest as { clientId?: unknown }).clientId === "string"
      ? (manifest as { clientId: string }).clientId.trim()
      : "";
  if (clientId) {
    redirect(`/site/${clientId}`);
  }

  const setup = await resolveBuyerFirebaseSetup();
  if (setup) {
    return <BuyerFirebaseSetupStub nicheLabel={setup.nicheLabel} />;
  }

  return <SaasHomeLanding />;
}
