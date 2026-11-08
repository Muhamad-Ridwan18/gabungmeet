# IB Community — Architecture Design

> Status: **Design only** — await confirmation before implementation.
> Product: Private trading community gated by Introducing Broker (IB) verification.

---

## 1. Product Summary

IB Community is a private trading community platform. Guests can browse landing content (hook video, educational articles). Full premium modules unlock only after the user completes onboarding and an admin verifies their MT5 account under our IB.

**Not an LMS.** Content exists to educate and retain members; the core gate is broker verification.

---

## 2. Monorepo Structure

```text
ib-community/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml              # postgres (+ optional redis) for local/dev
│
├── frontend/                       # Next.js 15 → Vercel
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (landing)/          # public marketing
│   │   │   ├── (auth)/             # login, register, forgot/reset
│   │   │   ├── (onboarding)/       # 5-step wizard (auth required)
│   │   │   ├── (member)/           # verified + locked states
│   │   │   ├── (admin)/            # admin + super_admin
│   │   │   └── api/                # BFF only (auth cookies, proxies)
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn
│   │   │   ├── layout/
│   │   │   ├── marketing/
│   │   │   ├── onboarding/
│   │   │   ├── member/
│   │   │   ├── admin/
│   │   │   ├── chat/               # AI widget
│   │   │   ├── forms/
│   │   │   └── common/
│   │   ├── features/               # feature-sliced UI logic (optional)
│   │   ├── hooks/
│   │   ├── lib/                    # axios, query client, cn, env
│   │   ├── services/               # API client functions
│   │   ├── store/                  # Zustand (auth UI, UI prefs)
│   │   ├── types/
│   │   ├── constants/              # routes, roles, modules
│   │   ├── utils/
│   │   ├── styles/
│   │   └── middleware.ts           # Next route guards (role/status)
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── components.json
│   └── tsconfig.json
│
├── backend/                        # Go Fiber → Ubuntu VPS + Nginx + systemd
│   ├── cmd/
│   │   └── api/
│   │       └── main.go
│   ├── config/
│   │   ├── config.go
│   │   ├── database.go
│   │   ├── jwt.go
│   │   └── storage.go
│   ├── internal/                   # domain-first clean architecture
│   │   ├── auth/
│   │   ├── user/
│   │   ├── role/
│   │   ├── onboarding/
│   │   ├── verification/
│   │   ├── category/
│   │   ├── content/
│   │   ├── bookmark/
│   │   ├── history/
│   │   ├── signal/
│   │   ├── journal/
│   │   ├── bonus/
│   │   ├── notification/
│   │   ├── ticket/
│   │   ├── ai/
│   │   ├── upload/
│   │   ├── dashboard/
│   │   ├── settings/
│   │   └── shared/                 # dto, errors, pagination
│   │       ├── dto/
│   │       ├── errors/
│   │       └── pagination/
│   ├── pkg/
│   │   ├── database/
│   │   ├── storage/                # Storage interface + local / r2 adapters
│   │   ├── jwt/
│   │   ├── hasher/
│   │   ├── logger/
│   │   ├── mailer/
│   │   ├── validator/
│   │   └── response/               # standardized JSON envelope
│   ├── migrations/
│   ├── scripts/
│   ├── docs/
│   ├── go.mod
│   └── go.sum
│
├── storage/                        # local MVP uploads (gitignored contents)
│   ├── avatars/
│   ├── banners/
│   ├── categories/
│   ├── thumbnails/
│   ├── contents/
│   │   ├── videos/
│   │   └── articles/               # optional rich-media embeds
│   ├── proofs/                     # deposit / verification proofs
│   ├── bonuses/
│   ├── attachments/                # ticket attachments
│   └── temp/
│
├── nginx/
│   ├── nginx.conf
│   └── sites/
│       └── ib-community.conf
│
├── scripts/
│   ├── start.sh
│   ├── deploy.sh
│   ├── backup.sh
│   └── restore.sh
│
├── backups/
│   ├── database/
│   ├── storage/
│   └── logs/
│
└── docs/
    ├── architecture.md             # this file
    ├── database.md
    ├── api.md
    ├── flows.md
    ├── ui.md
    └── deployment.md
```

### Backend domain package layout (per module)

```text
internal/content/
├── entity.go          # GORM models / domain entities
├── dto.go             # request/response DTOs
├── repository.go      # interface
├── repository_gorm.go
├── service.go         # interface
├── service_impl.go
├── handler.go         # Fiber handlers
└── routes.go
```

No parallel `app/handlers` + `internal/domain` split — **domain-first only**.

---

## 3. Backend Architecture

```text
HTTP (Fiber)
    → Middleware (CORS, rate limit, request ID, logger, recover)
    → Auth middleware (JWT optional / required)
    → Role & status middleware (permission gates)
    → Handler (validate input → call service)
    → Service (business rules)
    → Repository (GORM / PostgreSQL)
    → Storage interface (files)
```

### Layers

| Layer | Responsibility |
|-------|----------------|
| Handler | HTTP, validation binding, status codes |
| Service | Business rules, orchestration, transactions |
| Repository | Persistence only |
| pkg/* | Cross-cutting infra (no business logic) |

### Storage abstraction

```go
type ObjectStorage interface {
    Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) (ObjectInfo, error)
    Delete(ctx context.Context, key string) error
    URL(key string) string
    Exists(ctx context.Context, key string) (bool, error)
}
```

- MVP: `LocalStorage` → `./storage/...` served via Nginx or Fiber static (restricted)
- Later: `R2Storage` / Stream adapter — **same interface**, swap in config

Business modules never call filesystem or S3 SDKs directly.

---

## 4. Frontend Architecture

```text
UI (App Router)
  → middleware.ts (cookie/session presence + route group guards)
  → Server Components (landing, SEO shells)
  → Client Components (forms, dashboards, chat)
  → TanStack Query (server state)
  → Zustand (client UI state: sidebar, theme, chat open)
  → Axios services (typed API clients)
  → Go REST API
```

### State ownership

| Concern | Tool |
|---------|------|
| Auth session token / user | httpOnly cookie (BFF) + Zustand hydrate for UI |
| Lists, detail, mutations | TanStack Query |
| Theme, sidebar, chat drawer | Zustand |
| Forms | RHF + Zod |

### Route groups ↔ access

| Group | Who |
|-------|-----|
| `(landing)` | Guest + all |
| `(auth)` | Guest only (redirect if logged in) |
| `(onboarding)` | Registered → Pending Verification |
| `(member)` | Authenticated; modules locked until `verified` |
| `(admin)` | `admin`, `super_admin` |

---

## 5. Roles, Status, Permissions

### Roles (RBAC)

| Role | Scope |
|------|-------|
| `member` | Default after register |
| `admin` | Admin panel (no super-critical settings) |
| `super_admin` | Full settings, role assignment |

Guest is unauthenticated (no DB role).

### Account lifecycle status (separate from role)

| Status | Meaning |
|--------|---------|
| `registered` | Just signed up |
| `onboarding` | In 5-step wizard |
| `pending_verification` | Step 5 submitted, waiting admin |
| `verified` | MT5 approved — premium unlocked |
| `rejected` | Verification rejected — can resubmit |
| `locked` | Admin locked access |

Permissions are checked as: **role ∩ status ∩ resource action** via middleware.

Example: Academy premium content requires `status == verified` (or admin).

---

## 6. Module Map

| Module | Access | Data source |
|--------|--------|-------------|
| Landing / Hook / Education | Public | `contents` (non-premium) + settings |
| Onboarding | Auth | `onboarding_progress`, `verification_requests` |
| Academy | Verified (list visible locked) | `contents` + `categories` (`module=academy`) |
| Psychology | Verified | `contents` (`module=psychology`) |
| Daily Analysis | Verified | `contents` (`module=daily_analysis`) |
| Signals | Verified | `signals` |
| Trading Journal | Verified | `trading_journals` (per user) |
| Bonus Member | Verified | `bonuses` + Telegram link setting |
| Support Tickets | Auth | `tickets`, `ticket_messages` |
| AI Chat | Public/Auth | `ai_conversations`, knowledge rules |
| Admin | Admin+ | all |

**Single `contents` table** for video/article across Academy, Psychology, Daily Analysis, and public education. Differentiate by `module` + `type` + `is_premium`.

---

## 7. Security Baseline

- JWT access + refresh (refresh in httpOnly cookie via BFF preferred)
- bcrypt/argon2id password hashing
- Fiber rate limiter on auth + AI + upload
- Zod (FE) + go-playground/validator (BE)
- GORM parameterized queries
- Sanitize HTML for articles (XSS)
- CSRF: SameSite cookies + origin check for cookie auth
- Upload: MIME allowlist, size caps, random keys, no executable types
- Nginx: TLS, body size limits, static path ACLs for proofs

---

## 8. Deployment Topology

```text
[Browser]
    → Vercel (Next.js)
        → REST → api.domain.com
[Ubuntu VPS]
    Nginx → Fiber (:8080)
         → PostgreSQL
         → Local ./storage (MVP)
    systemd: ib-api.service
```

Later: R2 for objects; Cloudflare Stream for video delivery; API URL unchanged.

---

## 9. Design Decisions (locked for MVP)

1. Monorepo name: **`ib-community`** (workspace root; not project-lms).
2. Backend: **domain-first** clean architecture under `internal/`.
3. One **Content** entity for all article/video modules.
4. **Role** + **status** split (not one flat role enum for lifecycle).
5. Storage behind **interface** from day one.
6. Next `app/api` is **BFF only** — no business logic.
7. Premium modules render locked UI before verification; API also enforces.
8. UI accent: **emerald** (dark-first).
9. AI MVP: **rule / knowledge base** with page redirects; escalate after 3 failures.

---

## 10. Implementation Phases (after confirmation)

| Phase | Scope |
|-------|-------|
| P0 | Scaffold monorepo, Docker Postgres, config, response envelope, auth |
| P1 | Users, roles, onboarding, verification admin |
| P2 | Categories, content CRUD, bookmarks, history |
| P3 | Member dashboard, signals, journal, bonus |
| P4 | Notifications, tickets, AI widget |
| P5 | Landing polish, hardening, deploy scripts | ✅ |

---

**Next:** Review `docs/database.md`, `docs/api.md`, `docs/flows.md`, `docs/ui.md`, then confirm to begin P0 scaffolding.
