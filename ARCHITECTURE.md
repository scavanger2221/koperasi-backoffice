# Arsitektur & Planning — Koperasi Backoffice PWA

---

## 1. Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Monorepo** | Turborepo | 1 cmd jalanin semua app, cache otomatis |
| **Frontend Mobile (Anggota)** | React + Vite + PWA | VitePWA plugin, SPA, installable |
| **Frontend Admin (Desktop)** | React + Vite | Satu stack, beda app |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Design system reusable |
| **Backend API** | Hono (Node.js) | TypeScript, battle-tested, middleware-native |
| **Database** | SQLite (better-sqlite3) | Simple total, zero setup |
| **ORM** | Drizzle | Type-safe, performa, SQL-like |
| **Auth** | Hono Auth + JWT (hono/jwt) | Token-based, RBAC |
| **Validation** | Zod | Shared antara frontend & backend |
| **Cache** | Redis | Session, rate limiter |

---

## 2. Struktur Folder

```
koperasi-backoffice/
├── apps/
│   ├── mobile/                 # Mobile PWA (anggota) — React + Vite
│   │   ├── src/
│   │   │   ├── pages/          # React Router pages
│   │   │   ├── components/     # UI components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Utilities, API client
│   │   │   └── store/          # Zustand / state
│   │   ├── public/             # Assets + PWA manifest
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── admin/                  # Desktop dashboard (pengurus) — React + Vite
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                    # Backend — Hono (Node.js)
│       ├── src/
│       │   ├── routes/         # API routes
│       │   ├── controllers/    # Request handlers
│       │   ├── services/       # Business logic
│       │   ├── middleware/     # Auth, validation, error
│       │   └── lib/            # Config, db, logger
│       ├── database/
│       │   ├── migrations/     # Drizzle migrations
│       │   └── schema/         # Drizzle schema definitions
│       ├── drizzle.config.ts
│       └── package.json
│
├── packages/
│   ├── ui/                     # Shared UI (shadcn/ui components)
│   │   ├── src/
│   │   │   ├── ui/            # Button, Input, Card, Modal, dll
│   │   │   └── forms/         # FormField, Select, DatePicker
│   │   └── package.json
│   │
│   ├── shared/                 # Shared types, schemas, utils
│   │   ├── src/
│   │   │   ├── types/         # TypeScript interfaces
│   │   │   ├── schemas/       # Zod validation schemas
│   │   │   └── constants/     # Enums, configs
│   │   └── package.json
│   │
│   ├── database/               # Drizzle schema + migrations
│   │   ├── src/
│   │   │   ├── schema/        # Drizzle schema definitions
│   │   │   └── seed/          # Seed data
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   └── config/                 # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── turbo.json                  # Turborepo pipeline
├── package.json                # Root workspace
└── .env.example
```

---

## 3. Database Schema

### Entity Relationship (Core)

```
Anggota ──┬── Simpanan (Pokok, Wajib, Sukarela, Deposito)
          ├── Pinjaman ── Angsuran
          ├── Transaksi
          ├── SHU
          └── User (akun login)

Koperasi ──┬── Pengurus/Role
           ├── UnitUsaha (Toko, PPOB, Jasa)
           ├── Produk
           ├── Kategori
           └── PeriodeBuku (tahun buku)

Transaksi ──┬── Jurnal
            ├── BukuBesar
            └── Laporan
```

### Detail Tabel

#### `koperasi`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| nama | varchar | Nama koperasi |
| alamat | text | |
| badan_hukum | varchar | Nomor badan hukum |
| jenis | enum | KSP, KSU, Kopdes, Syariah |
| logo | varchar | URL logo |
| created_at | timestamp | |

#### `anggota`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| koperasi_id | uuid FK | |
| no_anggota | varchar | Nomor induk anggota |
| nik | varchar | NIK KTP |
| nama | varchar | |
| tempat_lahir | varchar | |
| tanggal_lahir | date | |
| alamat | text | |
| pekerjaan | varchar | |
| no_telepon | varchar | |
| email | varchar | |
| foto | varchar | URL foto |
| status | enum | aktif, nonaktif, keluar |
| tanggal_daftar | date | |
| tanggal_keluar | date? | |
| created_at | timestamp | |

#### `simpanan`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| anggota_id | uuid FK | |
| jenis | enum | pokok, wajib, sukarela, deposito |
| jumlah | decimal(15,2) | |
| tanggal | date | |
| metode_bayar | enum | tunai, transfer, QRIS |
| keterangan | text | |
| created_at | timestamp | |

#### `simpanan_wajib_rules`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| koperasi_id | uuid FK | |
| jumlah | decimal(15,2) | Nominal per bulan |
| hari_jatuh_tempo | int | Tanggal auto-tagih |
| aktif | boolean | |

#### `deposito`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| anggota_id | uuid FK | |
| jumlah | decimal(15,2) | |
| bunga_persen | decimal(5,2) | % per tahun |
| jangka_waktu | int | Bulan |
| tanggal_mulai | date | |
| tanggal_jatuh_tempo | date | |
| status | enum | aktif, dicairkan, rollover |
| created_at | timestamp | |

#### `pinjaman`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| anggota_id | uuid FK | |
| no_pinjaman | varchar | |
| jenis_pinjaman | varchar | |
| jumlah | decimal(15,2) | |
| bunga_persen | decimal(5,2) | % |
| jenis_bunga | enum | flat, efektif, anuitas, syariah |
| jangka_waktu | int | Bulan |
| angsuran_per_bulan | decimal(15,2) | |
| tanggal_pengajuan | date | |
| tanggal_acc | date? | |
| tanggal_pencairan | date? | |
| tanggal_jatuh_tempo | date | |
| status | enum | diajukan, disetujui, dicairkan, lunas, macet |
| keterangan | text | |
| created_at | timestamp | |

#### `angsuran`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| pinjaman_id | uuid FK | |
| angsuran_ke | int | |
| tanggal_jatuh_tempo | date | |
| tanggal_bayar | date? | |
| jumlah_pokok | decimal(15,2) | |
| jumlah_bunga | decimal(15,2) | |
| denda | decimal(15,2) | |
| total_bayar | decimal(15,2) | |
| status | enum | belum_lunas, lunas, telat |
| metode_bayar | enum | tunai, transfer, QRIS, auto_debet |
| created_at | timestamp | |

#### `transaksi`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| koperasi_id | uuid FK | |
| anggota_id | uuid FK? | Null untuk non-anggota |
| tipe | enum | simpanan, pinjaman, angsuran, penjualan, pembelian, biaya |
| jumlah | decimal(15,2) | |
| debit_kredit | enum | debit, kredit |
| tanggal | date | |
| keterangan | text | |
| reference_id | uuid? | ID dari tabel asal |
| created_at | timestamp | |

#### `jurnal`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| transaksi_id | uuid FK | |
| no_jurnal | varchar | |
| tanggal | date | |
| akun | varchar | Kode akun |
| debit | decimal(15,2) | |
| kredit | decimal(15,2) | |
| keterangan | text | |
| created_at | timestamp | |

#### `akun` (Chart of Accounts)
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| koperasi_id | uuid FK | |
| kode | varchar | e.g. 1-1000 |
| nama | varchar | e.g. Kas |
| tipe | enum | aset, kewajiban, ekuitas, pendapatan, biaya |
| induk_id | uuid FK? | Parent akun |
| saldo_normal | enum | debit, kredit |

#### `periode_buku`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| koperasi_id | uuid FK | |
| tahun | int | |
| tanggal_mulai | date | |
| tanggal_selesai | date | |
| status | enum | buka, tutup |

#### `shu`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| koperasi_id | uuid FK | |
| periode_buku_id | uuid FK | |
| total_shu | decimal(15,2) | |
| alokasi_anggota | decimal(5,2) | % ke anggota |
| alokasi_cadangan | decimal(5,2) | % |
| alokasi_pengurus | decimal(5,2) | % |
| alokasi_pendidikan | decimal(5,2) | % |
| alokasi_sosial | decimal(5,2) | % |
| alokasi_lain | decimal(5,2) | % |
| status | enum | draft, dikonfirmasi, dibagikan |
| created_at | timestamp | |

#### `shu_anggota`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| shu_id | uuid FK | |
| anggota_id | uuid FK | |
| jma | decimal(15,2) | Jasa Modal Anggota |
| jua | decimal(15,2) | Jasa Usaha Anggota |
| total | decimal(15,2) | |
| status | enum | belum_dibagikan, dibagikan |
| created_at | timestamp | |

#### `unit_usaha`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| koperasi_id | uuid FK | |
| nama | varchar | e.g. Toko Sembako |
| tipe | enum | toko, ppob, jasa, produksi |
| aktif | boolean | |

#### `produk`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| unit_usaha_id | uuid FK | |
| nama | varchar | |
| sku | varchar | |
| harga | decimal(15,2) | |
| stok | int | |
| kategori_id | uuid FK? | |
| aktif | boolean | |

#### `users` (Akun Login)
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| anggota_id | uuid FK? | Null untuk admin non-anggota |
| koperasi_id | uuid FK | |
| email | varchar unique | |
| password | varchar | Hash |
| role | enum | super_admin, admin_koperasi, pengurus, bendahara, pengawas, anggota |
| aktif | boolean | |
| last_login | timestamp? | |
| created_at | timestamp | |

---

## 4. API Endpoints

### Auth
```
POST   /api/auth/login            → Login
POST   /api/auth/register         → Register anggota
POST   /api/auth/logout           → Logout
POST   /api/auth/refresh          → Refresh token
GET    /api/auth/me               → Profile user saat ini
```

### Anggota
```
GET    /api/anggota               → List anggota (admin)
GET    /api/anggota/:id           → Detail anggota
POST   /api/anggota               → Tambah anggota
PATCH  /api/anggota/:id           → Update anggota
DELETE /api/anggota/:id           → Nonaktifkan anggota
GET    /api/anggota/:id/simpanan  → Riwayat simpanan
GET    /api/anggota/:id/pinjaman  → Riwayat pinjaman
GET    /api/anggota/:id/shu       → Riwayat SHU
```

### Simpanan
```
GET    /api/simpanan              → List simpanan
GET    /api/simpanan/:id          → Detail
POST   /api/simpanan              → Catat setoran (admin)
GET    /api/simpanan/saya         → Simpanan anggota login
POST   /api/simpanan/setor        → Setor via mobile
GET    /api/simpanan/mutasi       → Mutasi simpanan
```

### Pinjaman
```
GET    /api/pinjaman              → List pinjaman (admin)
GET    /api/pinjaman/:id          → Detail + angsuran
POST   /api/pinjaman              → Ajukan pinjaman
PATCH  /api/pinjaman/:id/approve  → Approve (pengurus)
PATCH  /api/pinjaman/:id/cair    → Cairkan (bendahara)
GET    /api/pinjaman/saya         → Pinjaman anggota login
POST   /api/pinjaman/:id/bayar   → Bayar angsuran
```

### SHU
```
GET    /api/shu                   → List periode SHU
POST   /api/shu/hitung            → Hitung SHU otomatis
GET    /api/shu/:id               → Detail SHU
GET    /api/shu/:id/anggota       → Rincian per anggota
PATCH  /api/shu/:id/konfirmasi    → Konfirmasi SHU
GET    /api/shu/saya              → SHU anggota login
```

### Laporan & RAT
```
GET    /api/laporan/neraca        → Neraca
GET    /api/laporan/laba-rugi     → Laba rugi / SHU
GET    /api/laporan/arus-kas      → Arus kas
GET    /api/laporan/buku-besar    → Buku besar
GET    /api/rat                   → List RAT
POST   /api/rat                   → Buat RAT
GET    /api/rat/:id               → Detail RAT
POST   /api/rat/:id/vote          → Voting
GET    /api/rat/:id/export        → Export PDF
```

### Pembukuan
```
GET    /api/jurnal                → Jurnal
GET    /api/akun                  → Chart of accounts
POST   /api/jurnal                → Entry jurnal manual
GET    /api/neraca-saldo          → Neraca saldo
```

### Unit Usaha
```
GET    /api/unit-usaha            → List unit usaha
POST   /api/unit-usaha            → Tambah unit
GET    /api/produk                → List produk
POST   /api/produk                → Tambah produk
PATCH  /api/produk/:id/stok       → Update stok
POST   /api/penjualan             → Transaksi POS
GET    /api/penjualan             → Riwayat penjualan
```

### Dashboard
```
GET    /api/dashboard/ringkasan   → Total anggota, simpanan, pinjaman, SHU
GET    /api/dashboard/grafik      → Data grafik
GET    /api/dashboard/kesehatan   → Indikator kesehatan koperasi
GET    /api/dashboard/aktivitas   → Aktivitas terkini
```

---

## 5. Frontend Routes

### 📱 Mobile (Anggota) — `apps/mobile/src/pages`

```tsx
/                           → Landing / Login
/auth/login                 → Login
/auth/register              → Registrasi anggota

/beranda                    → Dashboard anggota (saldo, SHU, notifikasi)
/simpanan                   → Saldo & mutasi simpanan
/simpanan/setor             → Setor simpanan
/pinjaman                   → Daftar pinjaman
/pinjaman/ajukan            → Ajukan pinjaman
/pinjaman/:id               → Detail pinjaman + angsuran
/pinjaman/:id/bayar         → Bayar angsuran
/shu                        → SHU diterima
/profil                     → Profil & kartu anggota QR
/profil/edit                → Edit profil
/rat                        → Daftar RAT
/rat/:id                    → Detail RAT + voting
/deposito                   → Deposito
```

### 💻 Desktop (Admin) — `apps/admin/src/pages`

```
/admin/login                → Login admin
/admin/beranda              → Dashboard

# Manajemen
/admin/anggota              → Daftar anggota
/admin/anggota/tambah       → Tambah anggota
/admin/anggota/:id          → Detail anggota

# Simpanan
/admin/simpanan             → Semua simpanan
/admin/simpanan/setor       → Catat setoran
/admin/simpanan/wajib       → Atur simpanan wajib

# Pinjaman
/admin/pinjaman             → Semua pinjaman
/admin/pinjaman/:id         → Detail + approve

# Pembukuan
/admin/pembukuan/jurnal     → Jurnal
/admin/pembukuan/buku-besar → Buku besar
/admin/pembukuan/neraca     → Neraca saldo
/admin/pembukuan/akun       → Chart of accounts

# Laporan
/admin/laporan/neraca       → Neraca
/admin/laporan/laba-rugi    → Laba rugi
/admin/laporan/arus-kas     → Arus kas
/admin/laporan/shu          → SHU

# RAT
/admin/rat                  → Daftar RAT
/admin/rat/buat             → Buat RAT baru
/admin/rat/:id              → Detail RAT

# SHU
/admin/shu                  → Kelola SHU
/admin/shu/hitung           → Hitung SHU
/admin/shu/:id              → Detail alokasi

# Unit Usaha
/admin/unit-usaha           → Kelola unit
/admin/produk               → Kelola produk
/admin/penjualan            → Riwayat penjualan

# Pengaturan
/admin/settings             → Pengaturan koperasi
/admin/users                → Manajemen user
/admin/audit-log            → Log aktivitas
```

---

## 6. PWA Strategy

### Service Worker
- **Offline-first** untuk data anggota simpanan & pinjaman (cache di IndexedDB)
- **Network-first** untuk data real-time (saldo, status pinjaman)
- **Background sync** untuk pengajuan pinjaman offline → submit pas online
- **Push notifications** untuk:
  - Jatuh tempo angsuran
  - Tagihan simpanan wajib
  - Status pengajuan pinjaman
  - Undangan RAT
  - SHU dibagikan

### Manifest
- `display: standalone` — kaya native app
- `orientation: portrait` untuk mobile
- `theme_color: #16a34a` (green — koperasi)
- Icon sizes: 192x192, 512x512

### Arsitektur Offline
```
Service Worker
├── Cache static assets (app shell)
├── Cache API responses (simpanan, pinjaman)
├── IndexedDB untuk data offline
└── Background Sync untuk queue operasi offline
```

---

## 7. Key Architectural Decisions

### 1. Hono + Node.js instead of Bun
- **Full TypeScript** dari backend sampai frontend — shared types via Zod.
- Hono v4.12.18 — battle tested via **Node.js** (pake `@hono/node-server`).
- Node.js LTS — **bukan library experiment**, udah production proven 10+ tahun.
- Ringan tetap — startup <100ms, routing pake trie tree, zero deps berat.

### 2. React + Vite for Both Frontends
- `apps/mobile` (PWA) dan `apps/admin` (desktop) pake React + Vite.
- Mobile: PWA-enabled, VitePWA plugin, mobile-first layout.
- Desktop: Full dashboard, complex tables, multi-panel.
- React Router untuk routing, TanStack Query untuk server state.

### 3. Multi-Tenant by Koperasi
- Setiap koperasi punya database sendiri (schema per tenant) — biar isolasi data aman.
- Atau pake `koperasi_id` di setiap tabel kalo mau single database.

### 4. Drizzle ORM instead of Eloquent / Prisma
- Drizzle sebagai **source of truth** schema — generate TypeScript types otomatis.
- SQL-like syntax, performa tinggi, bundle size kecil.
- Integrasi mulus dengan Hono + TypeScript ecosystem.
- Migrasi pake `drizzle-kit` — simpel & cepat.

### 6. SQLite — simple aja
- **Zero setup** — ga perlu postgres, ga perlu docker, `bun run` udah jalan.
- **1 file di `data/koperasi.db`** — backup tinggal copy.
- **Lu ga peduli** soal concurrent write & scalability — bomat yang penting jalan.
- Drizzle + better-sqlite3 = full TypeSafety, migration auto.
- Buat multi-tenant? Tinggal bikin file `data/{tenant_id}.db` — gampang.

---

## 8. MVP Scope (Fase 1 — Estimasi)

| Modul | Estimasi | Dependensi |
|-------|----------|------------|
| Setup boilerplate (api + mobile + admin + shared) | 1 hari | — |
| Auth login + RBAC | 3 hari | — |
| Manajemen anggota CRUD | 3 hari | Auth |
| Simpanan (pokok, wajib, sukarela) | 4 hari | Anggota |
| Pinjaman + angsuran | 5 hari | Anggota |
| Pembukuan dasar (jurnal, buku besar) | 3 hari | Transaksi |
| PWA setup + offline | 2 hari | — |
| Dashboard ringkasan | 2 hari | Semua modul |
| **Total MVP** | **~24 hari** | |

---

## 9. Struktur File Penting (Boilerplate)

```bash
apps/api/src/
├── index.ts                    # Entry point Hono
├── routes/
│   ├── auth.ts
│   ├── anggota.ts
│   ├── simpanan.ts
│   ├── pinjaman.ts
│   ├── shu.ts
│   ├── laporan.ts
│   └── dashboard.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── anggota.controller.ts
│   ├── simpanan.controller.ts
│   ├── pinjaman.controller.ts
│   ├── shu.controller.ts
│   ├── laporan.controller.ts
│   └── dashboard.controller.ts
├── services/
│   ├── anggota.service.ts
│   ├── simpanan.service.ts
│   ├── pinjaman.service.ts
│   ├── shu.service.ts          # Core: perhitungan SHU
│   └── laporan.service.ts
├── middleware/
│   ├── auth.ts                 # JWT verify
│   ├── rbac.ts                 # Role-based access
│   ├── validate.ts             # Zod validation
│   └── error.ts                # Global error handler
├── lib/
│   ├── config.ts               # Env config
│   ├── db.ts                   # Drizzle client
│   └── logger.ts               # Logger
└── package.json
```
