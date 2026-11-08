# IB Community — API Endpoints

Base URL: `https://api.domain.com/v1`

## Response envelope

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  },
  "errors": null
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "meta": null,
  "errors": [{ "field": "email", "message": "invalid email" }]
}
```

Query conventions: `?page=&per_page=&sort=&order=asc|desc&q=&filters...`

---

## Auth

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/auth/register` | Public | Create account → status `registered`/`onboarding` |
| POST | `/auth/login` | Public | Issue tokens |
| POST | `/auth/logout` | Auth | Revoke refresh |
| POST | `/auth/refresh` | Public (refresh cookie) | Rotate access |
| POST | `/auth/forgot-password` | Public | Send reset mail |
| POST | `/auth/reset-password` | Public | Reset with token |
| GET | `/auth/me` | Auth | Current user + profile + status |
| POST | `/auth/verify-email` | Auth | Optional email verify |

---

## Onboarding

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/onboarding` | Auth | Progress + current step |
| POST | `/onboarding/step/1/complete` | Auth | Mark tutorial watched |
| POST | `/onboarding/step/2/complete` | Auth | Confirm IB registration |
| POST | `/onboarding/step/3` | Auth | Submit MT5 + server |
| POST | `/onboarding/step/4` | Auth | Upload proof / complete deposit tutorial |
| POST | `/onboarding/step/5/complete` | Auth | Enter waiting → `pending_verification` |

Cannot skip: API returns `409` if previous step incomplete.

---

## Verification (Member)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/verifications/me` | Auth | Latest + history |
| POST | `/verifications/resubmit` | Auth (`rejected`) | New request |

## Verification (Admin)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/admin/verifications` | Admin | List/filter |
| GET | `/admin/verifications/:id` | Admin | Detail |
| POST | `/admin/verifications/:id/approve` | Admin | Approve → user `verified` + notify |
| POST | `/admin/verifications/:id/reject` | Admin | Reject + reason |
| POST | `/admin/users/:id/lock` | Admin | Lock member |
| POST | `/admin/users/:id/unlock` | Admin | Unlock |

---

## Categories

| Method | Path | Access |
|--------|------|--------|
| GET | `/categories` | Public/Auth (module filter) |
| GET | `/admin/categories` | Admin |
| POST | `/admin/categories` | Admin |
| PUT | `/admin/categories/:id` | Admin |
| DELETE | `/admin/categories/:id` | Admin |

---

## Contents

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/contents` | Public/Auth | Filter `module`, `type`, `category`, `q`; premium locked if not verified |
| GET | `/contents/:slug` | Public/Auth | Detail; `403` body premium if unverified |
| GET | `/contents/continue` | Verified | Continue watching/reading |
| POST | `/admin/contents` | Admin | Create |
| PUT | `/admin/contents/:id` | Admin | Update |
| DELETE | `/admin/contents/:id` | Admin | Soft delete |
| POST | `/admin/contents/:id/publish` | Admin | Publish |

Locked response shape for unverified:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "...",
    "is_premium": true,
    "locked": true,
    "thumbnail_url": "..."
  }
}
```

---

## Bookmarks & History

| Method | Path | Access |
|--------|------|--------|
| GET | `/bookmarks` | Verified |
| POST | `/bookmarks` | Verified `{ content_id }` |
| DELETE | `/bookmarks/:contentId` | Verified |
| POST | `/history/:contentId` | Verified | Upsert progress |
| GET | `/history` | Verified |

---

## Signals

| Method | Path | Access |
|--------|------|--------|
| GET | `/signals` | Verified |
| GET | `/signals/:id` | Verified |
| POST | `/admin/signals` | Admin |
| PUT | `/admin/signals/:id` | Admin |
| PATCH | `/admin/signals/:id/status` | Admin |

---

## Trading Journal

| Method | Path | Access |
|--------|------|--------|
| GET | `/journals` | Verified (own) |
| POST | `/journals` | Verified |
| GET | `/journals/:id` | Verified (own) |
| PUT | `/journals/:id` | Verified (own) |
| DELETE | `/journals/:id` | Verified (own) |
| GET | `/admin/journals` | Admin (read-only oversight, optional) |

---

## Bonus & Telegram

| Method | Path | Access |
|--------|------|--------|
| GET | `/bonuses` | Verified |
| GET | `/bonuses/:id/download` | Verified | Signed/local stream |
| GET | `/telegram-link` | Verified | From settings |
| CRUD | `/admin/bonuses` | Admin |

---

## Notifications

| Method | Path | Access |
|--------|------|--------|
| GET | `/notifications` | Auth |
| GET | `/notifications/unread-count` | Auth |
| POST | `/notifications/:id/read` | Auth |
| POST | `/notifications/read-all` | Auth |
| POST | `/admin/notifications/broadcast` | Admin |

---

## Support Tickets

| Method | Path | Access |
|--------|------|--------|
| POST | `/tickets` | Public/Auth |
| GET | `/tickets/me` | Auth |
| GET | `/tickets/:id` | Auth (own) / Admin |
| POST | `/tickets/:id/messages` | Auth (own) / Admin |
| GET | `/admin/tickets` | Admin |
| PATCH | `/admin/tickets/:id/status` | Admin |

---

## AI Chat

| Method | Path | Access |
|--------|------|--------|
| POST | `/ai/chat` | Public/Auth | `{ message, session_key? }` |
| GET | `/ai/conversations/me` | Auth | History |
| GET | `/admin/ai/conversations` | Admin | |
| GET | `/admin/ai/conversations/:id` | Admin | |

AI response payload:

```json
{
  "reply": "Open the Deposit Tutorial to continue.",
  "redirect_path": "/onboarding?step=4",
  "need_human": false,
  "suggested_ticket_topic": null
}
```

When fail count ≥ setting threshold → `need_human: true`.

---

## Dashboard

| Method | Path | Access |
|--------|------|--------|
| GET | `/member/dashboard` | Auth | Aggregated widgets (respects lock) |
| GET | `/admin/dashboard` | Admin | KPIs |

---

## Uploads

| Method | Path | Access |
|--------|------|--------|
| POST | `/uploads` | Auth | multipart; returns `key` + temp URL |
| POST | `/admin/uploads` | Admin | content media |

Query: `?purpose=avatar|proof|thumbnail|video|attachment|bonus`

---

## Users & Settings (Admin)

| Method | Path | Access |
|--------|------|--------|
| GET | `/admin/users` | Admin |
| GET | `/admin/users/:id` | Admin |
| PATCH | `/admin/users/:id` | Admin | role/status (super_admin for role elev.) |
| GET | `/admin/settings` | Admin |
| PUT | `/admin/settings/:key` | Super Admin preferred |

---

## Health

| Method | Path | Access |
|--------|------|--------|
| GET | `/health` | Public |
| GET | `/ready` | Public | DB ping |
