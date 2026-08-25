"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  Globe,
  Rocket,
  Server,
  ShieldCheck,
  Terminal,
} from "lucide-react";

import { ErrorBanner } from "@/components/error-banner";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchDeploymentSnapshot } from "@/lib/deployment-factory/deployment-factory-artifacts";
import type { DeploymentSnapshot } from "@/lib/deployment-factory/types";
import { toErrorMessage } from "@/lib/errors";

export function DeploymentFactoryPage() {
  const [snapshot, setSnapshot] = useState<DeploymentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchDeploymentSnapshot();
        if (!cancelled) setSnapshot(data);
      } catch (err) {
        if (!cancelled) setError(toErrorMessage(err, "Failed to load deployment artifacts"));
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
  if (!snapshot?.manifest) {
    return <ErrorBanner message="Deployment factory not generated yet. Run: npm run deployment:generate" />;
  }

  const { manifest, production, hosting, domain } = snapshot;
  const prodScore = production?.production_score ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Rocket className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Deployment Center</h1>
          <Badge variant="outline">Branch G</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {manifest.project_name} — {manifest.idea}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Production Score</CardDescription>
            <CardTitle className="text-3xl">{prodScore}</CardTitle>
          </CardHeader>
          <CardContent><Progress value={prodScore} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Domain</CardDescription>
            <CardTitle className="text-sm font-medium">{domain?.domain_name || "—"}</CardTitle>
          </CardHeader>
          <CardContent><Globe className="size-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hosting</CardDescription>
            <CardTitle className="text-lg">{hosting?.selected_target || "—"}</CardTitle>
          </CardHeader>
          <CardContent><Server className="size-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle>
              <Badge variant={manifest.deployment_ready ? "default" : "secondary"}>
                {manifest.deployment_ready ? "DEPLOYMENT_READY" : "PENDING"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent><ShieldCheck className="size-4 text-muted-foreground" /></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="checks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checks">Production Checks</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="scripts">Deploy Scripts</TabsTrigger>
        </TabsList>

        <TabsContent value="checks">
          <Card>
            <CardHeader>
              <CardTitle>Production Readiness</CardTitle>
              <CardDescription>
                {production?.checks_passed}/{production?.checks_total} checks passed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Path</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(production?.checks || []).map((item) => (
                    <TableRow key={item.check}>
                      <TableCell className="font-medium">{item.check}</TableCell>
                      <TableCell>
                        <Badge variant={item.passed ? "default" : "secondary"}>
                          {item.passed ? "PASS" : "FAIL"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.path}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(manifest.modules).map(([key, ready]) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">{key.replace(/_/g, " ")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={ready ? "default" : "secondary"}>{ready ? "READY" : "PENDING"}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scripts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="size-4" />
                Deployment Scripts
              </CardTitle>
              <CardDescription>Linux / Ubuntu 24.04 / Docker compatible</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["deploy.sh", "rollback.sh", "healthcheck.sh"].map((script) => (
                <div key={script} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-mono text-sm">{script}</span>
                  <Badge variant="outline">executable</Badge>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                <Cloud className="size-4" />
                Deploy URL: {domain?.deployment_url || "—"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
