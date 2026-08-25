"use client";

import { useEffect, useState } from "react";
import {
  Download,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  Receipt,
} from "lucide-react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchClientFactorySnapshot } from "@/lib/client-factory/client-factory-artifacts";
import type { ClientFactorySnapshot } from "@/lib/client-factory/types";
import { toErrorMessage } from "@/lib/errors";

function statusVariant(status: string) {
  if (status.includes("READY") || status === "DELIVERED" || status === "ISSUED") return "default" as const;
  return "secondary" as const;
}

export function ClientFactoryDashboardPage() {
  const [snapshot, setSnapshot] = useState<ClientFactorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchClientFactorySnapshot();
        if (!cancelled) setSnapshot(data);
      } catch (err) {
        if (!cancelled) setError(toErrorMessage(err, "Failed to load client factory artifacts"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageLoader rows={5} />;
  if (error) return <ErrorBanner message={error} />;
  if (!snapshot?.dashboard) return <ErrorBanner message="Client factory dashboard not generated yet. Run: npm run client-factory:generate" />;

  const { dashboard, tracking } = snapshot;
  const widgets = dashboard.widgets;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Customer Dashboard</h1>
          <Badge variant="outline">Branch E</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {dashboard.project_name} — {dashboard.idea}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle className="text-lg">{widgets.status.current}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={widgets.status.progress_percent || tracking?.progress_percent || 0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projects</CardDescription>
            <CardTitle className="text-3xl">{widgets.projects.length}</CardTitle>
          </CardHeader>
          <CardContent><FolderKanban className="size-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Downloads</CardDescription>
            <CardTitle className="text-3xl">{widgets.downloads.length}</CardTitle>
          </CardHeader>
          <CardContent><Download className="size-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Invoices</CardDescription>
            <CardTitle className="text-3xl">{widgets.invoices.length}</CardTitle>
          </CardHeader>
          <CardContent><Receipt className="size-4 text-muted-foreground" /></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {widgets.projects.map((project) => (
              <Card key={project.name}>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="downloads">
          <Card>
            <CardHeader>
              <CardTitle>Downloads</CardTitle>
              <CardDescription>Generated artifacts available for delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artifact</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {widgets.downloads.map((item) => (
                      <TableRow key={item.path}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.path}</TableCell>
                        <TableCell><Badge variant="secondary">{item.type}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Billing and payment records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {widgets.invoices.map((invoice) => (
                <div key={invoice.invoice_id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invoice.invoice_id}</p>
                      <p className="text-sm text-muted-foreground">{invoice.client}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{invoice.amount_label}</p>
                    <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4" />
                Delivery History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {widgets.history.map((entry, index) => (
                    <TableRow key={`${entry.project_name}-${index}`}>
                      <TableCell>{entry.project_name}</TableCell>
                      <TableCell>{entry.version}</TableCell>
                      <TableCell><Badge variant={statusVariant(entry.status)}>{entry.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{entry.date.slice(0, 10)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
