# Deployment

## Overview

| Piece | Target |
|-------|--------|
| Frontend | Vercel (`frontend/`) |
| Backend | Ubuntu VPS + systemd + Nginx |
| Database | Managed Postgres or VPS Postgres |
| Files | Local disk on VPS (`storage/`) behind Nginx |

## Frontend (Vercel)

Deploy **only** the Next.js app. The Go API stays on the VPS.

### Dashboard settings (required)

| Setting | Value |
|---------|--------|
| **Framework Preset** | **Next.js** (not “Services”) |
| **Root Directory** | `frontend` |
| Install Command | `npm install` (default) |
| Build Command | `npm run build` (default) |

If Framework was set to **Services**, change it back to **Next.js** — the Services builder is what produced empty output (`no functions or static directory`).

### Environment variables

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://api.example.com/v1` |
| `NEXT_PUBLIC_APP_NAME` | `IB Community` |

Do **not** use `/v1` on Vercel — that only works with the local Next rewrite proxy.

Redeploy after changing Root Directory / Framework. Smoke-test login against the production API.

### If you see `404: NOT_FOUND` (Code: NOT_FOUND)

That is Vercel’s **platform** 404 (empty / wrong project root), not a Next.js page.

1. Project → **Settings → Build and Deployment**
2. Framework = **Next.js** (not Services, not Other)
3. Root Directory = **`frontend`**
4. Output Directory = **leave default** (do not set `.next` or `frontend/.next`)
5. **Deployments** → open the **latest** deployment → confirm status Ready
6. Open **Output** tab — you should see Next.js routes, not an empty tree
7. Click **Visit** on that deployment (don’t reuse an old Services URL)

If Root Directory was wrong, change it, then **Redeploy** the latest commit.

## Backend (VPS)

### 1. Server layout

```text
/var/www/ib-community/
  backend/
    bin/api
    .env
  storage/
  nginx → sites-enabled
```

### 2. Production `.env` checklist

```bash
APP_ENV=production
APP_PORT=8080
APP_URL=https://api.example.com
FRONTEND_URL=https://app.example.com

DB_HOST=...
DB_PORT=5432
DB_USER=...
DB_PASSWORD=...
DB_NAME=ib_community
DB_SSLMODE=require

# openssl rand -hex 32
JWT_SECRET=

STORAGE_DRIVER=local
STORAGE_LOCAL_ROOT=/var/www/ib-community/storage
STORAGE_PUBLIC_BASE_URL=https://api.example.com/storage

# Keep false/unset in production — demo users/content will not seed
# SEED_DEMO=false
```

Rules enforced by the API when `APP_ENV=production`:

- `JWT_SECRET` ≥ 32 chars, not a known weak placeholder
- `FRONTEND_URL` required (CORS allowlist)
- Demo user/content seeds are **off** unless `SEED_DEMO=true`
- Password-reset tokens are **never** returned in JSON responses

### 3. systemd

```bash
sudo cp deploy/ib-api.service /etc/systemd/system/ib-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now ib-api
sudo systemctl status ib-api
```

### 4. Nginx

```bash
sudo cp nginx/sites/ib-community.conf /etc/nginx/sites-available/ib-community
# edit server_name + SSL paths
sudo ln -sf /etc/nginx/sites-available/ib-community /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

TLS: issue certs with Certbot, then uncomment `ssl_certificate` lines in the site config.

`/storage/proofs/` is denied publicly. Other `/storage/*` assets (thumbnails, etc.) are served by Nginx.

### 5. Deploy script

From your machine (WSL/macOS/Linux with `ssh` + Go):

```bash
chmod +x scripts/deploy.sh
DEPLOY_HOST=ubuntu@api.example.com ./scripts/deploy.sh
```

Builds `linux/amd64`, uploads `bin/api`, restarts systemd, curls `/ready`.

### 6. Health probes

- `GET /health` — process up
- `GET /ready` — database reachable

## Local helpers

```bash
./scripts/start.sh   # docker compose postgres
cd backend && go run ./cmd/api
cd frontend && npm run dev
```

## Hardening summary (P5)

- CORS locked to `FRONTEND_URL` outside development
- Global + path rate limits (`/v1/auth`, `/v1/uploads`, `/v1/ai`)
- Fiber timeouts, trusted proxy headers, sanitized 5xx errors
- Upload MIME sniff + purpose size caps; storage path containment
- Graceful shutdown (15s) + DB close
- Next.js security headers on the frontend
