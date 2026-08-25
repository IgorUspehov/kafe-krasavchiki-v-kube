import type {
  DeployableZipLanguage,
  DeployableZipMode,
  DeployableZipReadmeContext,
} from "@/lib/deployable-zip/types";

function pickLanguage(value: string | undefined): DeployableZipLanguage {
  if (value === "ru" || value === "de" || value === "en") return value;
  return "en";
}

function buildRussianReadme(clientId: string, businessName: string): string {
  return `# Website + CRM — исходный код

Клиент: **${businessName}**  
clientId: \`${clientId}\`

Этот ZIP содержит **полный исходный код** Next.js-проекта (не статичный бандл).

## Структура

\`\`\`text
├── src/
├── public/
├── config/
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
├── netlify.toml
├── client-manifest.json
└── README.md
\`\`\`

В архиве **нет**: \`.env\` (секреты), \`node_modules/\`, \`.next/\`, \`.git/\`.

---

## Быстрый старт

### 1. Установка

\`\`\`bash
npm install
\`\`\`

### 2. Переменные окружения

\`\`\`bash
cp .env.example .env
\`\`\`

Заполните \`.env\` своими значениями (Firebase, сайт URL и т.д.).  
**Не коммитьте** файл \`.env\`.

### 3. Локальный запуск / сборка

\`\`\`bash
npm run dev
# или
npm run build
npm start
\`\`\`

### 4. GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial release"
git branch -M main
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main
\`\`\`

Убедитесь, что \`.env\` не попал в репозиторий (он уже в \`.gitignore\`).

### 5. Netlify

1. Netlify → Add new site → Import from Git → выберите репозиторий.
2. Build command: \`npm run build\` (уже в \`netlify.toml\`).
3. Добавьте те же переменные окружения, что в \`.env\`.
4. Deploy.

Плагин \`@netlify/plugin-nextjs\` подключается через \`netlify.toml\`.

---

## Firebase

1. Создайте свой Firebase project.
2. Добавьте ключи в \`.env\` / Netlify Environment Variables.
3. Реальные секреты разработчика в ZIP **не включены**.

---

## Проверка после деплоя

- \`/\` — сайт
- \`/admin\` — админка
- CRM / бронирование / формы

**Цена продукта: 999 € — единоразовая покупка.**
`;
}

function buildEnglishReadme(clientId: string, businessName: string): string {
  return `# Website + CRM — source code

Client: **${businessName}**  
clientId: \`${clientId}\`

This ZIP contains the **full Next.js source code** (not a static assets-only bundle).

## Layout

\`\`\`text
├── src/
├── public/
├── config/
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
├── netlify.toml
├── client-manifest.json
└── README.md
\`\`\`

**Not included:** \`.env\` (secrets), \`node_modules/\`, \`.next/\`, \`.git/\`.

---

## Quick start

### 1. Install

\`\`\`bash
npm install
\`\`\`

### 2. Environment

\`\`\`bash
cp .env.example .env
\`\`\`

Fill in your values. **Never commit** \`.env\`.

### 3. Build / run locally

\`\`\`bash
npm run dev
# or
npm run build
npm start
\`\`\`

### 4. GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial release"
git branch -M main
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main
\`\`\`

### 5. Netlify

1. Netlify → Add new site → Import from Git.
2. Build command: \`npm run build\` (see \`netlify.toml\`).
3. Add the same env vars as in \`.env\`.
4. Deploy.

\`@netlify/plugin-nextjs\` is configured via \`netlify.toml\`.

---

## Firebase

Create your own Firebase project and put keys in \`.env\` / Netlify env.  
Developer secrets are **not** shipped in this ZIP.

---

## After deploy

- \`/\` — site
- \`/admin\` — admin
- CRM / booking / forms

**Product price: €999 — one-time purchase.**
`;
}

function buildGermanReadme(clientId: string, businessName: string): string {
  return `# Website + CRM — Quellcode

Kunde: **${businessName}**  
clientId: \`${clientId}\`

Dieses ZIP enthält den **vollständigen Next.js-Quellcode** (kein reines Static-Bundle).

## Struktur

\`\`\`text
├── src/
├── public/
├── config/
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
├── netlify.toml
├── client-manifest.json
└── README.md
\`\`\`

**Nicht enthalten:** \`.env\` (Secrets), \`node_modules/\`, \`.next/\`, \`.git/\`.

---

## Schnellstart

### 1. Installieren

\`\`\`bash
npm install
\`\`\`

### 2. Umgebung

\`\`\`bash
cp .env.example .env
\`\`\`

Werte ausfüllen. \`.env\` **niemals** committen.

### 3. Lokal bauen / starten

\`\`\`bash
npm run dev
# oder
npm run build
npm start
\`\`\`

### 4. GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial release"
git branch -M main
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main
\`\`\`

### 5. Netlify

1. Netlify → Add new site → Import from Git.
2. Build: \`npm run build\` (siehe \`netlify.toml\`).
3. Env-Variablen wie in \`.env\` setzen.
4. Deploy.

\`@netlify/plugin-nextjs\` ist in \`netlify.toml\` konfiguriert.

---

## Firebase

Eigenes Firebase-Projekt anlegen und Schlüssel in \`.env\` / Netlify setzen.  
Entwickler-Secrets sind **nicht** im ZIP.

---

## Nach dem Deploy

- \`/\` — Website
- \`/admin\` — Admin
- CRM / Buchung / Formulare

**Preis: 999 € — einmaliger Kauf.**
`;
}

/**
 * Buyer-facing README for the source-code Deployable ZIP.
 */
export function buildDeployableZipReadme(input: {
  clientId: string;
  mode: DeployableZipMode;
  context?: DeployableZipReadmeContext;
  saasOrigin?: string;
}): string {
  const lang = pickLanguage(input.context?.language);
  const clientId = input.clientId;
  const businessName = (input.context?.businessName || "Website + CRM").trim() || "Website + CRM";

  if (lang === "ru") return buildRussianReadme(clientId, businessName);
  if (lang === "de") return buildGermanReadme(clientId, businessName);
  return buildEnglishReadme(clientId, businessName);
}
