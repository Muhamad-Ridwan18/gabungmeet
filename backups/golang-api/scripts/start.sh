#!/usr/bin/env bash
# Archived helper — paths assume this file lives at backups/golang-api/scripts/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
docker compose up -d
echo "Postgres up."
echo "Start API:  cd backend && php artisan serve --port=8081"
echo "Start FE:   cd frontend && npm run dev"
echo "(This script is under backups/golang-api/ — archive only.)"
