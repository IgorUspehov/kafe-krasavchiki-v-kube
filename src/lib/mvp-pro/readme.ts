import type { MvpProEntitlement } from "@/lib/mvp-pro/entitlement-store";

type ReadmeLang = "ru" | "de" | "en";

const COPY = {
  en: {
    title: (name: string) => `# ${name} — MVP Pro Package`,
    intro:
      "This ZIP contains your ready-to-host static MVP website and this README with setup instructions.",
    businessType: "Business type",
    clientId: "Client ID",
    runTitle: "Run locally",
    runSteps: [
      "Unzip the archive.",
      "Open a terminal in the folder with `index.html`.",
      "Serve the static files, for example:",
      "```bash",
      "npx serve .",
      "```",
      "Open the printed local URL in your browser.",
    ],
    deployTitle: "Deploy anywhere",
    deployText:
      "Upload all files to any static hosting (for example Vercel, Cloudflare Pages, or Railway). Your live demo loads personalization via `clientId` in the URL.",
    supportTitle: "Support",
    supportText: "Keep this README and your `clientId` for future updates.",
  },
  de: {
    title: (name: string) => `# ${name} — MVP Pro Paket`,
    intro:
      "Dieses ZIP enthält Ihre fertige statische MVP-Website und diese README mit Setup-Anleitung.",
    businessType: "Branche",
    clientId: "Kunden-ID",
    runTitle: "Lokal starten",
    runSteps: [
      "Archiv entpacken.",
      "Terminal im Ordner mit `index.html` öffnen.",
      "Statische Dateien bereitstellen, z. B.:",
      "```bash",
      "npx serve .",
      "```",
      "Die angezeigte lokale URL im Browser öffnen.",
    ],
    deployTitle: "Überall deployen",
    deployText:
      "Alle Dateien auf einen beliebigen Static Host hochladen (z. B. Vercel, Cloudflare Pages oder Railway). Die Live-Demo lädt Personalisierung über `clientId` in der URL.",
    supportTitle: "Support",
    supportText: "Bewahren Sie diese README und Ihre `clientId` für spätere Updates auf.",
  },
  ru: {
    title: (name: string) => `# ${name} — пакет MVP Pro`,
    intro:
      "Этот ZIP содержит готовый статический MVP-сайт и данный README с инструкцией по запуску.",
    businessType: "Тип бизнеса",
    clientId: "ID клиента",
    runTitle: "Локальный запуск",
    runSteps: [
      "Распакуйте архив.",
      "Откройте терминал в папке с `index.html`.",
      "Запустите локальный сервер, например:",
      "```bash",
      "npx serve .",
      "```",
      "Откройте локальный URL в браузере.",
    ],
    deployTitle: "Деплой",
    deployText:
      "Загрузите файлы на любой static-хостинг (например Vercel, Cloudflare Pages или Railway). Персонализация подгружается по `clientId` в URL.",
    supportTitle: "Поддержка",
    supportText: "Сохраните README и `clientId` для будущих обновлений.",
  },
} as const;

export function buildMvpProReadme(entitlement: MvpProEntitlement): string {
  const lang: ReadmeLang = entitlement.language ?? "en";
  const t = COPY[lang] ?? COPY.en;

  return [
    t.title(entitlement.businessName),
    "",
    t.intro,
    "",
    `## ${t.businessType}`,
    "",
    entitlement.businessType,
    "",
    `## ${t.clientId}`,
    "",
    entitlement.clientId,
    "",
    `## ${t.runTitle}`,
    "",
    ...t.runSteps,
    "",
    `## ${t.deployTitle}`,
    "",
    t.deployText,
    "",
    `## ${t.supportTitle}`,
    "",
    t.supportText,
    "",
    `---`,
    `MVP Factory · MVP Pro · ${entitlement.paidAt}`,
    "",
  ].join("\n");
}
