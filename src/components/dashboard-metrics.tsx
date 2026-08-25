"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardMetrics } from "@/types/mvp";
import { Archive, FolderKanban, Loader2, Package, Sparkles } from "lucide-react";

interface DashboardMetricsProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  mono?: boolean;
}

function StatCard({ label, value, icon, mono }: StatCardProps) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={`text-xl font-semibold leading-tight sm:text-2xl ${
              mono ? "truncate font-mono text-base sm:text-lg" : ""
            }`}
            title={typeof value === "string" ? value : undefined}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardMetricsBlock({
  metrics,
  loading,
}: DashboardMetricsProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Загрузка метрик…
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Projects"
        value={metrics.total_projects}
        icon={<FolderKanban className="size-5" />}
      />
      <StatCard
        label="ZIP Files"
        value={metrics.total_zip_files}
        icon={<Archive className="size-5" />}
      />
      <StatCard
        label="Last Project"
        value={metrics.last_project || "—"}
        icon={<Package className="size-5" />}
        mono
      />
      <StatCard
        label="Version"
        value={metrics.factory_version}
        icon={<Sparkles className="size-5" />}
      />
    </section>
  );
}
