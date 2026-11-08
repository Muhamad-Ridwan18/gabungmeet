# Deploy IB Community — `ibcomunity.webyouneed.id`

Panduan deploy production dengan domain:

| Role | URL |
|------|-----|
| **API (APP_URL)** | `https://ibcomunity.webyouneed.id` |
| **Frontend** | `https://ib-comunity.vercel.app` (Vercel) |
| **Storage** | `https://ibcomunity.webyouneed.id/storage` |

> Frontend tetap di Vercel. Domain `ibcomunity.webyouneed.id` mengarah ke **VPS backend** (Nginx → Go Fiber).

---

## 0. DNS

Di DNS domain `webyouneed.id`, buat:

| Type | Name | Value |
|------|------|--------|
| **A** | `ibcomunity` | `103.197.188.243_KAMU` |

Tunggu propagasi (bisa beberapa menit–jam). Cek: `ping ibcomunity.webyouneed.id`.

---

## 1. Server layout (Ubuntu VPS)

```text
/var/www/ib-community/
  backend/
    bin/api          ← binary Go
    .env             ← production env
  storage/           ← upload files
```

```bash
ssh user@103.197.188.243
sudo mkdir -p /var/www/ib-community/{backend/bin,storage}
sudo chown -R www-data:www-data /var/www/ib-community
sudo usermod -aG www-data $USER
sudo chmod -R g+w /var/www/ib-community
```

Clone repo (untuk ambil systemd + nginx config):

```bash
cd /tmp
git clone https://github.com/Muhamad-Ridwan18/ib-comunity.git
```

---

## 2. Postgres

Buat database & user (sesuaikan password sendiri):

```bash
sudo -u postgres psql
```

```sql
CREATE USER ibcommunity WITH PASSWORD 'GANTI_PASSWORD_KUAT';
CREATE DATABASE ib_community OWNER ibcommunity;
GRANT ALL PRIVILEGES ON DATABASE ib_community TO ibcommunity;
\q
```

Kalau DB di server yang sama dengan API → `DB_HOST=localhost`.  
Kalau DB remote → pastikan port `5432` terbuka hanya untuk IP VPS API.

---

## 3. File `.env` production

```bash
sudo nano /var/www/ib-community/backend/.env
```

Isi:

```bash
APP_NAME=IB Community
APP_ENV=production
APP_PORT=8080
APP_URL=https://ibcomunity.webyouneed.id
FRONTEND_URL=https://ib-comunity.vercel.app

DB_HOST=localhost
DB_PORT=5432
DB_USER=ibcommunity
DB_PASSWORD=GANTI_PASSWORD_KUAT
DB_NAME=ib_community
DB_SSLMODE=disable
# Pakai require kalau Postgres managed (RDS, dll):
# DB_SSLMODE=require

# Wajib ≥ 32 karakter. Generate:
# openssl rand -hex 32
JWT_SECRET=
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=30

STORAGE_DRIVER=local
STORAGE_LOCAL_ROOT=/var/www/ib-community-src/storage
STORAGE_PUBLIC_BASE_URL=https://ibcomunity.webyouneed.id/storage

AI_FAIL_THRESHOLD=3
```

**Jangan** set `SEED_DEMO=true` di production.  
**Jangan** commit file `.env` ke GitHub.

---

## 4. systemd

```bash
sudo cp /tmp/ib-comunity/deploy/ib-api.service /etc/systemd/system/ib-api.service
sudo systemctl daemon-reload
sudo systemctl enable ib-api
# start setelah binary di-upload (langkah 6)
```

Unit mengarah ke:

- WorkingDirectory: `/var/www/ib-community/backend`
- ExecStart: `/var/www/ib-community/backend/bin/api`
- EnvironmentFile: `/var/www/ib-community/backend/.env`

---

## 5. Nginx + SSL

```bash
sudo cp /tmp/ib-comunity/nginx/sites/ib-community.conf /etc/nginx/sites-available/ib-community
sudo nano /etc/nginx/sites-available/ib-community
```

Ganti semua `api.example.com` menjadi:

```text
ibcomunity.webyouneed.id
```

Aktifkan site:

```bash
sudo ln -sf /etc/nginx/sites-available/ib-community /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

SSL (Certbot):

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ibcomunity.webyouneed.id
```

Certbot biasanya mengisi `ssl_certificate` otomatis. Kalau masih dikomentari di conf, uncomment lalu:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Build & upload binary

### Opsi A — script (dari laptop / WSL)

Butuh Go + SSH:

```bash
cd /path/ke/ib-comunity
chmod +x scripts/deploy.sh
DEPLOY_HOST=user@103.197.188.243 ./scripts/deploy.sh
```

Lalu di server (pertama kali):

```bash
sudo systemctl enable --now ib-api
sudo systemctl status ib-api
```

### Opsi B — manual (Windows PowerShell / CMD)

> Jangan upload `api.exe`. Server Linux butuh binary bernama **`api`** (tanpa `.exe`).

Di laptop (folder `backend`):

```powershell
cd d:\DEV\laragon\www\go-react\backend
$env:GOOS="linux"; $env:GOARCH="amd64"; $env:CGO_ENABLED="0"
go build -trimpath -ldflags="-s -w" -o bin/api ./cmd/api
```

Cek file ada:

```powershell
dir bin\api
```

Upload ke server (ganti `user` & IP/host):

```powershell
scp bin\api user@103.197.188.243:/var/www/ib-community/backend/bin/api
```

Atau dari WinSCP/FileZilla: upload `backend/bin/api` ke `/var/www/ib-community/backend/bin/api`.

**Baru setelah file ada di server:**

```bash
ls -la /var/www/ib-community/backend/bin/api
sudo chmod +x /var/www/ib-community/backend/bin/api
sudo chown www-data:www-data /var/www/ib-community/backend/bin/api
sudo systemctl enable --now ib-api
sudo systemctl status ib-api
```

---

## 7. Frontend (Vercel)

Di Vercel project → **Settings → Environment Variables**:

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://ibcomunity.webyouneed.id/v1` |
| `NEXT_PUBLIC_APP_NAME` | `IB Community` |

Pastikan juga:

| Setting | Value |
|---------|--------|
| Framework | **Next.js** |
| Root Directory | **`frontend`** |

Redeploy frontend setelah env diubah.

`FRONTEND_URL` di backend `.env` harus cocok dengan origin browser (tanpa slash di akhir):

```bash
FRONTEND_URL=https://ib-comunity.vercel.app
```

Kalau nanti domain custom FE ditambahkan di Vercel, update `FRONTEND_URL` (boleh comma-separated).

---

## 8. Smoke test

```bash
# di server
curl -s http://127.0.0.1:8080/health
curl -s http://127.0.0.1:8080/ready

# dari luar
curl -s https://ibcomunity.webyouneed.id/health
curl -s https://ibcomunity.webyouneed.id/ready
```

Harus dapat JSON `success: true`.

Lalu di browser:

1. Buka `https://ib-comunity.vercel.app`
2. Register / login
3. Pastikan tidak ada error CORS di DevTools

Log API:

```bash
sudo journalctl -u ib-api -f
```

---

## 9. Update BE berikutnya

Cukup ulang upload binary:

```bash
DEPLOY_HOST=user@103.197.188.243 ./scripts/deploy.sh
```

Atau `scp` + `sudo systemctl restart ib-api`.

---

## Checklist singkat

- [ ] DNS A `ibcomunity` → IP VPS
- [ ] Postgres DB `ib_community` siap
- [ ] `/var/www/ib-community/backend/.env` production lengkap
- [ ] `JWT_SECRET` kuat (`openssl rand -hex 32`)
- [ ] systemd `ib-api` active
- [ ] Nginx + Certbot untuk `ibcomunity.webyouneed.id`
- [ ] Binary `bin/api` ter-upload
- [ ] `/health` & `/ready` OK via HTTPS
- [ ] Vercel `NEXT_PUBLIC_API_URL=https://ibcomunity.webyouneed.id/v1`
- [ ] Login FE tanpa CORS error

---

## Referensi file di repo

- `deploy/ib-api.service` — unit systemd
- `nginx/sites/ib-community.conf` — reverse proxy + storage
- `scripts/deploy.sh` — build & upload binary
- `docs/deployment.md` — catatan umum P5
