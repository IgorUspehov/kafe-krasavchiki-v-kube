"use client";

import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/context";

export function NotFoundContent() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6">
      <LanguageSwitcher />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("notFound.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("notFound.description")}</p>
          <Button asChild>
            <Link href="/">{t("notFound.back")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
