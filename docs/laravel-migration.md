# Laravel Migration Plan — Santara Pips

Active stack:

```text
frontend/   Next.js
backend/    Laravel 11 (API)
```

The original Go Fiber API is archived at [`../backups/golang-api/`](../backups/golang-api/README.md).

## Status

| Area | Status |
|------|--------|
| Auth + onboarding + verification | ✅ Laravel parity |
| Content, signals, journal, bonus, tickets, AI, uploads, admin | ✅ Laravel parity |
| Billing schema / plans | ✅ (subscribe stub) |
| Payment gateway (Midtrans/Xendit) | ❌ deferred |
| Production cutover (Nginx/Vercel → Laravel) | ⏳ pending (VPS may still run Go until switched) |

## Access model (target)

```text
IB verification (MT5)     → unlock desk modules
Subscription + plan       → commercial tier (later)
Member level              → derived from plan (or admin grant)
```

## Schema beyond legacy Go

| Table | Purpose |
|-------|---------|
| `member_levels` | free / basic / pro / elite |
| `plans` | sellable products |
| `subscriptions` | user ↔ plan lifecycle |
| `payments` | gateway transactions / invoices |

## Cutover checklist

- [ ] Point FE `NEXT_PUBLIC_API_URL` to Laravel staging
- [ ] Smoke: login → onboarding → admin approve → signals unlock
- [ ] CORS `FRONTEND_URL` matches Vercel origin
- [ ] Migrate/reseed production DB for Laravel
- [ ] Nginx + PHP-FPM for Laravel
- [ ] Retire Go systemd (`ib-api`) on VPS
- [ ] Keep `backups/golang-api` for rollback reference

## Payment gateway (later)

Default config: `PAYMENT_GATEWAY=midtrans` — implement after cutover.
