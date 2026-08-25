"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

type CheckStatus = "PASS" | "FAIL" | "MISSING";

type DeliveryCheck = {
  name: string;
  status: CheckStatus;
};

type DeliveryStatusResponse = {
  status: string;
  llm_used: false;
  business_name?: string;
  business_type?: string;
  language?: string;
  currency?: string;
  checks?: DeliveryCheck[];
  final_package?: string;
  quality_gate?: string;
  updated_at?: string;
  plan?: string;
  payment_status?: string;
  amount?: number;
  terms_accepted?: boolean;
  privacy_accepted?: boolean;
  accepted_at?: string | null;
  error?: string;
  package_ready?: boolean;
  package_name?: string;
  package_size?: string;
  package_timestamp?: string;
};

const REQUIRED_STATUS_CHECKS = [
  "Client Profile",
  "Full Delivery",
  "Demo Video",
  "Deploy Metadata",
  "Final Package",
  "Quality Gate",
] as const;

function statusBadgeVariant(status: CheckStatus | string) {
  if (status === "PASS") {
    return "default" as const;
  }
  if (status === "FAIL") {
    return "destructive" as const;
  }
  return "outline" as const;
}

export function ClientDeliveryStatusPage() {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<DeliveryStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/client-delivery/status");
        const data = (await response.json()) as DeliveryStatusResponse;
        if (!active) {
          return;
        }
        setStatusData(data);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load delivery status");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStatus();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <Progress value={50} className="w-full" />
          <p className="mt-3 text-sm text-muted-foreground">Loading delivery status...</p>
        </CardContent>
      </Card>
    );
  }

  const checks = statusData?.checks ?? [];
  const finalPackageStatus =
    checks.find((check) => check.name === "Final Package")?.status ?? "MISSING";
  const downloadEnabled = finalPackageStatus === "PASS";


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Delivery Status</CardTitle>
          <CardDescription>
            Review the current client delivery state after Generate Client MVP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Business Name</p>
              <p className="text-sm font-medium">{statusData?.business_name ?? "MISSING"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Business Type</p>
              <p className="text-sm font-medium">{statusData?.business_type ?? "MISSING"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Language</p>
              <p className="text-sm font-medium">{statusData?.language ?? "MISSING"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="text-sm font-medium">{statusData?.currency ?? "MISSING"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Selected Plan</p>
              <p className="text-sm font-medium">{statusData?.plan ?? "MISSING"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <Badge variant={statusBadgeVariant(statusData?.payment_status ?? "MISSING")}>
                {statusData?.payment_status ?? "MISSING"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Value</p>
              <p className="text-sm font-medium">
                {statusData?.amount ?? "MISSING"} {statusData?.currency ?? ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Terms Accepted</p>
              <Badge variant={statusBadgeVariant(statusData?.terms_accepted ? "PASS" : "MISSING")}>
                {statusData?.terms_accepted ? "YES" : "NO"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Privacy Accepted</p>
              <Badge variant={statusBadgeVariant(statusData?.privacy_accepted ? "PASS" : "MISSING")}>
                {statusData?.privacy_accepted ? "YES" : "NO"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accepted At</p>
              <p className="text-sm font-medium">{statusData?.accepted_at ?? "MISSING"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Final Package</p>
              <p className="font-mono text-xs">{statusData?.final_package ?? "MISSING"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quality Gate</p>
              <Badge variant={statusBadgeVariant(statusData?.quality_gate ?? "MISSING")}>
                {statusData?.quality_gate ?? "MISSING"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Delivery</p>
              <p className="text-sm font-medium">{statusData?.updated_at ?? "MISSING"}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Delivery Checks</h3>
            <p className="text-xs text-muted-foreground">{REQUIRED_STATUS_CHECKS.join(" · ")}</p>
            {checks.map((check) => (
              <div
                key={check.name}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <span className="text-sm font-medium">{check.name}</span>
                <Badge variant={statusBadgeVariant(check.status)}>{check.status}</Badge>
              </div>
            ))}
          </div>

          {statusData?.status === "PASS" ? (
            <Alert>
              <AlertTitle>PASS</AlertTitle>
              <AlertDescription>All delivery checks passed.</AlertDescription>
            </Alert>
          ) : null}

          {statusData?.status !== "PASS" ? (
            <Alert variant="destructive">
              <AlertTitle>{statusData?.status ?? "MISSING"}</AlertTitle>
              <AlertDescription>
                {error ?? "One or more delivery checks are not complete."}
              </AlertDescription>
            </Alert>
          ) : null}


          <Separator />

          {downloadEnabled ? (
            <Card>
              <CardHeader>
                <CardTitle>Package Ready</CardTitle>
                <CardDescription>Final client package is ready for download.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Package Name</p>
                    <p className="text-sm font-medium">{statusData?.package_name ?? "final_package.zip"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Package Size</p>
                    <p className="text-sm font-medium">{statusData?.package_size ?? "MISSING"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Package Timestamp</p>
                    <p className="text-sm font-medium">{statusData?.package_timestamp ?? "MISSING"}</p>
                  </div>
                </div>
                <Button asChild>
                  <a href="/api/client-delivery/download">Download Final Package</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button
              type="button"
              disabled={finalPackageStatus === "FAIL" || finalPackageStatus === "MISSING"}
            >
              Download Final Package
            </Button>
          )}


                    <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Refresh Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
