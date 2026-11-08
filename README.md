# Santara Pips

Private trading community platform. Access to premium modules requires Santara Pips MT5 verification.

## Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind → Vercel
- **Backend:** Laravel 11, Sanctum, PostgreSQL/SQLite → Ubuntu VPS + Nginx
- **Storage:** Local VPS (MVP), abstractable to Cloudflare R2 / Stream

## Monorepo

```text
frontend/                 Next.js app
backend/                  Laravel API (active)
docs/                     Architecture & API docs
nginx/                    Legacy Go Nginx site config (optional archive)
backups/golang-api/       Archived Go Fiber API + deploy/scripts/storage
```

## Quick start (dev)

### 1. Database

Requires Docker Desktop (or any Postgres 16 matching `.env`).

```bash
docker compose up -d
```

Or use SQLite for Laravel local (default in `backend/.env.example`).

### 2. Backend (Laravel)

```bash
cd backend
cp .env.example .env
php artisan key:generate
# SQLite:
# New-Item -ItemType File -Force database/database.sqlite
php artisan migrate --seed
php artisan serve --port=8081
```

API: `http://localhost:8081` · Health: `GET /health` · Routes under `/v1/...`

### 3. Frontend

```bash
cd frontend
cp ../.env.example .env.local
# set NEXT_PUBLIC_API_URL=http://localhost:8081/v1
npm install
npm run dev
```

App: `http://localhost:3000`

## Production URLs

| Role | URL |
|------|-----|
| **API** | `https://api.santarapips.com` |
| **Frontend** | `https://santarapips.com` (Vercel) |

**Vercel env:** `NEXT_PUBLIC_API_URL=https://api.santarapips.com/v1`  
**Backend `.env`:** `APP_URL=https://api.santarapips.com` · `FRONTEND_URL=https://santarapips.com`

## Docs

- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [API](docs/api.md)
- [Flows](docs/flows.md)
- [UI](docs/ui.md)
- [Deployment](docs/deployment.md)
- [Deploy production (`ibcomunity.webyouneed.id`)](docs/deploy-ibcomunity.md)
- [Laravel migration notes](docs/laravel-migration.md)
- [Admin UI/UX spec](docs/admin-ui-spec.md)
- [Golang archive](backups/golang-api/README.md)

## Defaults (MVP)

- UI accent: **blue `#0052FF`**, light-first premium SaaS surfaces
- Member: top navigation + content carousels; Admin: Linear-style sidebar
- Typography: **Outfit** (display) + **Plus Jakarta Sans** (body)
- AI CS: **rule / knowledge base** with page redirects; escalate to human after 3 failures

## Seed users (dev)

Password for all: `password123`

| Email | Role | Status |
|-------|------|--------|
| `member@ib.local` | member | onboarding |
| `verified@ib.local` | member | verified |
| `admin@ib.local` | admin | verified |
| `super@ib.local` | super_admin | verified |

Aliases `*@santara.local` are also seeded.

## P1 quick test

1. Register new user → lands on `/member` (browse desk, premium locked)
2. Click **Become a member** → `/onboarding` intro → Start verification (5 steps, no skip)
3. Complete steps → status `pending_verification`
4. Login `admin@ib.local` → `/admin/verifications` → Approve
5. Login member again → status `verified`, modules unlock

## Legacy Go backend

The previous Go Fiber API is archived at [`backups/golang-api/`](backups/golang-api/README.md). Keep it for reference/rollback only.
