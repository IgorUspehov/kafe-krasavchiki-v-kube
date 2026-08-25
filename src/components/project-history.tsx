"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDownloadUrl } from "@/lib/api";
import type { ProjectHistoryEntry } from "@/types/mvp";
import { Download, History, Loader2 } from "lucide-react";

interface ProjectHistoryProps {
  entries: ProjectHistoryEntry[];
  loading?: boolean;
}

export function ProjectHistory({ entries, loading }: ProjectHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4" />
          Project History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Загрузка истории…
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No generated projects yet
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Идея</TableHead>
                <TableHead>Option</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>ZIP</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, idx) => (
                <TableRow
                  key={`${entry.timestamp}-${entry.project_name}-${idx}`}
                >
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {entry.timestamp}
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate"
                    title={entry.idea}
                  >
                    {entry.idea || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {entry.selected_option}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {entry.project_name}
                  </TableCell>
                  <TableCell>
                    <a
                      href={getDownloadUrl(entry.project_name)}
                      className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="size-3" />
                      {entry.zip}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.status === "WORKING" ? "default" : "outline"
                      }
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
