# Fitur App Backoffice Koperasi

**Backoffice-only.** Tidak ada aplikasi terpisah untuk anggota. Semua operasional koperasi ditangani di dashboard admin oleh pengurus, bendahara, dan admin.

---

## 🔵 FASE 1: MVP (Core)

### 1. Manajemen Anggota
- [x] CRUD data anggota
- [x] Verifikasi & approve pendaftaran
- [x] Cetak kartu anggota (PDF)
- [x] Atur status (aktif/nonaktif/keluar)
- [x] Riwayat aktivitas per anggota
- [x] Detail anggota: simpanan, pinjaman, SHU

### 2. Simpanan
- [x] Catat setoran tunai/transfer
- [x] Kelola simpanan pokok, wajib, sukarela
- [x] Kelola deposito berjangka
- [x] Riwayat & mutasi simpanan
- [x] Auto-tagihan simpanan wajib bulanan
- [x] Laporan simpanan harian/bulanan

### 3. Pinjaman
- [x] Input pengajuan pinjaman (oleh admin)
- [x] Approval bertingkat (admin → pengurus → bendahara)
- [x] Pencairan pinjaman + generate jadwal angsuran
- [x] Catat pembayaran angsuran
- [x] Hitung denda keterlambatan otomatis
- [x] Atur jenis bunga (flat, efektif, anuitas, syariah)
- [x] Kolektibilitas & laporan pinjaman

### 4. Pembukuan Dasar
- [x] Jurnal transaksi otomatis
- [x] Buku kas & bank
- [x] Buku besar
- [x] Neraca saldo
- [x] Laba rugi / SHU
- [x] Neraca
- [x] Arus kas

> Pembukuan **hanya di backoffice** — ini adalah aplikasi internal koperasi.

### 5. Role & Akses
- [x] Multi-level role (super_admin, admin, pengurus, bendahara, pengawas)
- [x] RBAC per modul
- [x] Login via email + password
- [x] Log aktivitas & audit trail

---

## 🟡 FASE 2: Standard

### 6. SHU (Sisa Hasil Usaha)
- [x] Hitung SHU otomatis dari data tahun buku (laba rugi)
- [x] Atur alokasi proporsi (anggota, cadangan, pengurus, dll)
- [x] JMA + JUA (detail per anggota)
- [x] Buku SHU per anggota
- [x] Preview & approval SHU (Draft → Dikonfirmasi → Disahkan → Dibagikan)
- [ ] Export daftar SHU (PDF/XLSX)

### 7. RAT (Rapat Anggota Tahunan)
- [ ] Generate laporan keuangan RAT
- [ ] Template RAT digital
- [ ] Arsip RAT tahunan
- [ ] Export PDF / XLSX

### 8. Unit Usaha
- [ ] **Toko**: POS, barcode, stok, kasir
- [ ] **PPOB**: Listrik, PDAM, BPJS, pulsa, token
- [ ] **Jasa**: booking & pembayaran
- [ ] Manajemen stok & supplier
- [ ] Multi-unit dalam 1 dashboard

### 9. Dashboard & Analytics
- [x] Total anggota, simpanan, pinjaman, SHU
- [x] Grafik pertumbuhan
- [x] Indikator kesehatan (rasio likuiditas, solvabilitas)
- [x] Aktivitas terkini

### 10. Manajemen Pengguna
- [ ] CRUD pengurus & karyawan
- [x] Log aktivitas & audit trail
- [ ] Ganti password akun sendiri

---

## 🔴 FASE 3: Advanced

### 11. Pembayaran Digital
- [ ] Konfigurasi payment gateway
- [ ] Riwayat transaksi digital
- [ ] Rekonsiliasi otomatis
- [ ] Auto-debet simpanan wajib

### 12. E-Commerce / Marketplace
- [ ] Kelola produk & stok
- [ ] Atur harga & diskon
- [ ] Kelola pesanan
- [ ] Manajemen kurir/pengiriman

### 13. AI & Smart Features
- [ ] Deteksi transaksi mencurigakan
- [ ] Prediksi risiko kredit anggota
- [ ] Forecasting SHU & kesehatan koperasi

### 14. Integrasi Eksternal
- [ ] Open API (REST)
- [ ] Webhook konfigurasi
- [ ] Export data (CSV, XLSX, PDF)
- [ ] Sinkronisasi Dinas Koperasi daerah

---

## 🟣 Teknis

| Fitur | Backoffice Admin |
|-|-|
| Responsive layout | ✅ Desktop-first, works on tablet |
| PWA (installable) | ⚠️ Optional — add to home screen |
| Push notification | ✅ Aktivitas perlu approval |
| Print (kartu, bukti, laporan) | ✅ Wajib — semua dokumen bisa dicetak |
| Export PDF/Excel | ✅ Wajib — laporan keuangan |
| Scan QR code | ✅ Scan kartu anggota |
| Dark mode | ✅ Wajib |

---

## 🎯 Prioritas Fitur

| Priority | Modul | Kenapa |
|----------|-------|--------|
| **P1** | Anggota, Simpanan, Pinjaman, Buku Kas | Core bisnis — tanpa ini bukan koperasi |
| **P1** | Role & akses multi-level | Wajib buat backoffice |
| **P2** | SHU otomatis | Hitungan rumit, harus akurat tiap tahun |
| **P2** | Laporan & RAT | Wajib hukumnya tiap tahun |
| **P2** | Dashboard analytics | Biar pengurus percaya data |
| **P3** | Multi-unit (toko, PPOB) | Scale up bisnis |
| **P3** | Pembayaran digital | Biar ga ketinggalan jaman |
| **P4** | AI, Marketplace, API | Future-proof |

---

*Dokumen ini diupdate 13 Mei 2026 — Phase 1 MVP + SHU selesai, siap masuk Phase 2 (RAT, Unit Usaha).*
