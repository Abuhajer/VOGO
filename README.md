# VOGO BY FAME

Bilingual (Arabic / English) luxury menswear storefront for **VOGO BY FAME** — bespoke suits, groom wear, shop, checkout, accounts, and admin in Amman, Jordan.

- **Live:** [vogo-by-fame.netlify.app](https://vogo-by-fame.netlify.app)
- **Repo:** [github.com/Abuhajer/VOGO](https://github.com/Abuhajer/VOGO)

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + CSS design tokens
- GSAP + ScrollTrigger (scroll animations)
- Framer Motion (nav, modals, carousel)
- next-intl (AR default, EN toggle, RTL/LTR)
- Prisma ORM (SQLite local, PostgreSQL production)
- Auth.js v5 (credentials + optional Google OAuth)
- Stripe (optional card payments)
- Zod (API validation)

## Routes

All public pages are locale-prefixed (`/ar` default, `/en`). Middleware redirects `/` → `/ar`.

| Route | Stage | Description |
|-------|-------|-------------|
| `/[locale]` | 1 | Marketing landing page |
| `/[locale]/shop` | 2 | Product catalog (DB) |
| `/[locale]/shop/[slug]` | 2 | Product detail + add to cart |
| `/[locale]/cart` | 2 | Cart (localStorage) |
| `/[locale]/checkout` | 2 | Checkout (COD or Stripe) |
| `/[locale]/checkout/success` | 2 | Order confirmation |
| `/[locale]/login` | 3 | Sign in |
| `/[locale]/register` | 3 | Create account |
| `/[locale]/dashboard` | 3 | Customer orders (auth required) |
| `/[locale]/admin` | 4 | Admin overview (ADMIN role) |
| `/[locale]/admin/products` | 4 | Product CRUD |
| `/[locale]/admin/orders` | 4 | Order management |
| `/[locale]/admin/customers` | 4 | Customer list |
| `/robots.txt` | — | SEO |
| `/sitemap.xml` | — | SEO (includes shop/auth routes) |

### API routes

| Route | Purpose |
|-------|---------|
| `/api/auth/[...nextauth]` | Auth.js handlers |
| `/api/stripe/webhook` | Stripe payment events |
| `/api/newsletter` | Newsletter signup (Stage 5) |

## Development

```powershell
cd "D:\My Projects\VOGO BY FAME"
npm install
cp .env.example .env.local   # then fill AUTH_SECRET
npm run db:push
npm run db:seed
npm run dev
```

**Seeded admin:** `admin@vogobyfame.com` / `Admin123!` (override with `SEED_ADMIN_PASSWORD`).

If the dev cache misbehaves (e.g. missing vendor chunks on Windows):

```powershell
npm run dev:clean
```

Open [http://localhost:3000/ar](http://localhost:3000/ar) — use **Ctrl+Shift+R** after major changes.

Stop the dev server before running `npm run validate` (both use `.next`).

## Production

```powershell
npm run build
npm run start
```

Full CI-style check locally:

```powershell
npm run validate
```

Runs lint, TypeScript (`typecheck`), and production build.

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL for metadata, sitemap, JSON-LD |
| `DATABASE_URL` | Yes | SQLite locally (`file:./dev.db`); **PostgreSQL in production** |
| `AUTH_SECRET` | Yes | Auth.js session secret (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth sign-in |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth sign-in |
| `STRIPE_SECRET_KEY` | Optional | Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe client |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics (Stage 5) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Optional | Meta Pixel (Stage 5) |
| `RESEND_API_KEY` | Optional | Newsletter email delivery |
| `SEED_ADMIN_PASSWORD` | Dev only | Admin password for `db:seed` |

On Netlify, use a hosted PostgreSQL database (Neon, Supabase, Railway). SQLite does not persist on serverless.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `master` or `main`: `prisma generate` → lint → typecheck → build (with `DATABASE_URL` and `AUTH_SECRET`).

## Deploy (Netlify)

Connected via `@netlify/plugin-nextjs`. Push to `master` or run:

```powershell
netlify deploy --prod
```

Set production env vars in Netlify UI. Run migrations against PostgreSQL before first deploy (`prisma db push` or migrate).

## Project layout

```
prisma/             # Schema, seed
src/
  app/[locale]/     # Localized pages (shop, cart, admin…)
  app/api/          # Auth, Stripe webhook, newsletter
  components/       # UI, shop, cart, auth, admin, marketing
  context/          # Theme, cart providers
  i18n/             # next-intl messages (ar.json, en.json)
  lib/              # db, auth, stripe, cart, products, analytics
  server/           # Server actions (orders, auth, admin)
  types/            # DB role/status constants
```

## Stage roadmap

- **Stage 1:** Marketing landing page ✅
- **Stage 2:** Shop, cart, checkout (COD + optional Stripe) ✅
- **Stage 3:** Login, register, customer dashboard ✅
- **Stage 4:** Admin products, orders, customers ✅
- **Stage 5–6:** Analytics, cookie consent, newsletter ✅

## Contact / location

- Phone: +962 79 722 6984  
- Address: ش. وصفي التل، عمّان 11118 / Wasfi Al-Tal St., Amman 11118  
- WhatsApp & social links in the site footer
