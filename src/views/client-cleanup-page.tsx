"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ScheduledFile = {
  path: string;
  expires_at: string;
  expired: boolean;
};

type CleanupHistoryEntry = {
  order_id: string;
  deleted_at: string;
  deleted_files: string[];
};

type CleanupStatusResponse = {
  status: string;
  enabled: boolean;
  retention_hours: number;
  allowed_retention_hours?: number[];
  scheduled_files?: ScheduledFile[];
  cleanup_history?: CleanupHistoryEntry[];
  last_cleanup?: string | null;
  next_cleanup?: string | null;
  llm_used: false;
  error?: string;
};

export function ClientCleanupPage() {
  const [statusData, setStatusData] = useState<CleanupStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    const response = await fetch("/api/client-cleanup/status");
    const data = (await response.json()) as CleanupStatusResponse;
    setStatusData(data);
  }

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        await loadStatus();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load cleanup status");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  async function handleRunCleanup() {
    setRunning(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/client-cleanup/run", { method: "POST" });
      const data = (await response.json()) as { status?: string; deleted_files?: number; error?: string };
      if (!response.ok || data.status !== "PASS") {
        throw new Error(data.error ?? "Cleanup failed");
      }
      setMessage(`Cleanup completed. Deleted files: ${data.deleted_files ?? 0}`);
      await loadStatus();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Cleanup failed");
    } finally {
      setRunning(false);
    }
  }

  const scheduled = statusData?.scheduled_files ?? [];
  const history = statusData?.cleanup_history ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Cleanup</CardTitle>
          <CardDescription>
            Temporary deliverables are removed after retention expires. Order history and metadata remain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Retention Policy</p>
              <p className="text-sm font-medium">{statusData?.retention_hours ?? 48} hours</p>
              <p className="text-xs text-muted-foreground">
                Allowed: {(statusData?.allowed_retention_hours ?? [24, 48, 72]).join(" / ")} hours
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cleanup Enabled</p>
              <Badge variant={statusData?.enabled ? "default" : "secondary"}>
                {statusData?.enabled ? "YES" : "NO"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Cleanup Time</p>
              <p className="text-sm font-medium">{statusData?.last_cleanup ?? "Never"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Cleanup Time</p>
              <p className="text-sm font-medium">{statusData?.next_cleanup ?? "Pending"}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Files Scheduled For Cleanup</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3}>Loading scheduled files...</TableCell>
                  </TableRow>
                ) : scheduled.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>No temporary files scheduled.</TableCell>
                  </TableRow>
                ) : (
                  scheduled.map((file) => (
                    <TableRow key={file.path}>
                      <TableCell className="font-mono text-xs">{file.path}</TableCell>
                      <TableCell>{file.expires_at}</TableCell>
                      <TableCell>
                        <Badge variant={file.expired ? "destructive" : "secondary"}>
                          {file.expired ? "EXPIRED" : "WAITING"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Cleanup History</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Deleted At</TableHead>
                  <TableHead>Deleted Files</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>No cleanup history yet.</TableCell>
                  </TableRow>
                ) : (
                  history.map((entry, index) => (
                    <TableRow key={`${entry.order_id}-${entry.deleted_at}-${index}`}>
                      <TableCell className="font-mono text-xs">{entry.order_id}</TableCell>
                      <TableCell>{entry.deleted_at}</TableCell>
                      <TableCell>{entry.deleted_files.join(", ")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Button type="button" onClick={() => void handleRunCleanup()} disabled={running || loading}>
            Run Cleanup Now
          </Button>

          {message ? (
            <Alert>
              <AlertTitle>Cleanup Complete</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
