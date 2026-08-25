"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

import { toErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n/context";

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: unknown;
  onDismiss?: () => void;
}) {
  const { t } = useTranslation();
  const safeMessage = toErrorMessage(message, t("errors.unknown"));

  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{t("errors.title")}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-2">
        <span>{safeMessage}</span>
        {onDismiss ? (
          <Button size="sm" variant="outline" onClick={onDismiss}>
            {t("errors.close")}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
