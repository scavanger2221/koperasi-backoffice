# Arsitektur & Planning — Koperasi Backoffice PWA

---

## 1. Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Monorepo** | Turborepo | 1 cmd jalanin semua app, cache otomatis |
| **Frontend Admin** | React + Vite + PWA (optional) | Installable, responsive, dark mode |
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
├── api/                 # Backend Hono
│   ├── src/
│   │   ├── routes/      # Route definitions (thin!)
│   │   ├── controllers/ # Request handling
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth, validate, error
│   │   └── lib/         # Config, db, logger
│   ├── database/
│   │   └── schema/      # Drizzle schema definitions
│   └── package.json
│
├── admin/               # Admin Dashboard
│   └── src/
│       ├── pages/       # React Router pages
│       ├── components/  # UI components
│       ├── hooks/       # Custom hooks
│       └── lib/         # API client, utils
│
└── shared/              # Shared types & schemas
    └── src/
        ├── types/       # TypeScript interfaces
        └── schemas/     # Zod validation schemas
```

---

## 3. Database Schema

### Entity Relationship (Core)

```
Anggota ──┬── Simpanan (Pokok, Wajib, Sukarela, Deposito)
          ├── Pinjaman ── Angsuran
          ├── TagihanSimpanan
          ├── SHU
          └── User (akun login)

Jurnal ──┬── JurnalDetail ── Akun
         └── BukuBesar ── NeracaSaldo

Transaksi ── Jurnal ── Laporan (LabaRugi, Neraca)
AuditLog ── User (who did what)
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

#### `tagihan_simpanan`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| anggota_id | uuid FK | |
| periode | varchar | YYYY-MM |
| jenis | enum | wajib |
| jumlah | text | Nominal tagihan |
| status | enum | belum_bayar, lunas, tunggakan |
| tanggal_bayar | date? | |
| created_at | timestamp | |

#### `audit_log`
| Kolom | Type | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| user_id | uuid? | |
| user_email | varchar | |
| user_role | varchar | |
| action | varchar | e.g. CREATE_ANGGOTA |
| entity_type | varchar? | e.g. anggota |
| entity_id | uuid? | |
| detail | text? | |
| ip_address | varchar? | |
| created_at | timestamp | |

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
POST   /api/simpanan              → Catat setoran
GET    /api/simpanan/mutasi       → Mutasi simpanan
```

### Pinjaman
```
GET    /api/pinjaman                   → List pinjaman
GET    /api/pinjaman/:id               → Detail + angsuran
GET    /api/pinjaman/:id/kolektibilitas → Kolektibilitas pinjaman
GET    /api/pinjaman/kolektibilitas/summary → Ringkasan kolektibilitas
POST   /api/pinjaman/cek-denda         → Cek & update denda otomatis
POST   /api/pinjaman                   → Ajukan pinjaman
PATCH  /api/pinjaman/:id/approve       → Approve (pengurus)
PATCH  /api/pinjaman/:id/cair          → Cairkan (bendahara)
POST   /api/pinjaman/bayar             → Bayar angsuran
```

### SHU
```
GET    /api/shu                   → List periode SHU
POST   /api/shu/hitung            → Hitung SHU otomatis (dari laba rugi)
GET    /api/shu/:id               → Detail SHU + rincian per anggota (embedded)
PATCH  /api/shu/:id/konfirmasi    → Konfirmasi SHU (Draft → Dikonfirmasi)
PATCH  /api/shu/:id/sahkan        → Sahkan SHU (Dikonfirmasi → Disahkan)
PATCH  /api/shu/:id/bagikan       → Bagikan SHU ke anggota (Disahkan → Dibagikan)
DELETE /api/shu/:id               → Hapus SHU draft
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
PATCH  /api/rat/:id/publikasi     → Publikasi RAT
PATCH  /api/rat/:id/mulai-voting  → Mulai voting
PATCH  /api/rat/:id/tutup-voting  → Tutup voting
PATCH  /api/rat/:id/sahkan        → Sahkan RAT
PATCH  /api/rat/:id/perpanjang    → Perpanjang RAT
POST   /api/rat/:id/hadir         → Catat kehadiran
POST   /api/rat/:id/vote          → Vote agenda
POST   /api/rat/:id/generate-dok  → Generate dokumen
GET    /api/rat/:id/export        → Export PDF
```

### Pembukuan
```
GET    /api/jurnal                → Jurnal transaksi
GET    /api/jurnal/buku-kas       → Buku kas (filter per akun kas)
GET    /api/jurnal/buku-besar/:akunId → Buku besar per akun
GET    /api/jurnal/neraca-saldo   → Neraca saldo semua akun
GET    /api/jurnal/laba-rugi      → Laporan laba rugi
GET    /api/jurnal/neraca         → Neraca (aset = kewajiban + ekuitas)
GET    /api/akun                  → Chart of accounts
POST   /api/jurnal                → Entry jurnal manual
```

### Tagihan Simpanan Wajib
```
GET    /api/tagihan               → List tagihan
GET    /api/tagihan/summary       → Ringkasan tagihan per periode
POST   /api/tagihan/generate      → Generate tagihan bulanan
POST   /api/tagihan/bayar         → Bayar tagihan
POST   /api/tagihan/cek-tunggakan → Mark tagihan lama sebagai tunggakan
```

### Audit Log
```
GET    /api/audit                 → List audit log
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
GET    /api/dashboard/ringkasan              → Total anggota, simpanan, pinjaman, SHU
GET    /api/dashboard/grafik                 → Data grafik
GET    /api/dashboard/kesehatan              → Indikator kesehatan koperasi
GET    /api/dashboard/aktivitas              → Aktivitas terkini
```

### User Management
```
GET    /api/users                 → List user
POST   /api/users                 → Buat user
PATCH  /api/users/:id             → Update user
PATCH  /api/users/:id/deactivate  → Nonaktifkan user
PATCH  /api/users/:id/activate    → Aktifkan user
PATCH  /api/auth/password         → Ganti password sendiri
```

### SHU Export
```
GET    /api/shu/export/xlsx       → Export rekap SHU (XLSX)
GET    /api/shu/:id/export/xlsx   → Export detail SHU (XLSX)
GET    /api/shu/:id/export/pdf    → Export detail SHU (PDF)
```

---

## 5. Frontend Routes

### Admin Dashboard — `admin/src/pages`

```
/login                      → Login admin
/                           → Dashboard
/anggota                    → Daftar anggota
/simpanan                   → Semua simpanan
/pinjaman                   → Semua pinjaman
/buku-kas                   → Buku kas
/tagihan                    → Tagihan simpanan wajib
/laporan                    → Laporan keuangan (buku besar, neraca saldo, laba rugi, neraca, arus kas)
/audit                      → Audit log aktivitas
/shu                        → SHU (Sisa Hasil Usaha)
/rat                        → RAT (Rapat Anggota Tahunan)
/users                      → Manajemen pengguna (admin only)
```

---

## 6. PWA (Optional)

> Admin dashboard bisa di-install sebagai PWA. Tidak ada app terpisah untuk anggota.

### Service Worker (Production)
- Cache static assets (app shell, css, js)
- Network-first untuk semua API requests
- IndexedDB untuk cache data read-only

### Manifest
- `display: standalone`
- `theme_color: #16a34a` (green — koperasi)
- Icon sizes: 192x192, 512x512

---

## 7. Key Architectural Decisions

### 1. Hono + Node.js instead of Bun
- **Full TypeScript** dari backend sampai frontend — shared types via Zod.
- Hono v4.12.18 — battle tested via **Node.js** (pake `@hono/node-server`).
- Node.js LTS — **bukan library experiment**, udah production proven 10+ tahun.
- Ringan tetap — startup <100ms, routing pake trie tree, zero deps berat.

### 2. React + Vite for Admin Dashboard
- Single frontend app: `admin/` — React + Vite.
- Responsive: desktop-first tapi works on tablet/mobile.
- PWA-enabled via VitePWA plugin (optional, production only).
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
- **1 file di `api/database/koperasi.db`** — backup tinggal copy.
- **Lu ga peduli** soal concurrent write & scalability — bomat yang penting jalan.
- Drizzle + better-sqlite3 = full TypeSafety, migration auto.
- Buat multi-tenant? Tinggal bikin file `database/{tenant_id}.db` — gampang.
- **DB path** cuma ditulis di SATU tempat: `api/src/lib/db.ts` (`./database/koperasi.db`).
- Semua seeder pake path yang SAMA. Jangan hardcode di file lain.

---

## 8. MVP Scope (Fase 1 — Estimasi)

| Modul | Estimasi | Dependensi |
|-------|----------|------------|
| Setup boilerplate (api + admin + shared) | ✅ Done | — |
| Auth login + RBAC | ✅ Done | — |
| Manajemen anggota CRUD | ✅ Done | Auth |
| Simpanan (pokok, wajib, sukarela, deposito) | ✅ Done | Anggota |
| Pinjaman + angsuran + denda + kolektibilitas | ✅ Done | Anggota |
| Pembukuan (jurnal, buku kas, buku besar, neraca saldo, laba rugi, neraca) | ✅ Done | Transaksi |
| Auto-tagihan simpanan wajib | ✅ Done | Anggota |
| Audit log | ✅ Done | Semua modul |
| Dashboard ringkasan + kesehatan koperasi | ✅ Done | Semua modul |
| SHU (hitung otomatis + alokasi + JMA/JUA per anggota) | ✅ Done | Jurnal, Anggota, Simpanan |
| **Phase 1 MVP** | **✅ COMPLETE** | |
| **Phase 2:** | | |
| └ SHU Export (PDF/XLSX) | ✅ Done | SHU |
| └ RAT (full state machine) | ✅ Done | Anggota |
| └ User Management (CRUD) | ✅ Done | Auth |
| └ Ganti Password | ✅ Done | Auth |
| **Phase 2 COMPLETE** | **✅ DONE** | |

---

## 9. Struktur File Penting (Boilerplate)

```bash
api/src/
├── index.ts                    # Entry point Hono
├── routes/
│   ├── auth.route.ts
│   ├── anggota.route.ts
│   ├── simpanan.route.ts
│   ├── pinjaman.route.ts
│   ├── jurnal.route.ts         # Jurnal, buku kas, buku besar, neraca saldo, laba rugi, neraca
│   ├── tagihan.route.ts        # Tagihan simpanan wajib
│   ├── audit.route.ts          # Audit log
│   ├── shu.route.ts            # SHU calculation & distribution + export
│   ├── dashboard.route.ts
│   ├── rat.route.ts            # RAT full state machine
│   └── user.route.ts           # User management
├── controllers/
│   ├── auth.controller.ts
│   ├── anggota.controller.ts
│   ├── simpanan.controller.ts
│   ├── pinjaman.controller.ts
│   ├── jurnal.controller.ts
│   ├── tagihan.controller.ts
│   ├── audit.controller.ts
│   ├── shu.controller.ts
│   ├── dashboard.controller.ts
│   ├── rat.controller.ts
│   └── user.controller.ts
├── services/
│   ├── anggota.service.ts
│   ├── simpanan.service.ts
│   ├── pinjaman.service.ts     # + denda otomatis, kolektibilitas
│   ├── jurnal.service.ts       # Jurnal otomatis + laporan keuangan
│   ├── tagihan.service.ts      # Auto-generate tagihan wajib
│   ├── audit.service.ts        # Audit trail logging
│   ├── shu.service.ts          # Hitung SHU, JMA/JUA, state machine
│   ├── dashboard.service.ts
│   ├── rat.service.ts          # RAT state machine, voting, kehadiran
│   ├── user.service.ts         # User CRUD
│   └── export.service.ts       # SHU export XLSX/PDF
├── middleware/
│   ├── auth.ts                 # JWT verify
│   ├── audit.ts                # Audit middleware (after action)
│   └── error.ts                # Global error handler
├── seeders/                   # Per-table seeders, run with `npm run db:seed`
│   ├── runner.ts               # Runner: all or selective (`--list`, `--skip`, `npm run db:seed users akun`)
│   ├── seed-users.ts
│   ├── seed-anggota.ts
│   ├── seed-akun.ts
│   ├── seed-simpanan.ts
│   ├── seed-pinjaman.ts
│   ├── seed-tagihan.ts
│   ├── seed-jurnal.ts
│   ├── seed-shu.ts
│   └── seed-rat.ts
├── lib/
│   ├── config.ts               # Env config
│   └── db.ts                   # Drizzle client (single source of DB path)
└── package.json

admin/src/pages/
├── Login.tsx
├── Dashboard.tsx
├── Anggota.tsx
├── Simpanan.tsx
├── Pinjaman.tsx
├── BukuKas.tsx
├── Tagihan.tsx                 # Tagihan simpanan wajib
├── Laporan.tsx                 # Buku besar, neraca saldo, laba rugi, neraca
├── SHU.tsx                     # SHU hitung & kelola pembagian + export
├── RAT.tsx                     # RAT full management
├── Users.tsx                   # Manajemen pengguna (admin)
└── AuditLog.tsx                # Riwayat aktivitas
```
