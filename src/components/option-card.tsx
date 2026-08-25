"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MvpOption } from "@/types/mvp";
import { CheckCircle2, Loader2 } from "lucide-react";

interface OptionCardProps {
  option: MvpOption;
  selected: boolean;
  loading?: boolean;
  onSelect: () => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

export function OptionCard({
  option,
  selected,
  loading = false,
  onSelect,
}: OptionCardProps) {
  return (
    <Card
      className={`flex h-full flex-col transition-shadow ${
        selected ? "border-primary ring-2 ring-primary/20" : ""
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">{option.title}</CardTitle>
          {selected && (
            <CheckCircle2 className="size-5 shrink-0 text-primary" />
          )}
        </div>
        <CardDescription>{option.option_key}</CardDescription>
        <Badge variant="outline" className="w-fit">
          {option.complexity}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <Field label="Audience" value={option.audience} />
        <Field label="Problem" value={option.problem} />
        <Field label="Solution" value={option.solution} />
        <Field label="Monetization" value={option.monetization} />
        <Field label="Tech stack" value={option.tech_stack} />
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="w-full"
          variant={selected ? "secondary" : "default"}
          onClick={onSelect}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : null}
          {loading ? "Selecting…" : selected ? "Selected" : "Select Option"}
        </Button>
      </CardFooter>
    </Card>
  );
}
