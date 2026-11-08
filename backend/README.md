# Santara Pips — Laravel API

Active backend for the monorepo (`frontend/` = Next.js).

The previous Go Fiber API is archived at `../backups/golang-api/`.

## Status

| Module | Status |
|--------|--------|
| Auth (register/login/me/logout/refresh) | ✅ |
| Onboarding 5 steps + verification | ✅ |
| Contents / categories / bookmarks / history | ✅ |
| Signals / journal / bonuses / telegram | ✅ |
| Tickets / notifications | ✅ |
| AI chat (rule-based) | ✅ |
| Uploads | ✅ |
| Admin (verifications, content, signals, bonuses, tickets, users) | ✅ |
| Settings public | ✅ |
| Billing plans schema + subscribe stub | ✅ (gateway later) |
| Midtrans / Xendit live | ❌ deferred |

## Quick start

```powershell
cd backend-laravel
cp .env.example .env   # if needed
php artisan key:generate
New-Item -ItemType File -Force database/database.sqlite
php artisan migrate:fresh --seed
php artisan serve --port=8081
```

Point FE locally:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081/v1
```

## Demo users (`password123`)

| Email | Role | Status |
|-------|------|--------|
| `member@ib.local` | member | onboarding |
| `verified@ib.local` | member | verified |
| `admin@ib.local` | admin | verified |
| `super@ib.local` | super_admin | verified |

Aliases `*@santara.local` also seeded.

## Docs

- Migration plan: `../docs/laravel-migration.md`
- Original API contract: `../docs/api.md`
