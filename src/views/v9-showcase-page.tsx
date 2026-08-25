"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Factory,
  Globe,
  MessageSquare,
  Package,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SHOWCASE_DELIVERABLES,
  SHOWCASE_DEMOS,
  SHOWCASE_FLOW_STEPS,
  SHOWCASE_LINKS,
} from "@/lib/showcase/showcase-config";

type FeedbackForm = {
  expectations_met: string;
  liked_most: string;
  unclear: string;
  missing: string;
  would_use_in_business: string;
  would_pay: string;
  stated_wtp: string;
  business_type: string;
  email: string;
};

const EMPTY_FORM: FeedbackForm = {
  expectations_met: "",
  liked_most: "",
  unclear: "",
  missing: "",
  would_use_in_business: "",
  would_pay: "",
  stated_wtp: "",
  business_type: "",
  email: "",
};

export function V9ShowcasePage() {
  const [form, setForm] = useState<FeedbackForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  async function submitFeedback(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFeedbackMessage(null);
    setFeedbackError(null);

    try {
      const response = await fetch("/api/showcase/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; feedback_id?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Feedback submission failed");
      }

      setFeedbackMessage(`Спасибо! Feedback сохранён (${data.feedback_id}).`);
      setForm(EMPTY_FORM);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Feedback submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-muted/20 to-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Factory className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">SAAS IDEA AI MVP FACTORY</p>
              <p className="text-xs text-muted-foreground">V9 Market Validation Showcase</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={SHOWCASE_LINKS.questionnaire}>Start Questionnaire</Link>
            </Button>
            <Button asChild size="sm">
              <a href="#feedback">Feedback</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-4 py-10 md:px-6 md:py-14">
        <section className="space-y-6 text-center">
          <Badge variant="secondary" className="mx-auto">
            V9.1 Showcase
          </Badge>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              SAAS IDEA AI MVP FACTORY
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              Превращаем бизнес-идею в готовый MVP.
            </p>
          </div>
          <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
            Пройдите путь клиента: посмотрите примеры, заполните опросник, поймите результат и
            оставьте feedback. Без знаний Cursor, GitHub или React.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href={SHOWCASE_LINKS.questionnaire}>
                Start Questionnaire
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#examples">Смотреть примеры</a>
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold">Как это работает</h2>
            <p className="text-sm text-muted-foreground">
              Полный путь от идеи до готовой ссылки — на базе pipeline V1–V8
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-6">
            {SHOWCASE_FLOW_STEPS.map((step, index) => (
              <div key={step} className="relative flex flex-col items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-full border bg-background text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="text-center text-sm font-medium">{step}</p>
                {index < SHOWCASE_FLOW_STEPS.length - 1 ? (
                  <ArrowRight className="absolute -right-2 top-4 hidden size-4 text-muted-foreground md:block" />
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section id="examples" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Примеры</h2>
            <p className="text-sm text-muted-foreground">
              Готовые MVP из существующих артефактов фабрики — без новых factory-модулей
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {SHOWCASE_DEMOS.map((demo) => (
              <Card key={demo.id} className="overflow-hidden">
                <div className="relative aspect-[16/10] bg-muted">
                  <Image
                    src={demo.screenshot}
                    alt={`${demo.title} dashboard screenshot`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{demo.title}</CardTitle>
                  <CardDescription>{demo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {demo.demoUrl ? (
                    <Button asChild className="w-full">
                      <a href={demo.demoUrl} target="_blank" rel="noreferrer">
                        Open Demo
                        <ExternalLink className="ml-2 size-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button asChild variant="secondary" className="w-full">
                      <a href={demo.screenshot} target="_blank" rel="noreferrer">
                        Open Demo
                        <ExternalLink className="ml-2 size-4" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto max-w-2xl space-y-4">
            <Sparkles className="mx-auto size-8 text-primary" />
            <h2 className="text-2xl font-semibold">Пройти опрос</h2>
            <p className="text-sm text-muted-foreground">
              Заполните client questionnaire — система соберёт manifest и подготовит персонализированный
              MVP под ваш бизнес.
            </p>
            <Button asChild size="lg">
              <Link href={SHOWCASE_LINKS.questionnaire}>
                Start Questionnaire
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Что получает клиент</h2>
            <p className="text-sm text-muted-foreground">
              Результат client delivery pipeline (V7) + deployment (V8)
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SHOWCASE_DELIVERABLES.map((item, index) => {
              const icons = [Globe, Smartphone, ExternalLink, Package, CheckCircle2];
              const Icon = icons[index] ?? CheckCircle2;
              return (
                <Card key={item.title}>
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="feedback" className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              <h2 className="text-2xl font-semibold">Feedback</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Помогите провести V9 Market Validation — 6 коротких вопросов после просмотра примеров
            </p>
          </div>

          {feedbackMessage ? (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertTitle>Feedback received</AlertTitle>
              <AlertDescription>{feedbackMessage}</AlertDescription>
            </Alert>
          ) : null}

          {feedbackError ? (
            <Alert variant="destructive">
              <AlertTitle>Feedback error</AlertTitle>
              <AlertDescription>{feedbackError}</AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardContent className="pt-6">
              <form className="space-y-6" onSubmit={submitFeedback}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="business_type">Business type (optional)</Label>
                    <Input
                      id="business_type"
                      value={form.business_type}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, business_type: event.target.value }))
                      }
                      placeholder="beauty_salon"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>1. Получили ли вы ожидаемый результат?</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "yes", label: "Да" },
                      { value: "no", label: "Нет" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={form.expectations_met === option.value ? "default" : "outline"}
                        onClick={() =>
                          setForm((current) => ({ ...current, expectations_met: option.value }))
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="liked_most">2. Что понравилось больше всего?</Label>
                  <Textarea
                    id="liked_most"
                    value={form.liked_most}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, liked_most: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unclear">3. Что было непонятно?</Label>
                  <Textarea
                    id="unclear"
                    value={form.unclear}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, unclear: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="missing">4. Что отсутствует?</Label>
                  <Textarea
                    id="missing"
                    value={form.missing}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, missing: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label>5. Использовали бы вы это в бизнесе?</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "yes", label: "Да" },
                      { value: "no", label: "Нет" },
                      { value: "maybe", label: "Возможно" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={
                          form.would_use_in_business === option.value ? "default" : "outline"
                        }
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            would_use_in_business: option.value,
                          }))
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>6. Заплатили бы вы за такой результат?</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "yes", label: "Да" },
                      { value: "no", label: "Нет" },
                      { value: "maybe", label: "Возможно" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={form.would_pay === option.value ? "default" : "outline"}
                        onClick={() =>
                          setForm((current) => ({ ...current, would_pay: option.value }))
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {form.would_pay === "yes" || form.would_pay === "maybe" ? (
                  <div className="space-y-2">
                    <Label htmlFor="stated_wtp">Если да — сколько? (EUR)</Label>
                    <Input
                      id="stated_wtp"
                      value={form.stated_wtp}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, stated_wtp: event.target.value }))
                      }
                      placeholder="99"
                    />
                  </div>
                ) : null}

                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? "Sending..." : "Submit Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        SAAS IDEA AI MVP FACTORY · V9 Market Validation Showcase · llm_used=false
      </footer>
    </div>
  );
}
