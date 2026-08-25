# Сайт + CRM — Барбершоп

Полноценная Next.js платформа — Сайт + CRM + Бронирование + Админ-панель

## Что включено

- Многоязычный сайт (EN / DE / RU)
- CRM: клиенты, записи, услуги, персонал
- Админ-панель
- Форма бронирования
- Firebase бэкенд
- Оплата через Polar.sh
- Библиотека фото (20+ ниш)

## Технологии

- Next.js 14 (App Router)
- Firebase (Firestore + Auth)
- Polar.sh (платежи / подписки)
- Cloudflare (DNS / домен)
- Railway или Vercel (хостинг)
- Tailwind CSS

## Деплой за 5 шагов

### 1. Распаковать и загрузить на GitHub

```bash
unzip barbershop.zip
cd barbershop
git init
git add .
git commit -m "init"
git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПО.git
git push -u origin main
```

### 2. Создать Firebase проект

1. Открыть [console.firebase.google.com](https://console.firebase.google.com)
2. Создать новый проект
3. Включить Firestore и Authentication
4. Настройки проекта → Сервисные аккаунты → Создать ключ
5. Скопировать: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

### 3. Создать аккаунт Polar.sh

1. Открыть [polar.sh](https://polar.sh)
2. Создать организацию
3. Создать продукт (подписка €199/мес)
4. Настройки → Webhooks → создать вебхук, скопировать `POLAR_WEBHOOK_SECRET`
5. Настройки → Токены доступа, скопировать `POLAR_ACCESS_TOKEN`

### 4. Cloudflare (домен)

1. Купить домен на [cloudflare.com](https://cloudflare.com) или перенести существующий
2. После деплоя — добавить CNAME запись на Railway/Vercel URL

### 5. Деплой на Railway

1. Открыть [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Добавить переменные окружения (см. ниже)
4. Deploy

Или на Vercel:

1. Открыть [vercel.com](https://vercel.com)
2. New Project → Import from GitHub
3. Добавить переменные окружения
4. Deploy

## Переменные окружения

Создать файл `.env.local` (скопировать из `.env.local.example`):

```env
# Firebase Admin
FIREBASE_PROJECT_ID=ваш-project-id
FIREBASE_CLIENT_EMAIL=ваш-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Polar.sh
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_ACCESS_TOKEN=pat_...

# URL сайта
NEXT_PUBLIC_SITE_URL=https://вашдомен.com
```

## Локальная разработка

```bash
npm install
cp .env.local.example .env.local
# заполнить ключи в .env.local
npm run dev
```

Открыть http://localhost:3000

## Сборка и продакшн

```bash
npm run build
npm start
```

## Поддержка

Это шаблон с открытым кодом. Вы самостоятельно отвечаете за деплой, Firebase аккаунт и настройку домена.

**Лицензия:** Только для личного использования. Перепродажа кода требует отдельной лицензии.
