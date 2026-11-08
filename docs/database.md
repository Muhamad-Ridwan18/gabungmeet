# IB Community — Database Schema

> PostgreSQL, normalized. Soft deletes where useful (`deleted_at`).
> Timestamps: `created_at`, `updated_at` on all mutable tables.

---

## ERD (Logical)

```text
roles 1──* role_permissions *──1 permissions
users *──1 roles
users 1──1 profiles
users 1──1 onboarding_progress
users 1──* verification_requests
users 1──* bookmarks
users 1──* view_histories
users 1──* trading_journals
users 1──* notifications
users 1──* tickets
users 1──* ai_conversations
tickets 1──* ticket_messages
categories 1──* contents
contents 1──* bookmarks
contents 1──* view_histories
settings (key-value / typed rows)
signals (standalone)
bonuses (standalone files/links)
daily analysis → contents.module = 'daily_analysis'
```

---

## Tables

### roles

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR(50) UNIQUE | `member`, `admin`, `super_admin` |
| description | TEXT | |
| created_at | TIMESTAMPTZ | |

### permissions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| code | VARCHAR(100) UNIQUE | e.g. `content.create`, `verification.approve` |
| description | TEXT | |

### role_permissions

| Column | Type |
|--------|------|
| role_id | UUID FK → roles |
| permission_id | UUID FK → permissions |
| PK (role_id, permission_id) |

### users

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | CITEXT UNIQUE | |
| password_hash | TEXT | |
| role_id | UUID FK → roles | |
| status | VARCHAR(32) | `registered`, `onboarding`, `pending_verification`, `verified`, `rejected`, `locked` |
| email_verified_at | TIMESTAMPTZ NULL | optional |
| remember_token_hash | TEXT NULL | optional device remember |
| last_login_at | TIMESTAMPTZ NULL | |
| created_at / updated_at / deleted_at | | |

### profiles

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK/FK → users | |
| full_name | VARCHAR(150) | |
| phone | VARCHAR(30) NULL | |
| telegram_username | VARCHAR(64) NULL | |
| avatar_key | VARCHAR(255) NULL | storage key |
| timezone | VARCHAR(64) DEFAULT `UTC` | |
| bio | TEXT NULL | |

### onboarding_progress

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK/FK | |
| current_step | SMALLINT | 1–5 |
| step1_done_at | TIMESTAMPTZ NULL | watch tutorial |
| step2_done_at | TIMESTAMPTZ NULL | IB register ack |
| step3_done_at | TIMESTAMPTZ NULL | MT5 submitted |
| step4_done_at | TIMESTAMPTZ NULL | deposit tutorial / proof |
| step5_done_at | TIMESTAMPTZ NULL | entered waiting |
| completed_at | TIMESTAMPTZ NULL | |

Users cannot skip: service only advances if previous step timestamps set.

### verification_requests

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| mt5_account | VARCHAR(64) | |
| broker_server | VARCHAR(128) | |
| proof_key | VARCHAR(255) NULL | deposit proof |
| status | VARCHAR(32) | `pending`, `approved`, `rejected` |
| rejection_reason | TEXT NULL | |
| reviewed_by | UUID NULL FK → users | |
| reviewed_at | TIMESTAMPTZ NULL | |
| created_at / updated_at | | |

History = all rows per user (resubmits create new rows).

### categories

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| module | VARCHAR(32) | `academy`, `psychology`, `daily_analysis`, `landing` |
| name | VARCHAR(120) | |
| slug | VARCHAR(150) UNIQUE | |
| description | TEXT NULL | |
| thumbnail_key | VARCHAR(255) NULL | |
| sort_order | INT DEFAULT 0 | |
| is_active | BOOLEAN DEFAULT true | |

### contents

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| category_id | UUID FK NULL | |
| module | VARCHAR(32) | denormalized for fast filter |
| type | VARCHAR(16) | `video`, `article` |
| title | VARCHAR(255) | |
| slug | VARCHAR(255) UNIQUE | |
| excerpt | TEXT NULL | |
| body | TEXT NULL | article HTML/MD |
| thumbnail_key | VARCHAR(255) NULL | |
| video_key | VARCHAR(255) NULL | local path / later Stream id |
| duration_sec | INT NULL | videos |
| is_premium | BOOLEAN DEFAULT true | |
| status | VARCHAR(16) | `draft`, `published`, `archived` |
| published_at | TIMESTAMPTZ NULL | |
| created_by | UUID FK | |
| created_at / updated_at / deleted_at | | |

Indexes: `(module, status, published_at DESC)`, `(type)`, full-text optional on `title`.

### bookmarks

| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK |
| content_id | UUID FK |
| created_at | TIMESTAMPTZ |
| UNIQUE(user_id, content_id) |

### view_histories

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| content_id | UUID FK | |
| progress_pct | NUMERIC(5,2) DEFAULT 0 | |
| last_position_sec | INT DEFAULT 0 | video resume |
| completed | BOOLEAN DEFAULT false | |
| last_viewed_at | TIMESTAMPTZ | |
| UNIQUE(user_id, content_id) | | Continue watching/reading |

### signals

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| pair | VARCHAR(32) | e.g. XAUUSD |
| direction | VARCHAR(8) | `buy`, `sell` |
| entry | NUMERIC | |
| sl | NUMERIC NULL | |
| tp | NUMERIC NULL | |
| status | VARCHAR(16) | `active`, `closed`, `cancelled` |
| result | VARCHAR(16) NULL | `win`, `loss`, `be` |
| analysis | TEXT NULL | |
| chart_key | VARCHAR(255) NULL | |
| published_at | TIMESTAMPTZ | |
| created_by | UUID FK | |
| created_at / updated_at | | |

### trading_journals

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | private |
| traded_at | TIMESTAMPTZ | |
| pair | VARCHAR(32) | |
| direction | VARCHAR(8) | |
| entry / exit / sl / tp | NUMERIC NULL | |
| result | VARCHAR(16) NULL | |
| rr | NUMERIC NULL | |
| notes | TEXT NULL | |
| emotion | VARCHAR(64) NULL | psychology tag |
| screenshot_key | VARCHAR(255) NULL | |
| created_at / updated_at / deleted_at | | |

### bonuses

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| title | VARCHAR(255) | |
| description | TEXT NULL | |
| file_key | VARCHAR(255) NULL | downloadable |
| external_url | TEXT NULL | |
| is_active | BOOLEAN | |
| sort_order | INT | |
| created_at / updated_at | | |

### notifications

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| type | VARCHAR(64) | `verification_approved`, `new_signal`, ... |
| title | VARCHAR(255) | |
| body | TEXT | |
| link | VARCHAR(255) NULL | deep link path |
| meta | JSONB NULL | |
| read_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ | |

### tickets

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID NULL FK | nullable if guest form |
| name | VARCHAR(150) | |
| telegram_username | VARCHAR(64) | |
| email | VARCHAR(255) NULL | |
| topic | VARCHAR(120) | |
| description | TEXT | |
| status | VARCHAR(32) | `open`, `in_progress`, `solved`, `closed` |
| assigned_to | UUID NULL FK | |
| created_at / updated_at | | |

### ticket_messages

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| ticket_id | UUID FK | |
| sender_id | UUID NULL FK | admin/user |
| sender_type | VARCHAR(16) | `user`, `admin`, `system` |
| message | TEXT | |
| attachment_key | VARCHAR(255) NULL | |
| created_at | TIMESTAMPTZ | |

### ai_conversations

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID NULL FK | |
| session_key | VARCHAR(64) | anonymous cookie id |
| created_at / updated_at | | |

### ai_messages

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| conversation_id | UUID FK | |
| role | VARCHAR(16) | `user`, `assistant`, `system` |
| content | TEXT | |
| intent | VARCHAR(64) NULL | classified |
| redirect_path | VARCHAR(255) NULL | if AI points to page |
| failed_attempt | BOOLEAN DEFAULT false | |
| created_at | TIMESTAMPTZ | |

### ai_knowledge (optional MVP seed)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| topic | VARCHAR(64) | deposit, mt5, telegram, ... |
| keywords | TEXT[] | |
| answer | TEXT | |
| redirect_path | VARCHAR(255) NULL | |
| is_active | BOOLEAN | |
| priority | INT | |

### settings

| Column | Type | Notes |
|--------|------|-------|
| key | VARCHAR(100) PK | e.g. `telegram_invite_url`, `ib_register_url` |
| value | JSONB | |
| updated_by | UUID NULL | |
| updated_at | TIMESTAMPTZ | |

### password_resets

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| token_hash | TEXT | |
| expires_at | TIMESTAMPTZ | |
| used_at | TIMESTAMPTZ NULL | |

### refresh_tokens (if rotating refresh)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| token_hash | TEXT | |
| expires_at | TIMESTAMPTZ | |
| revoked_at | TIMESTAMPTZ NULL | |
| user_agent | TEXT NULL | |
| ip | INET NULL | |

---

## Seed Data (MVP)

- Roles: member, admin, super_admin
- Permissions mapped to admin actions
- Default settings: IB link, Telegram URL, AI fail threshold (e.g. 3)
- Sample landing categories + hook video content (`is_premium=false`)

---

## Notes

- **Daily Analysis** is not a separate table — it is `contents` with `module = daily_analysis`.
- **Signals / Journals / Bonuses / Tickets / AI** stay dedicated tables (different shapes & access rules).
- Soft-delete users and contents; hard-delete proofs only via admin retention policy.
