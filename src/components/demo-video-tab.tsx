"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Film, ImageIcon, Terminal } from "lucide-react";

const SCREENSHOTS = [
  "01_home.png",
  "02_dashboard.png",
  "03_form.png",
  "04_result.png",
  "05_mobile.png",
  "06_finish.png",
];

export function DemoVideoTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Film className="size-4" />
            DEMO_VIDEO_FACTORY
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">v2.2 PASS</Badge>
            <Badge variant="outline">Standalone module</Badge>
            <Badge variant="secondary">Playwright + ffmpeg</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Автоматическая генерация demo.mp4 из локального MVP. Модуль не
            входит в API backend — запускается отдельно из репозитория фабрики.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="size-4" />
            Screenshots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {SCREENSHOTS.map((name) => (
              <li
                key={name}
                className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm"
              >
                demo_video_factory/output/screenshots/{name}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Output</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-mono text-sm">
            demo_video_factory/output/demo.mp4
          </p>
          <Separator />
          <p className="text-sm text-muted-foreground">
            Логи: demo_video_factory/logs/run.log
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="size-4" />
            Запуск
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-sm">
{`# 1. Запустите MVP локально
cd SAAS_IDEA_AI_MVP_FACTORY/output/SAAS_IDEA_AI_MVP_<TYPE>
./run/start.sh

# 2. Укажите URL MVP в config или через env
cd SAAS_IDEA_AI_MVP_FACTORY/demo_video_factory
DEMO_VIDEO_TARGET_URL=http://localhost:8080/app/index.html ./run/start.sh`}
          </pre>
          <p className="text-sm text-muted-foreground">
            Одна команда из корня модуля:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              ./demo_video_factory/run/start.sh
            </code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
