"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getDownloadUrl } from "@/lib/api";
import type { ProjectDetails } from "@/types/mvp";
import { Download, FolderTree, Loader2 } from "lucide-react";

interface ProjectDetailsProps {
  details: ProjectDetails | null;
  loading?: boolean;
  projectName?: string | null;
}

function buildFileTree(files: string[]): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const filePath of files) {
    const parts = filePath.split("/");
    if (parts.length === 1) {
      if (!seen.has(filePath)) {
        seen.add(filePath);
        lines.push(filePath);
      }
    } else {
      const dir = `${parts[0]}/`;
      if (!seen.has(dir)) {
        seen.add(dir);
        lines.push(dir);
      }
    }
  }

  return lines.sort((a, b) => {
    const aDir = a.endsWith("/");
    const bDir = b.endsWith("/");
    if (aDir !== bDir) return aDir ? -1 : 1;
    return a.localeCompare(b);
  });
}

export function ProjectDetailsBlock({
  details,
  loading,
  projectName,
}: ProjectDetailsProps) {
  const tree = details ? buildFileTree(details.files) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderTree className="size-4" />
          Project Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Загрузка структуры проекта…
          </div>
        ) : details ? (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <dt className="text-xs font-medium uppercase text-muted-foreground">
                  Project Name
                </dt>
                <dd className="mt-1 font-mono text-sm font-medium">
                  {details.project_name}
                </dd>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <dt className="text-xs font-medium uppercase text-muted-foreground">
                  Status
                </dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      details.status === "WORKING" ? "default" : "outline"
                    }
                  >
                    {details.status}
                  </Badge>
                </dd>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <dt className="text-xs font-medium uppercase text-muted-foreground">
                  ZIP
                </dt>
                <dd className="mt-1 font-mono text-sm">{details.zip}</dd>
              </div>
            </dl>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                File Tree
              </p>
              <ScrollArea className="h-48 rounded-lg border bg-muted/30">
                <div className="p-4 font-mono text-sm">
                  {tree.map((line) => (
                    <div key={line} className="leading-relaxed">
                      {line}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {details.files.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {details.files.length} files in archive
                </p>
              )}
            </div>

            <Button asChild variant="outline">
              <a
                href={getDownloadUrl(details.project_name)}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download />
                Download ZIP
              </a>
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {projectName
              ? `Нет данных для ${projectName}. Сгенерируйте MVP на вкладке Generate.`
              : "Сгенерируйте MVP на вкладке Generate, чтобы увидеть детали проекта."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
