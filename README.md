# WIRA — Professional Services Marketplace

Repository: [github.com/chalo24mulwa/WIRA](https://github.com/chalo24mulwa/WIRA)
Live demo: coming soon

WIRA connects customers in Kenya with verified professionals for on-demand
services, and separately runs a company/individual hiring marketplace backed
by a WIRA Coins prepaid wallet.

## Features

- Customer service requests with GPS/county discovery, optional budgets, and
  quotation review (per-hour or per-job pricing, estimated completion time)
- Real-time quotation alerts (popup + sound) and a ringtone-style incoming
  job alert for professionals, with accept/decline
- Subscription credit plans for professionals (FREE / STANDARD / PROFESSIONAL
  / BUSINESS), consumed only on confirmed bookings
- Backend-enforced contact privacy: phone/email are hidden until a booking or
  hiring acceptance, then revealed only to the two parties involved
- A separate Hire marketplace for individual/company employers, with a WIRA
  Coins wallet, one-time hiring fees, timed contact unlocks, and agency
  worker management
- In-app messaging, notifications, reviews, and an admin panel (accounts,
  hiring oversight, wallets, DB-configurable pricing)

## Tech stack

Next.js (App Router, TypeScript), Tailwind CSS, Prisma + SQLite, custom JWT
session auth.

## Getting started

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` (or
create `.env`) with `DATABASE_URL` and `JWT_SECRET` before running.

## Project structure

- `src/app` — routes (marketing pages, `dashboard/customer`,
  `dashboard/professional`, `admin`, and the `api/*` route handlers)
- `src/components` — UI components, grouped by `dashboard/`, `admin/`, `auth/`
- `src/lib` — session/auth, credits, wallet, notifications, validators
- `prisma/schema.prisma` — data model and migrations
