"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { JobStatus } from "@/types/mvp";
import { Clock, Loader2 } from "lucide-react";

interface JobStatusProps {
  job: JobStatus | null;
  loading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

export function JobStatusBlock({ job, loading }: JobStatusProps) {
  if (!job && !loading) {
    return null;
  }

  const progress = job?.progress ?? 0;
  const status = job?.status ?? "QUEUED";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4" />
          Job Status
        </CardTitle>
        {job?.job_id && (
          <p className="font-mono text-xs text-muted-foreground">
            {job.job_id}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !job ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Запуск задачи…
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  status === "COMPLETED"
                    ? "default"
                    : status === "FAILED"
                      ? "outline"
                      : "secondary"
                }
              >
                {STATUS_LABELS[status] ?? status}
              </Badge>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress
              value={Math.min(100, Math.max(0, progress))}
              className="h-2"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
