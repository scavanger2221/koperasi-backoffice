# Research: Aplikasi Backoffice Koperasi PWA Monorepo
**Date:** May 11, 2026  
**Sources:** DuckDuckGo search, Chrome MCP browser analysis, Kompas article, Ruangguru, Alokop, SIMAKOP, kdmp.id  
**Author:** Bibo (Hermes Agent Research)

---

## Table of Contents
1. [Apa Itu Koperasi & Cara Kerja](#1-apa-itu-koperasi--cara-kerja)
2. [Regulasi & Landasan Hukum (2025-2026)](#2-regulasi--landasan-hukum-2025-2026)
3. [Jenis-Jenis Koperasi di Indonesia](#3-jenis-jenis-koperasi-di-indonesia)
4. [Komponen Bisnis Koperasi](#4-komponen-bisnis-koperasi)
5. [SHU (Sisa Hasil Usaha) — Perhitungan Detail](#5-shu-sisa-hasil-usaha--perhitungan-detail)
6. [RAT (Rapat Anggota Tahunan)](#6-rat-rapat-anggota-tahunan)
7. [Koperasi Desa Merah Putih (Program Pemerintah)](#7-koperasi-desa-merah-putih-program-pemerintah)
8. [Standar Akuntansi Koperasi (SAK EP / SAK EMKM)](#8-standar-akuntansi-koperasi-sak-ep--sak-emkm)
9. [Kompetitor: Existing Software Koperasi](#9-kompetitor-existing-software-koperasi)
10. [Tren Digitalisasi Koperasi 2026](#10-tren-digitalisasi-koperasi-2026)
11. [Fitur yang Wajib Ada — Feature Breakdown](#11-fitur-yang-wajib-ada--feature-breakdown)
12. [Arsitektur PWA Monorepo — Rekomendasi](#12-arsitektur-pwa-monorepo--rekomendasi)
13. [Target Market & Prioritas Fitur](#13-target-market--prioritas-fitur)

---

## 1. Apa Itu Koperasi & Cara Kerja

**Definisi (UU No. 25/1992):** Koperasi adalah badan usaha yang beranggotakan orang-seorang atau badan hukum koperasi dengan melandaskan kegiatannya berdasarkan prinsip koperasi sekaligus sebagai gerakan ekonomi rakyat yang berdasar atas asas kekeluargaan.

**Cara Kerja Umum:**
- Anggota mendaftar → membayar simpanan pokok ( sekali) + simpanan wajib (periodik)
- Anggota bisa menyimpan uang (simpanan sukarela/deposito)
- Anggota bisa meminjam uang (pinjaman dengan bunga/bagi hasil)
- Koperasi menjalankan unit usaha lain (toko, jasa, produksi)
- Akhir tahun: SHU (Sisa Hasil Usaha) dihitung dan dibagikan ke anggota

**Prinsip Koperasi:**
1. Keanggotaan bersifat sukarela dan terbuka
2. Pengelolaan secara demokratis
3. Pembagian SHU secara adil sesuai jasa usaha
4. Balas jasa terbatas terhadap modal
5. Kemandirian
6. Pendidikan perkoperasian
7. Kerjasama antarkoperasi

---

## 2. Regulasi & Landasan Hukum (2025-2026)

### Regulasi Saat Ini (Masih Berlaku)
- **UU No. 25 Tahun 1992** tentang Perkoperasian — UU utama yang saat ini masih berlaku
- **PP No. 9 Tahun 1995** tentang Pelaksanaan Usaha Simpan Pinjam oleh Koperasi
- **Permenkop No. 13/PER/M.KUKM/IX/2015** — Pedoman Akuntansi Usaha Simpan Pinjam
- **Permenkop No. 15/PER/M.KUKM/IX/2015** — Penilaian Kesehatan Koperasi Simpan Pinjam

### Revisi UU Perkoperasian (Pembahasan 2025-2026)
- RUU Perkoperasian ditargetkan disahkan Maret 2025 (molor, masih dibahas)
- Menggantikan UU No. 25/1992 yang dinilai **out of date**
- Poin-poin perubahan krusial:
  1. **Keanggotaan**: Mengenal "Anggota Pendiri" untuk rekognisi entrepreneurial
  2. **Organisasi**: Model **Jenjang Tunggal** (Rapat Anggota, Pengurus, Direksi) — seperti negara lain. Tetap rekognisi model konvensional (Pengurus + Pengawas)
  3. **Permodalan**: Simpanan Pokok → **Uang Tanda Masuk (entrance fee)**, Simpanan Wajib → **Modal Anggota** yang bisa dialihkan
  4. **Dana Kemitraan**: Instrumen pendanaan baru untuk proyek usaha koperasi
  5. **Penghapusan penjenisan koperasi** (sesuai putusan MK No. 28/PUU-XI/2013)

### Program Pemerintah: Koperasi Desa Merah Putih
- **Inpres No. 9 Tahun 2025** — Percepatan pembentukan 83.762 Koperasi Desa/Kelurahan Merah Putih
- Target: **80.000 kopdes** di seluruh Indonesia
- Didukung 16 Kementerian
- Fokus: ketahanan pangan, ketahanan kesehatan, tata kelola modern
- Website resmi: [kdmp.id](https://kdmp.id/)

### Regulasi Digitalisasi
- Menteri Koperasi & UKM (Budi Arie Setiadi) menetapkan **digitalisasi sebagai 1 dari 3 agenda besar** kemenkop
- **IDXCOOP** (idxcoop.kop.go.id) — platform digitalisasi koperasi dari pemerintah

---

## 3. Jenis-Jenis Koperasi di Indonesia

| Jenis | Deskripsi | Contoh Unit Usaha |
|-------|-----------|-------------------|
| **KSP (Simpan Pinjam)** | Fokus pada simpanan & pinjaman anggota | Tabungan, deposito, kredit |
| **KSU (Serba Usaha)** | Multi-unit usaha | Simpan pinjam + toko + jasa |
| **Koperasi Konsumen** | Menyediakan barang kebutuhan anggota | Minimarket koperasi |
| **Koperasi Produsen** | Menampung & memasarkan hasil produksi anggota | Pertanian, kerajinan |
| **Koperasi Jasa** | Menyediakan jasa untuk anggota | Jasa pembayaran, PPOB, transportasi |
| **Koperasi Syariah** | Berbasis prinsip bagi hasil (mudharabah, musyarakah) | Pembiayaan syariah, simpanan syariah |
| **Kopdes (Desa)** | Koperasi di tingkat desa | Simpan pinjam desa, warung desa |
| **KUD** | Koperasi Unit Desa — khusus perdesaan | Pertanian, sarana produksi |

> **Catatan:** RUU Perkoperasian baru menghapus penjenisan koperasi — koperasi bisa menjalankan **semua jenis usaha** tanpa dibatasi klasifikasi.

---

## 4. Komponen Bisnis Koperasi

### 4.1 Simpanan
- **Simpanan Pokok**: Dibayar sekali saat daftar (Rp 100rb - 1jt)
- **Simpanan Wajib**: Dibayar periodik tiap bulan (Rp 20rb - 500rb)
- **Simpanan Sukarela**: Setoran kapan saja, bisa diambil kapan saja
- **Deposito Berjangka**: Simpanan dengan jangka waktu & bunga tertentu

### 4.2 Pinjaman
- Pinjaman anggota (dengan bunga flat/efektif/menurun)
- Pinjaman dengan jaminan / tanpa jaminan
- Pinjaman pensiun / khusus
- **Bunga pinjaman KSP**: biasanya 1-3% per bulan (flat) atau 12-24% per tahun efektif

### 4.3 Unit Usaha Lain
- **Toko/Minimarket**: Menjual sembako, kebutuhan anggota
- **PPOB**: Pembayaran listrik, PDAM, BPJS, pulsa, token listrik
- **Jasa**: Fotokopi, printing, catering
- **Produksi**: Menampung hasil tani, produksi kerajinan
- **Marketplace / E-commerce**: Platform belanja online anggota

### 4.4 Pembagian SHU
Komponen alokasi SHU (standar):
- **30-40%** — Untuk anggota (Jasa Modal + Jasa Usaha)
- **20-25%** — Dana cadangan
- **10-15%** — Dana pengurus & pengawas
- **5-10%** — Dana pendidikan
- **5-10%** — Dana sosial
- **5%** — Dana pembangunan daerah kerja

---

## 5. SHU (Sisa Hasil Usaha) — Perhitungan Detail

### Definisi
SHU = Pendapatan koperasi dalam 1 tahun buku - (Biaya + Penyusutan + Kewajiban + Pajak)

### Rumus Dasar
```
SHU Anggota = JMA (Jasa Modal Anggota) + JUA (Jasa Usaha Anggota)
```

### JMA (Jasa Modal Anggota)
Balas jasa karena anggota menyimpan uang.
```
JMA = (Simpanan Anggota / Total Simpanan) × (% Alokasi SHU untuk JMA × Total SHU)
```

### JUA (Jasa Usaha Anggota)
Balas jasa karena anggota bertransaksi.
```
JUA = Jasa Penjualan + Jasa Pinjaman
```

**a. Jasa Penjualan:**
```
JP = (Pembelian Anggota / Total Pembelian) × (% Alokasi SHU JP × Total SHU)
```

**b. Jasa Pinjaman:**
```
JPj = (Pinjaman Anggota / Total Pinjaman) × (% Alokasi SHU JPj × Total SHU)
```

### Contoh Perhitungan
> SHU total: Rp 100.000.000
> Alokasi untuk anggota: 40% (= Rp 40.000.000)
> Dari 40%: 50% JMA + 50% JUA (= Rp 20jt + Rp 20jt)
> Anggota A: Simpanan Rp 2jt (total simpanan Rp 200jt), Belanja Rp 1jt (total Rp 500jt)
> JMA A = (2jt/200jt) × 20jt = Rp 200.000
> JUA A = (1jt/500jt) × 20jt = Rp 40.000
> **Total SHU A = Rp 240.000**

---

## 6. RAT (Rapat Anggota Tahunan)

**Wajib dilaksanakan** setiap tahun oleh semua koperasi (UU No. 25/1992).

**Batas akhir:** 31 Maret tahun berikutnya (khusus Kopdes Merah Putih: 31 Maret 2027)

### Output RAT:
1. Laporan Pertanggungjawaban Pengurus
2. Laporan Keuangan (Neraca, Laba Rugi, Arus Kas, SHU)
3. Laporan Pengawas
4. Rencana Kerja & RAPB tahun depan
5. Pembagian SHU
6. Pemilihan Pengurus & Pengawas (jika masa jabatan habis)

### Dokumen yang harus disiapkan:
- Neraca tahun berjalan
- Perhitungan SHU
- Laporan arus kas
- Catatan atas laporan keuangan
- Rencana kerja & anggaran
- Notulen RAT sebelumnya

### Digitalisasi RAT:
- Alokop sudah punya fitur **e-RAT** (online voting, akses laporan digital)
- Bisa jadi blueprint untuk fitur RAT digital

---

## 7. Koperasi Desa Merah Putih (Program Pemerintah)

Program strategis nasional berdasarkan **Inpres No. 9/2025**.

### Fakta Kunci:
- **83.762 kopdes** target nasional
- Didukung **16 Kementerian**
- Platform digital resmi: [kdmp.id](https://kdmp.id/)
- Sudah memiliki ekosistem digital sendiri dengan modul-modul:

### Modul KDMP:
1. **POS** — Point of Sales terintegrasi QRIS, e-wallet
2. **eLogistik & Inventory** — Manajemen stok real-time + AI forecasting
3. **Keanggotaan** — Registrasi online, ID digital QR code, notifikasi
4. **Tele-Health** — Konsultasi online, resep elektronik
5. **Gerai Klinik & Obat** — Manajemen stok obat, BPJS
6. **Keuangan** — Kas & jurnal otomatis, perhitungan SHU digital, neraca real-time
7. **Dashboard EIS** — Business intelligence, KPI real-time
8. **LMS** — Platform pembelajaran digital

### Implikasi:
- Pasar besar untuk backoffice koperasi karena ada dorongan pemerintah
- 80.000+ koperasi potensial butuh sistem digital
- Fokus ke **Kopdes / koperasi desa** = strategi go-to-market yang bagus

---

## 8. Standar Akuntansi Koperasi (SAK EP / SAK EMKM)

### Standar yang Berlaku:
- **SAK EP** (Entitas Privat) — untuk koperasi menengah-besar (sejak 2025, menggantikan SAK ETAP)
- **SAK EMKM** — untuk koperasi mikro, kecil, menengah (lebih sederhana)

### Laporan Keuangan Wajib:
1. **Neraca** — Aset, Kewajiban, Ekuitas
2. **Laba Rugi** — Pendapatan - Beban = SHU
3. **Arus Kas** — Metode langsung / tidak langsung
4. **Catatan atas Laporan Keuangan** — Penjelasan detail

### Permenkop Terkait:
- **Permenkop No. 13/2015** — Pedoman Akuntansi KSP
- Mewajibkan koperasi menggunakan SAK yang diterbitkan IAI

### Fitur Akuntansi yang diperlukan:
- Jurnal umum otomatis
- Buku besar
- Neraca saldo
- Laporan laba rugi (perhitungan SHU)
- Neraca
- Arus kas
- Buku kas & bank
- Rekonsiliasi bank

---

## 9. Kompetitor: Existing Software Koperasi

### 9.1 Alokop (alokop.id) ★ Paling Kompetitif
- **Model:** SaaS — dashboard web
- **Fitur:** Multi-unit usaha (simpan pinjam, toko, PPOB, jasa, produksi, marketplace), AI audit, e-RAT, penilaian kesehatan koperasi
- **Harga:** N/A (SaaS subscription)
- **Validasi:** Diakui BRIN, digunakan Koperasi Kantor Gubernur Sumbar, Dinas Pendidikan, Kemenag
- **Keunggulan:** Paling lengkap fiturnya di Indonesia, AI-powered

### 9.2 SIMAKOP (simakop.id) ★ Entry-level massal
- **Model:** SaaS
- **Fitur:** Manajemen anggota, pembukuan otomatis, simpan pinjam, laporan RAT, dashboard analytics
- **Harga:** Rp 99rb (Starter/100 anggota), Rp 299rb (Professional/500 anggota), Custom (Enterprise)
- **Pricing note:** 14 hari trial gratis, tanpa biaya setup
- **Market:** 500+ koperasi, 50K+ anggota aktif
- **Keunggulan:** Harga terjangkau, mudah digunakan

### 9.3 Smartcoop (smartcoop.id)
- **Model:** SaaS website-based
- **Fitur:** Laporan keuangan standar akuntansi (sulit diakses karena Cloudflare)
- **Target:** Koperasi umum

### 9.4 Kopizy (kopizy.com)
- **Fitur:** Kasir digital, manajemen anggota, laporan otomatis

### 9.5 SIMKO (simko.id)
- **Fitur:** Integrasi kasir ritel, stok otomatis, backup cloud harian, SSL 256-bit
- **Value prop:** Partner teknologi, bukan sekedar software

### 9.6 KDMP Platform (kdmp.id)
- **Ekosistem:** POS, Inventory, Membership, Telehealth, Keuangan, EIS, LMS
- **Target:** Koperasi Desa Merah Putih (program pemerintah)
- **Catatan:** Ini platform resmi pemerintah, bukan kompetitor murni

### Market Gap Analysis
| Aspek | Alokop | SIMAKOP | KDMP | Gap untuk kita |
|-------|--------|---------|------|----------------|
| PWA / Offline | ❌ Web only | ❌ Web only | ❌ Web only | ✅ **PWA offline-first** |
| Mobile App | ❌ | ✅ Download app | ❌ | ✅ **PWA installable** |
| Monorepo | ❌ | ❌ | ❌ | ✅ **Multi-platform codebase** |
| Harga Terjangkau | ❌ Enterprise | ✅ Rp 99rb | ✅ Gratis? | ✅ **Competitive pricing** |
| Multi Unit Usaha | ✅ Lengkap | ⚠️ Terbatas | ✅ Lengkap | ✅ **Full coverage** |
| AI Features | ✅ Audit AI | ❌ | ❌ | ✅ **Smart insights** |

---

## 10. Tren Digitalisasi Koperasi 2026

### 10.1 Koperasi 4.0
- Adopsi tata kelola berbasis platform online & transparansi real-time
- Digital mindset jadi tantangan utama (SDM koperasi masih tradisional)
- Koperasi bersaing dengan fintech — harus adaptif

### 10.2 IDXCOOP (Pemerintah)
- Platform digitalisasi dari Kemenkop UKM
- Kerja sama dengan penyedia teknologi koperasi
- Mendorong ekosistem digital koperasi nasional

### 10.3 Pembayaran Digital
- QRIS wajib di koperasi
- Integrasi e-wallet (GoPay, OVO, DANA, ShopeePay)
- Transfer bank & virtual account

### 10.4 Integrasi Pemerintah
- Koneksi dengan sistem Dinas Koperasi daerah
- BPJS Kesehatan (koperasi desa)
- Pelaporan otomatis ke pemerintah

### 10.5 AI & Data Analytics
- Audit digital berbasis AI (deteksi anomali transaksi)
- Prediksi kesehatan koperasi
- Forecasting kebutuhan stok
- Rekomendasi produk/pinjaman

### 10.6 Landing Page & Company Profile
- Banyak koperasi butuh website profesional
- SIMAKOP jual layanan website koperasi sebagai produk sampingan
- Opportunity: bundling backoffice + company profile website

---

## 11. Fitur yang Wajib Ada — Feature Breakdown

Berdasarkan riset dari Alokop, SIMAKOP, KDMP, regulasi, dan kebutuhan dasar koperasi:

### 🔵 FASE 1: CORE (MVP)

#### A. Manajemen Keanggotaan
- [ ] Registrasi anggota (form online)
- [ ] Data anggota lengkap (KTP, KK, foto, pekerjaan, alamat)
- [ ] Kartu anggota digital (ID + QR Code)
- [ ] Status anggota (aktif/nonaktif/keluar)
- [ ] Riwayat simpanan & pinjaman per anggota
- [ ] Notifikasi jatuh tempo

#### B. Simpanan
- [ ] Simpanan Pokok (one-time)
- [ ] Simpanan Wajib (periodik — bisa auto-debet)
- [ ] Simpanan Sukarela (setor kapan saja)
- [ ] Deposito Berjangka
- [ ] Setoran tunai / transfer
- [ ] Riwayat & mutasi simpanan
- [ ] Cetak buku simpanan digital

#### C. Pinjaman
- [ ] Pengajuan pinjaman (online/offline)
- [ ] Persetujuan bertingkat (admin → pengurus)
- [ ] Pencairan pinjaman
- [ ] Angsuran (harian/mingguan/bulananan)
- [ ] Perhitungan bunga (flat, efektif, anuitas, syariah)
- [ ] Jadwal angsuran otomatis
- [ ] Riwayat pinjaman & denda keterlambatan
- [ ] Grafik sisa pinjaman

#### D. Pembukuan Dasar
- [ ] Jurnal transaksi otomatis
- [ ] Buku kas & bank
- [ ] Buku besar
- [ ] Neraca saldo
- [ ] Laporan Laba Rugi (SHU)
- [ ] Neraca
- [ ] Arus Kas

#### E. Autentikasi & RBAC
- [ ] Multi-level role: Admin, Pengurus, Pengawas, Bendahara, Anggota
- [ ] Hak akses per modul
- [ ] Login via email/telepon + password
- [ ] 2FA (opsional)

### 🟡 FASE 2: STANDARD

#### F. Perhitungan SHU
- [ ] Hitung SHU otomatis dari data tahun buku
- [ ] Alokasi proporsi SHU (anggota, cadangan, pengurus, dll)
- [ ] JMA + JUA (detail per anggota)
- [ ] Buku SHU per anggota
- [ ] Preview & approval SHU sebelum RAT

#### G. Laporan & RAT
- [ ] Laporan keuangan lengkap (neraca, laba rugi, arus kas)
- [ ] Catatan atas laporan keuangan
- [ ] Template RAT digital
- [ ] E-RAT: voting online, notulen digital
- [ ] Export PDF / Excel
- [ ] Arsip RAT tahunan

#### H. Unit Usaha (Multi-Unit)
- [ ] **Toko/Minimarket**: POS, stok barang, barcode, kasir
- [ ] **PPOB**: Listrik, PDAM, BPJS, Pulsa, Token
- [ ] **Jasa**: Booking, pembayaran jasa
- [ ] Stok & inventory management
- [ ] Supplier management

#### I. Dashboard & Analytics
- [ ] Total anggota, simpanan, pinjaman, SHU
- [ ] Grafik pertumbuhan
- [ ] Peringatan kesehatan koperasi (rasio likuiditas, solvabilitas)
- [ ] Aktivitas terkini

### 🟢 FASE 3: ADVANCED

#### J. Pembayaran Digital
- [ ] Integrasi QRIS
- [ ] Virtual account
- [ ] Auto-debet simpanan wajib
- [ ] E-wallet integration

#### K. E-Commerce / Marketplace
- [ ] Toko online untuk anggota
- [ ] Keranjang & checkout
- [ ] Pembayaran via simpanan / transfer

#### L. AI & Smart Features
- [ ] Deteksi transaksi mencurigakan
- [ ] Prediksi risiko kredit anggota
- [ ] Forecasting SHU & kesehatan koperasi
- [ ] Rekomendasi produk pinjaman

#### M. Integrasi Eksternal
- [ ] Open API untuk pihak ketiga
- [ ] Webhook untuk notifikasi real-time
- [ ] Export data ke spreadsheet / accounting software
- [ ] Sinkronisasi dengan Dinas Koperasi daerah

---

## 12. Arsitektur PWA Monorepo — Rekomendasi

### Stack Rekomendasi

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Monorepo** | Turborepo / Nx | Manajemen packages, shared code |
| **Frontend** | Next.js 15+ (App Router) | PWA, SSR/SSG, React Server Components |
| **Mobile** | Next.js PWA + service worker | Installable, offline support |
| **Admin Panel** | Next.js (same monorepo) | Shared components, one codebase |
| **Backend** | Hono / Fastify / Laravel | REST + WebSocket, scalable |
| **Database** | PostgreSQL | Reliable, relasional untuk akuntansi |
| **Caching** | Redis | Session, rate limiting, cache |
| **ORM** | Prisma / Drizzle | Type-safe, migration tooling |
| **Auth** | NextAuth.js / Lucia Auth | Session management, RBAC |
| **Styling** | Tailwind CSS + shadcn/ui | Consistent design system |
| **PWA** | next-pwa / Serwist | Service worker, offline cache |
| **State** | TanStack Query (React Query) | Server state, caching |
| **Payments** | Midtrans / Xendit | QRIS, VA, e-wallet |

### Struktur Monorepo

```
apps/
├── web/                    # Frontend PWA (Next.js)
│   ├── app/                # App Router pages
│   ├── components/         # Shared UI components
│   └── public/             # Static assets, manifest.json
├── admin/                  # Admin dashboard (Next.js)
│   └── app/                # Admin pages
├── api/                    # Backend API (Hono/Laravel)
│   ├── routes/
│   ├── controllers/
│   └── services/
└── mobile/                 # Mobile wrapper (optional - PWA covers this)
packages/
├── ui/                     # Shared UI (shadcn/ui components)
├── shared/                 # Shared types, schemas, utilities
├── config/                 # Shared config (tailwind, eslint, ts)
├── database/               # Prisma/Drizzle schema + migrations
└── validators/             # Zod schemas (shared frontend-backend)
```

### Kenapa PWA + Monorepo?
1. **PWA:** Koperasi di desa sering punya koneksi internet tidak stabil — offline-first penting
2. **PWA:** Bisa di-install di HP tanpa Play Store (anggota akses saldo, pengajuan pinjaman)
3. **Monorepo:** Share types, validators, UI components antara admin & frontend anggota
4. **Monorepo:** Satu repo, satu CI/CD, dependency management lebih rapi

---

## 13. Target Market & Prioritas Fitur

### Target Market Utama
1. **🥇 Koperasi Desa/Kelurahan (Kopdes)** — 80.000+ target pemerintah, butuh digitalisasi massal
2. **🥈 KSP & KSU Menengah** — Butuh sistem lebih advance dari SIMAKOP tapi lebih murah dari Alokop
3. **🥉 Koperasi Sekolah / Kampus** — Skala kecil, butuh simple & murah

### Strategi Go-to-Market
- **Fokus ke Kopdes Merah Putih** karena ada Inpres dan dorongan pemerintah
- Integrasi dengan Dinas Koperasi daerah untuk distribusi
- Model SaaS: Rp 50-150rb/bulan (lebih murah dari SIMAKOP)
- Freemium untuk koperasi < 50 anggota

### Prioritas Fitur vs Kompetitor
| Fitur | Alokop | SIMAKOP | Target Kita |
|-------|--------|---------|-------------|
| PWA Offline | ❌ | ❌ | ✅ **Pembeda utama** |
| Multi Unit | ✅ | ⚠️ | ✅ |
| SHU Otomatis | ✅ | ✅ | ✅ |
| E-RAT | ✅ | ❌ | ✅ |
| AI Audit | ✅ | ❌ | ⚠️ (V2) |
| Harga Entry | ❌ Mahal | ✅ Rp 99rb | ✅ **Under 100rb** |
| Dashboard | ✅ | ✅ | ✅ **Mobile-first** |

---

## Sumber Referensi

1. **UU No. 25 Tahun 1992** tentang Perkoperasian
2. **RUU Perkoperasian 2025** — DPR RI & Kemenkop UKM
3. **Inpres No. 9 Tahun 2025** — Percepatan Pembentukan Kopdes Merah Putih
4. **Permenkop No. 13/2015** — Pedoman Akuntansi KSP
5. **Alokop** — alokop.id (Aplikasi Koperasi Terbaik 2026)
6. **SIMAKOP** — simakop.id (SaaS Manajemen Koperasi)
7. **KDMP.ID** — kdmp.id (Platform Koperasi Desa Merah Putih)
8. **Ruang Guru** — Rumus SHU & Perhitungan
9. **Kompas.com** — Revisi UU Perkoperasian oleh Firdaus Putra (22 Feb 2025)
10. **Qwords** — Koperasi di Era Digital
11. **IDXCOOP** — idxcoop.kop.go.id (Inovasi Digital Koperasi)
12. **iPaymu** — Digitalisasi Koperasi 2026
13. **Elkopra** — Digitalisasi Koperasi: Tantangan & Peluang

---

> **Catatan Akhir:** Riset ini dilakukan pada 11 Mei 2026. Regulasi dan kondisi pasar bisa berubah. Disarankan review ulang setiap 3-6 bulan, terutama untuk status RUU Perkoperasian.
