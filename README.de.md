# Website + CRM — Barbershop

Vollständige Next.js Plattform — Website + CRM + Buchung + Admin-Panel

## Was enthalten ist

- Mehrsprachige Website (EN / DE / RU)
- CRM: Kunden, Buchungen, Dienstleistungen, Personal
- Admin-Panel
- Buchungsformular
- Firebase Backend
- Zahlungen über Polar.sh
- Bildbibliothek (20+ Branchen)

## Technologie-Stack

- Next.js 14 (App Router)
- Firebase (Firestore + Auth)
- Polar.sh (Zahlungen / Abonnements)
- Cloudflare (DNS / Domain)
- Railway oder Vercel (Hosting)
- Tailwind CSS

## Deployment in 5 Schritten

### 1. Entpacken und auf GitHub laden

```bash
unzip barbershop.zip
cd barbershop
git init
git add .
git commit -m "init"
git remote add origin https://github.com/IHR_NAME/IHR_REPO.git
git push -u origin main
```

### 2. Firebase-Projekt erstellen

1. Öffnen Sie [console.firebase.google.com](https://console.firebase.google.com)
2. Neues Projekt erstellen
3. Firestore und Authentication aktivieren
4. Projekteinstellungen → Dienstkonten → Neuen privaten Schlüssel generieren
5. Kopieren: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

### 3. Polar.sh-Konto erstellen

1. Öffnen Sie [polar.sh](https://polar.sh)
2. Organisation erstellen
3. Produkt erstellen (Abonnement €199/Monat)
4. Einstellungen → Webhooks → Webhook erstellen, `POLAR_WEBHOOK_SECRET` kopieren
5. Einstellungen → Zugriffstoken, `POLAR_ACCESS_TOKEN` kopieren

### 4. Cloudflare (Domain)

1. Domain auf [cloudflare.com](https://cloudflare.com) kaufen oder bestehende übertragen
2. Nach dem Deployment — CNAME-Eintrag auf Railway/Vercel URL hinzufügen

### 5. Deployment auf Railway

1. Öffnen Sie [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Umgebungsvariablen hinzufügen (siehe unten)
4. Deploy

Oder auf Vercel:

1. Öffnen Sie [vercel.com](https://vercel.com)
2. New Project → Import from GitHub
3. Umgebungsvariablen hinzufügen
4. Deploy

## Umgebungsvariablen

Erstellen Sie eine `.env.local` Datei (kopieren Sie aus `.env.local.example`):

```env
# Firebase Admin
FIREBASE_PROJECT_ID=ihr-project-id
FIREBASE_CLIENT_EMAIL=ihr-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Polar.sh
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_ACCESS_TOKEN=pat_...

# Website URL
NEXT_PUBLIC_SITE_URL=https://ihredomain.com
```

## Lokale Entwicklung

```bash
npm install
cp .env.local.example .env.local
# Schlüssel in .env.local eintragen
npm run dev
```

Öffnen Sie http://localhost:3000

## Build & Produktion

```bash
npm run build
npm start
```

## Support

Dies ist ein Open-Source-Template. Sie sind selbst verantwortlich für Deployment, Firebase-Konto und Domain-Konfiguration.

**Lizenz:** Nur für den persönlichen Gebrauch. Der Weiterverkauf des Codes erfordert eine separate Lizenz.
