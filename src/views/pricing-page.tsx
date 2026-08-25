"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/context";

type PricingPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
};

type PricingResponse = {
  status: string;
  llm_used: false;
  plans: PricingPlan[];
  error?: string;
};

export function PricingPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPlans() {
      try {
        const response = await fetch("/api/pricing/plans");
        const data = (await response.json()) as PricingResponse;
        if (!active) {
          return;
        }
        if (data.status !== "PASS") {
          throw new Error(data.error ?? "Failed to load pricing plans");
        }
        setPlans(data.plans ?? []);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load pricing plans");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPlans();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("pages.pricing.title")}</CardTitle>
          <CardDescription>{t("pages.pricing.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {loading ? <p className="text-sm text-muted-foreground">Loading plans...</p> : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t(`payment.plans.${plan.id}`) || plan.name}
                  </CardTitle>
                  <CardDescription>{plan.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={plan.price === 0 ? "secondary" : "default"}>
                    {plan.price} {plan.currency}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />
          <p className="text-sm text-muted-foreground">
            V1 does not process real payments. Plans are used for commercial order metadata only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
