# Website + CRM — Barbershop

Full-stack Next.js platform — Website + CRM + Booking + Admin Panel

## What's included

- Multi-language website (EN / DE / RU)
- CRM: clients, bookings, services, staff
- Admin panel
- Booking flow
- Firebase backend
- Polar.sh payments
- Image library (20+ niches)

## Tech Stack

- Next.js 14 (App Router)
- Firebase (Firestore + Auth)
- Polar.sh (payments / subscriptions)
- Cloudflare (DNS / domain)
- Railway or Vercel (hosting)
- Tailwind CSS

## Deploy in 5 steps

### 1. Unzip & push to GitHub

```bash
unzip barbershop-zababalenshteynera.zip
cd barbershop-zababalenshteynera
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Create Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create new project
3. Enable Firestore and Authentication
4. Go to Project Settings → Service Accounts → Generate new private key
5. Copy: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

### 3. Create Polar.sh account

1. Go to [polar.sh](https://polar.sh)
2. Create organization
3. Create product (subscription €199/month)
4. Go to Settings → Webhooks → create webhook, copy `POLAR_WEBHOOK_SECRET`
5. Go to Settings → Access Tokens, copy `POLAR_ACCESS_TOKEN`

### 4. Set up Cloudflare (domain)

1. Buy domain on [cloudflare.com](https://cloudflare.com) or transfer existing
2. After deploy — add CNAME record pointing to your Railway/Vercel URL

### 5. Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Add environment variables (see below)
4. Deploy

Or deploy on Vercel:

1. Go to [vercel.com](https://vercel.com)
2. New Project → Import from GitHub
3. Add environment variables
4. Deploy

## Environment Variables

Create `.env.local` file (copy from `.env.local.example`):

```env
# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Polar.sh
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_ACCESS_TOKEN=pat_...

# Your site URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Local development

```bash
npm install
cp .env.local.example .env.local
# fill in your keys in .env.local
npm run dev
```

Open http://localhost:3000

## Build & production

```bash
npm run build
npm start
```

## Support

This is an open-source template. You are responsible for your own deployment, Firebase account, and domain configuration.

For questions about the code structure — read the source files in `src/`.

**License:** Personal use only. Resale of this code requires a separate license.
