"use client";

import { useState } from "react";
import { Brain, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RecommendedStackDisplay } from "@/components/recommended-stack-display";
import { analyzeIdeaViaApi } from "@/lib/ai-orchestrator/ai-artifacts";
import { normalizeAnalyzeIdeaResponse, toDisplayText } from "@/lib/ai-orchestrator/normalize-analysis";
import type { AnalyzeIdeaResponse, PromptLanguage, TargetOutput } from "@/lib/ai-orchestrator/types";
import { toErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
);

export function AiPromptInterface() {
  const { t } = useTranslation();
  const [idea, setIdea] = useState("");
  const [language, setLanguage] = useState<PromptLanguage>("en");
  const [targetOutput, setTargetOutput] = useState<TargetOutput>("MVP");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeIdeaResponse | null>(null);

  async function handleAnalyze() {
    const trimmed = idea.trim();
    if (!trimmed) {
      setError(t("dashboard.aiIdeaRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysis = await analyzeIdeaViaApi(trimmed, language, targetOutput);
      setResult(normalizeAnalyzeIdeaResponse(analysis));
    } catch (err) {
      setError(toErrorMessage(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="size-5 text-primary" />
          {t("dashboard.aiPromptInterface")}
        </CardTitle>
        <CardDescription>{t("dashboard.aiPromptInterfaceDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ai-idea">
            {t("dashboard.ideaLabel")}
          </label>
          <Textarea
            id="ai-idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={t("dashboard.ideaPlaceholder")}
            disabled={loading}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="ai-language">
              {t("dashboard.projectLanguage")}
            </label>
            <select
              id="ai-language"
              className={selectClassName}
              value={language}
              onChange={(e) => setLanguage(e.target.value as PromptLanguage)}
              disabled={loading}
            >
              <option value="ru">{t("dashboard.langRu")}</option>
              <option value="en">{t("dashboard.langEn")}</option>
              <option value="de">{t("dashboard.langDe")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="ai-target">
              {t("dashboard.targetOutput")}
            </label>
            <select
              id="ai-target"
              className={selectClassName}
              value={targetOutput}
              onChange={(e) => setTargetOutput(e.target.value as TargetOutput)}
              disabled={loading}
            >
              <option value="MVP">{t("dashboard.targetMvp")}</option>
              <option value="SaaS">{t("dashboard.targetSaas")}</option>
              <option value="Landing">{t("dashboard.targetLanding")}</option>
              <option value="APK">{t("dashboard.targetApk")}</option>
              <option value="PWA">{t("dashboard.targetPwa")}</option>
            </select>
          </div>
        </div>

        <Button type="button" onClick={() => void handleAnalyze()} disabled={loading || !idea.trim()}>
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("dashboard.analyzing")}
            </>
          ) : (
            t("dashboard.analyzeIdea")
          )}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {result ? (
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            {result.status === "FALLBACK_MODE" && result.message ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">{result.message}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {result.provider === "fallback" || result.mock_mode ? (
                <>
                  <Badge variant="secondary">
                    {t("dashboard.aiMode")}: {result.status}
                  </Badge>
                  <Badge variant="outline">
                    {t("dashboard.externalApi")}: {t("dashboard.externalApiOff")}
                  </Badge>
                  <Badge variant="outline">
                    {t("dashboard.aiProvider")}: {result.provider}
                  </Badge>
                </>
              ) : (
                <>
                  <Badge variant={result.status === "ACTIVE" ? "default" : "secondary"}>
                    {t("dashboard.aiStatus")}: {result.status}
                  </Badge>
                  <Badge variant="outline">
                    {t("dashboard.aiProvider")}: {result.provider}
                  </Badge>
                </>
              )}
              <Badge variant="outline">
                {t("dashboard.projectType")}: {toDisplayText(result.project_type)}
              </Badge>
            </div>

            {result.original_error ? (
              <p className="text-xs text-muted-foreground">
                {t("dashboard.aiOriginalError")}: {result.original_error}
              </p>
            ) : null}

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">{t("dashboard.aiSummary")}</p>
                <p>{toDisplayText(result.summary || result.idea_analysis)}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">{t("dashboard.recommendedStack")}</p>
                <RecommendedStackDisplay
                  value={result.recommended_stack}
                  sections={result.stack_sections}
                />
              </div>
              {(result.mvp_features ?? []).length > 0 ? (
                <div>
                  <p className="font-medium text-muted-foreground">{t("dashboard.mvpFeatures")}</p>
                  <ul className="list-disc pl-5">
                    {(result.mvp_features ?? []).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {(result.risks ?? []).length > 0 ? (
                <div>
                  <p className="font-medium text-muted-foreground">{t("dashboard.risks")}</p>
                  <ul className="list-disc pl-5">
                    {(result.risks ?? []).map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {(result.next_steps ?? []).length > 0 ? (
                <div>
                  <p className="font-medium text-muted-foreground">{t("dashboard.nextSteps")}</p>
                  <ul className="list-disc pl-5">
                    {(result.next_steps ?? []).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
