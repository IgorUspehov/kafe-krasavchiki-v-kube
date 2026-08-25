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

type NotificationEvent = "MVP_READY" | "DOWNLOAD_REMINDER" | "DOWNLOAD_CONFIRMED" | "FILES_DELETED";

type NotificationRecord = {
  notification_id: string;
  order_id: string;
  event: NotificationEvent;
  language: string;
  business_name: string;
  email: string;
  message: string;
  created_at: string;
  status: string;
};

type NotificationsResponse = {
  status: string;
  llm_used: false;
  notifications: NotificationRecord[];
  error?: string;
};

function eventBadgeVariant(event: NotificationEvent) {
  if (event === "MVP_READY") return "default" as const;
  if (event === "DOWNLOAD_CONFIRMED") return "default" as const;
  if (event === "DOWNLOAD_REMINDER") return "secondary" as const;
  return "outline" as const;
}

export function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const response = await fetch("/api/client-notifications");
        const data = (await response.json()) as NotificationsResponse;
        if (!active) {
          return;
        }
        if (data.status !== "PASS") {
          throw new Error(data.error ?? "Failed to load notifications");
        }
        setNotifications(data.notifications ?? []);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load notifications");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadNotifications();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Notifications</CardTitle>
          <CardDescription>
            Generated notification log for the client lifecycle. V1 does not send real emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {!loading && notifications.length === 0 ? (
            <Alert>
              <AlertTitle>No Notifications Yet</AlertTitle>
              <AlertDescription>
                Generate Client MVP, download a package, or run cleanup to populate the notification log.
              </AlertDescription>
            </Alert>
          ) : null}

          <Separator />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notification ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>Loading notifications...</TableCell>
                </TableRow>
              ) : (
                notifications.map((item) => (
                  <TableRow key={item.notification_id}>
                    <TableCell className="font-mono text-xs">{item.notification_id}</TableCell>
                    <TableCell className="font-mono text-xs">{item.order_id}</TableCell>
                    <TableCell>
                      <Badge variant={eventBadgeVariant(item.event)}>{item.event}</Badge>
                    </TableCell>
                    <TableCell>{item.language}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{item.created_at}</TableCell>
                    <TableCell>{item.business_name}</TableCell>
                    <TableCell>{item.email}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Refresh Notifications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
