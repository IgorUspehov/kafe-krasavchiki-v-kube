"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  FolderKanban,
  Package,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { fetchBusinessFactorySnapshot } from "@/lib/business-factory/business-factory-artifacts";
import type { BusinessFactorySnapshot } from "@/lib/business-factory/types";
import { toErrorMessage } from "@/lib/errors";

function statusVariant(status: string) {
  if (status.includes("PAID") || status.includes("ACTIVE") || status.includes("READY") || status === "OPERATIONAL") {
    return "default" as const;
  }
  return "secondary" as const;
}

export function BusinessAdminPage() {
  const [snapshot, setSnapshot] = useState<BusinessFactorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBusinessFactorySnapshot();
        if (!cancelled) setSnapshot(data);
      } catch (err) {
        if (!cancelled) setError(toErrorMessage(err, "Failed to load business factory artifacts"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageLoader rows={6} />;
  if (error) return <ErrorBanner message={error} />;
  if (!snapshot?.dashboard) {
    return <ErrorBanner message="Business factory not generated yet. Run: npm run business:generate" />;
  }

  const { dashboard } = snapshot;
  const { overview, widgets } = dashboard;
  const systemChecks = widgets.system
    ? Object.entries(widgets.system).filter(([, v]) => v).length
    : 0;
  const systemTotal = widgets.system ? Object.keys(widgets.system).length : 4;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Business Admin Panel</h1>
            <Badge variant="outline">Branch F</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {dashboard.project_name} — {dashboard.idea}
          </p>
        </div>
        <Button variant="secondary" size="sm">
          <Settings className="mr-2 size-4" />
          System {overview.system_status}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clients</CardDescription>
            <CardTitle className="text-3xl">{overview.clients_count}</CardTitle>
          </CardHeader>
          <CardContent><Building2 className="size-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projects</CardDescription>
            <CardTitle className="text-3xl">{overview.projects_count}</CardTitle>
          </CardHeader>
          <CardContent><FolderKanban className="size-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-3xl">{overview.revenue}</CardTitle>
          </CardHeader>
          <CardContent><CreditCard className="size-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>System Health</CardDescription>
            <CardTitle className="text-lg">{overview.system_status}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={Math.round((systemChecks / systemTotal) * 100)} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Clients</CardTitle>
              <CardDescription>CRM client records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {widgets.clients.map((client) => (
                    <TableRow key={client.email}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell><Badge variant={statusVariant(client.status)}>{client.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{client.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {widgets.projects.map((project) => (
                    <TableRow key={project.name}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.type}</TableCell>
                      <TableCell><Badge variant={statusVariant(project.status)}>{project.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Mock payment layer — no real providers connected</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {widgets.payments.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{payment.provider}</TableCell>
                      <TableCell className="font-medium">{payment.amount}</TableCell>
                      <TableCell><Badge variant={statusVariant(payment.status)}>{payment.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Active plan: <strong>{widgets.subscription.active_plan}</strong></p>
              <Badge variant={statusVariant(widgets.subscription.status)}>{widgets.subscription.status}</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {widgets.users.map((user) => (
                      <TableRow key={user.email}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artifacts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4" />
                Artifacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Path</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {widgets.artifacts.map((artifact) => (
                    <TableRow key={artifact.path}>
                      <TableCell className="font-medium">{artifact.name}</TableCell>
                      <TableCell className="text-muted-foreground">{artifact.path}</TableCell>
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
