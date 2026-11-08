# Golang API archive (legacy)

Snapshot of the original **Go Fiber** backend and its ops assets, moved out of the active monorepo root:

```text
frontend/   → Next.js
backend/    → Laravel (active API)
```

## Contents

| Path | Description |
|------|-------------|
| `backend/` | Full Go Fiber source (Fiber, GORM, JWT, modules) |
| `deploy/ib-api.service` | systemd unit used on VPS |
| `scripts/deploy.sh` | linux/amd64 build + scp + restart (exits; archive only) |
| `scripts/start.sh` | old local bootstrap helper |
| `storage/` | MVP local upload folder layout (avatars, proofs, …) |

Related Go-era Nginx config still at repo root: `nginx/` (move here if you want a fully clean root).

## Restore / run (reference only)

```bash
cd backups/golang-api/backend
cp ../../../.env.example .env   # or restore production .env
go run ./cmd/api
```

Production VPS paths historically used `/var/www/ib-community/backend/bin/api` — see `docs/deploy-ibcomunity.md` (legacy).

**Do not treat this as the active API.** New development happens in `/backend` (Laravel).
