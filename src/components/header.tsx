"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles } from "lucide-react";

interface HeaderProps {
  factoryVersion?: string | null;
  status?: string | null;
  loading?: boolean;
}

export function Header({ factoryVersion, status, loading }: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              SAAS IDEA AI MVP FACTORY
            </h1>
            <p className="text-sm text-muted-foreground">
              Research → Options → MVP → Demo Video
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {loading ? (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              API…
            </span>
          ) : factoryVersion ? (
            <Badge variant="outline">API v{factoryVersion}</Badge>
          ) : (
            <Badge variant="outline">API offline</Badge>
          )}
          {status && (
            <>
              <Separator orientation="vertical" className="hidden h-5 sm:block" />
              <Badge variant={status === "WORKING" ? "default" : "secondary"}>
                {status}
              </Badge>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
