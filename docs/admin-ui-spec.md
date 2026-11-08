# Admin UI/UX Spec — IB Community Ops

Acuan desain untuk menyelaraskan seluruh halaman admin ke standar ops tool (Linear-like).  
Gunakan dokumen ini sebelum mengerjakan polish admin berikutnya.

---

## 1. Tujuan

Admin harus terasa seperti **operations console**, bukan landing/marketing:

- Scan cepat → decide cepat
- Informasi **orang-first**, bukan field-first
- Satu bahasa visual di semua modul admin
- Density tinggi, whitespace terkendali, full-width

**Bukan tujuan:** redesign brand member desk, menambah dashboard KPI berlebihan, atau meniru “admin template” generik.

---

## 2. Verdict baseline (saat spec ini dibuat)

| Area | Status | Catatan |
|------|--------|---------|
| Verifications layout | ✅ Master–detail full-width |
| List row info | ✅ People-first + aging |
| Konsistensi antar halaman | ✅ Overview/Content/Signals/Bonuses/Tickets aligned |
| Proof review | ⚠️ Key shown (download ACL still private) |
| Chat FAB di `/admin` | ✅ Hidden |
| Shared primitives | ✅ `AdminChrome.tsx` |


Target skor setelah implementasi: **8.5 / 10** untuk ops UX.

---

## 3. Prinsip desain (wajib)

1. **One job per view** — list + detail untuk antrian; form create di panel/drawer terpisah.
2. **People first** — baris list menampilkan identitas manusia dulu (nama, email), lalu data teknis (MT5, pair, dll).
3. **Full bleed content** — main admin tidak dikurung `max-w-6xl` ketat; page boleh full-height split.
4. **Sticky decisions** — Approve/Reject/Save sticky di bawah panel detail.
5. **Segmented filters** — filter status sebagai control kecil di header, bukan deretan pill longgar.
6. **No marketing chrome** — hindari hero, gradient besar, kicker “ADMIN” yang mendominasi.
7. **Density** — row height nyaman (~48–56px), bukan kartu tinggi dengan isi 1 baris.
8. **Empty that informs** — empty state singkat + konteks filter aktif.

---

## 4. Shell admin (global)

### Layout

```text
┌──────────┬─────────────────────────────────────────────┐
│ Sidebar  │ Top bar (Ops · email · theme · sign out)    │
│ ~208px   ├─────────────────────────────────────────────┤
│          │ Page content (full width of remaining)      │
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

### Rules

- Sidebar tetap Linear-style (nav teks, active pill).
- Top bar tinggi tetap (~48px).
- Main: `px` responsif, **tanpa** memaksa konten mengecil di tengah.
- Jangan render AI chat widget di route `/admin/*`.
- Mobile: sidebar → sheet; content stack vertikal (list dulu, detail di bawah / sheet).

### Navigation labels (pertahankan)

- Overview  
- Verifications  
- Content  
- Signals  
- Bonuses  
- Tickets  
- Member preview (secondary)

---

## 5. Pola halaman: Master–Detail (default untuk antrian)

Pakai untuk: **Verifications**, **Tickets**, (opsional Signals list).

```text
┌──────────────────────────────────┬────────────────────────┐
│ Header: Title + count + filters  │                        │
├──────────────────────────────────┤   Detail panel         │
│ Column headers                   │   (identity + fields)  │
│ Row                              │                        │
│ Row (selected)                   │   Sticky actions       │
│ Row                              │                        │
└──────────────────────────────────┴────────────────────────┘
```

### List row (minimum fields)

| Prioritas | Field | Contoh Verifications |
|-----------|--------|----------------------|
| Primary | Nama lengkap | Andre M Rizky… |
| Secondary | Email | andre1@gmail.com |
| Meta | Waktu / aging | 2h ago · Submitted |
| Technical | MT5 + server | 111 · IT |
| Status | Badge | Pending |

### Detail panel (minimum)

- Header: nama + email + status badge  
- Grid field teknis (MT5, server, submitted_at, account status)  
- Proof: **link/preview** jika ada, bukan hanya key mentah  
- Rejection reason (jika rejected / saat reject)  
- Sticky: Approve / Reject (atau Reply untuk tickets)

### API follow-up (jika FE belum punya data)

Agar list “people-first”, backend list admin sebaiknya include ringkas:

```json
{
  "id": "...",
  "mt5_account": "111",
  "broker_server": "IT",
  "status": "pending",
  "created_at": "...",
  "user": {
    "email": "andre1@gmail.com",
    "full_name": "Andre M Rizky Aryanto"
  }
}
```

Tanpa ini, FE terpaksa N+1 `get detail` hanya untuk nama — hindari.

---

## 6. Spec per halaman

### 6.1 Verifications (prioritas #1)

**Job:** approve/reject MT5 IB submissions.

**Harus ada**

- [ ] List menampilkan **nama + email + waktu + MT5 + status**
- [ ] Aging hint (mis. `> 24h` warn text) untuk pending lama
- [ ] Detail: identitas jelas, proof clickable/downloadable
- [ ] Reject wajib reason; Approve 1 klik dengan busy state
- [ ] Setelah action: hapus dari pending queue / refresh list + clear selection
- [ ] Filter: Pending | Approved | Rejected | All

**Jangan**

- Kartu kecil di tengah viewport
- Tabel 3 kolom tanpa identitas member
- Chat FAB menghalangi sticky actions

### 6.2 Overview

**Job:** ringkas antrian hari ini + lompat cepat.

**Harus ada**

- [ ] 3–4 metric ringkas (Pending verifications, Open tickets, …) — **bukan** hero
- [ ] Dua list pendek: latest pending verifications + latest tickets
- [ ] Klik row → deep-link ke detail halaman terkait (`?id=` atau path)

**Jangan**

- Empat kartu KPI besar yang sama isinya dengan list di bawah
- Whitespace vertikal berlebih antar section

### 6.3 Content

**Job:** kelola kategori + publish content.

**Arah layout**

- [ ] Split: Categories (kiri sempit) | Content list (kanan)
- [ ] Atau tabs: Categories / Contents
- [ ] Create form di drawer/panel, jangan form panjang di atas list kosong
- [ ] Row content: title, module, type, status, published_at

### 6.4 Signals

**Job:** publish/close setups.

**Arah layout**

- [ ] List signals (pair, direction, status, published_at)
- [ ] Panel create/edit di kanan atau drawer
- [ ] Direction badge buy/sell jelas; closed signals secondary

### 6.5 Bonuses

**Job:** CRUD resource member.

**Arah layout**

- [ ] List judul + active toggle + link
- [ ] Form add/edit di panel, bukan stack form + list berjarak jauh

### 6.6 Tickets

**Job:** balas support.

**Harus**

- [ ] Master–detail sama seperti Verifications
- [ ] List: topic, member email/name, status, last update
- [ ] Detail: thread messages + composer sticky
- [ ] Filter open/pending/closed

---

## 7. Komponen bersama (admin)

Buat / rapikan agar reusable:

| Komponen | Fungsi |
|----------|--------|
| `AdminPageHeader` | Title + description pendek + optional filter/actions (compact) |
| `AdminFilterSeg` | Segmented control status |
| `AdminSplit` | Grid list/detail full-height |
| `AdminListRow` | Row padat hover/selected |
| `AdminDetailPane` | Header + body scroll + footer sticky |
| `AdminEmpty` | Empty state ops (bukan EmptyState marketing) |

Hindari reuse berlebihan `PageHeader` bergaya member/marketing di ops pages.

---

## 8. Visual tokens (admin)

Ikuti token existing (`--accent #0052FF`, surfaces light):

- Border hairline `--border`
- Selected row: `accent-soft`
- Status: badge existing (`StatusBadge`)
- Font: Outfit display untuk title page saja; body Plus Jakarta
- Radius: tetap, tapi **jangan** over-card (hindari nested card di dalam split)

---

## 9. Urutan pengerjaan (disarankan)

1. **BE:** enrich `GET /admin/verifications` dengan `user.email` + `user.full_name` (+ optional proof URL)
2. **FE Verifications:** people-first rows + proof link + aging
3. **Shared admin primitives:** `AdminSplit`, `AdminFilterSeg`, `AdminDetailPane`
4. **Tickets:** terapkan pola yang sama
5. **Overview:** rapatkan + deep-link
6. **Content / Signals / Bonuses:** samakan bahasa layout

Jangan kerjakan semuanya sekali commit besar — 1 modul = 1 PR/commit jelas.

---

## 10. Definition of Done (per halaman)

Halaman admin dianggap selesai jika:

- [ ] Tidak ada “pulau konten” kecil di tengah layar lebar
- [ ] Identitas user terbaca dalam **1 detik** di list
- [ ] Aksi primer terlihat tanpa scroll berlebih (sticky bila perlu)
- [ ] Filter + empty + loading + error tertangani
- [ ] Mobile: list → detail usable (stack atau sheet)
- [ ] Tidak ada chat FAB di `/admin`
- [ ] Visual konsisten dengan halaman admin lain yang sudah di-polish

---

## 11. Out of scope (untuk putaran ini)

- Redesign member top-nav / landing
- Dark-first admin theme baru
- Realtime websocket queue
- Role permission matrix UI
- Bulk approve

---

## 12. Referensi file

| File | Peran |
|------|--------|
| `frontend/src/components/layout/AdminShell.tsx` | Shell global |
| `frontend/src/app/(admin)/admin/verifications/page.tsx` | Referensi master–detail |
| `frontend/src/app/(admin)/admin/page.tsx` | Overview |
| `frontend/src/app/(admin)/admin/tickets/page.tsx` | Target pola sama |
| `frontend/src/app/(admin)/admin/content/page.tsx` | Target rapikan |
| `frontend/src/app/(admin)/admin/signals/page.tsx` | Target rapikan |
| `frontend/src/app/(admin)/admin/bonuses/page.tsx` | Target rapikan |
| `docs/ui.md` | Arah visual produk umum |

---

**Cara pakai untuk agent:** baca dokumen ini dulu → kerjakan sesuai urutan §9 → centang DoD §10 → jangan menyimpang ke out of scope §11 tanpa konfirmasi user.
