# Website + CRM — исходный код

Клиент: **КАФЕ КРАСАВЧИКИ В КУБЕ**  
clientId: `fccae333-fda6-498b-b864-69757feb7da5`

Этот ZIP содержит **полный исходный код** Next.js-проекта (не статичный бандл).

## Структура

```text
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
```

В архиве **нет**: `.env` (секреты), `node_modules/`, `.next/`, `.git/`.

---

## Быстрый старт

### 1. Установка

```bash
npm install
```

### 2. Переменные окружения

```bash
cp .env.example .env
```

Заполните `.env` своими значениями (Firebase, сайт URL и т.д.).  
**Не коммитьте** файл `.env`.

### 3. Локальный запуск / сборка

```bash
npm run dev
# или
npm run build
npm start
```

### 4. GitHub

```bash
git init
git add .
git commit -m "Initial release"
git branch -M main
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main
```

Убедитесь, что `.env` не попал в репозиторий (он уже в `.gitignore`).

### 5. Netlify

1. Netlify → Add new site → Import from Git → выберите репозиторий.
2. Build command: `npm run build` (уже в `netlify.toml`).
3. Добавьте те же переменные окружения, что в `.env`.
4. Deploy.

Плагин `@netlify/plugin-nextjs` подключается через `netlify.toml`.

---

## Firebase

1. Создайте свой Firebase project.
2. Добавьте ключи в `.env` / Netlify Environment Variables.
3. Реальные секреты разработчика в ZIP **не включены**.

---

## Проверка после деплоя

- `/` — сайт
- `/admin` — админка
- CRM / бронирование / формы

**Цена продукта: 999 € — единоразовая покупка.**
