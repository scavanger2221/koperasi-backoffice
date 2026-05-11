# Fitur App Backoffice Koperasi — PWA Monorepo

**2 View:**
- **📱 Mobile (Anggota)** — PWA diinstall di HP anggota. Buat cek saldo, ajukan pinjaman, bayar angsuran, lihat SHU.
- **💻 Desktop (Admin/Pengurus)** — Web dashboard. Buat kelola anggota, transaksi, laporan, RAT.

---

## 🔵 FASE 1: MVP (Core)

### 1. Manajemen Anggota
| Mobile (Anggota) | Desktop (Admin) |
|-|-|
| Daftar jadi anggota | ✅ CRUD data anggota |
| Lihat profil sendiri | ✅ Verifikasi & approve pendaftaran |
| Kartu anggota digital (QR) | ✅ Cetak kartu anggota |
| — | ✅ Atur status (aktif/nonaktif/keluar) |
| — | ✅ Riwayat aktivitas per anggota |

### 2. Simpanan
| Mobile (Anggota) | Desktop (Admin) |
|-|-|
| ✅ Lihat saldo & mutasi | ✅ Catat setoran tunai |
| ✅ Riwayat simpanan | ✅ Kelola simpanan pokok, wajib, sukarela |
| ✅ Notifikasi jatuh tempo simpanan wajib | ✅ Kelola deposito |
| — | ✅ Rekonsiliasi transfer masuk |
| — | ✅ Laporan simpanan harian/bulanan |

### 3. Pinjaman
| Mobile (Anggota) | Desktop (Admin) |
|-|-|
| ✅ Ajukan pinjaman (form) | ✅ Lihat & proses pengajuan |
| ✅ Cek status pengajuan | ✅ Approval bertingkat |
| ✅ Lihat jadwal angsuran | ✅ Pencairan pinjaman |
| ✅ Bayar angsuran (via transfer/QRIS) | ✅ Catat angsuran tunai |
| ✅ Sisa pinjaman + grafik | ✅ Hitung denda otomatis |
| — | ✅ Atur jenis bunga (flat, efektif, anuitas, syariah) |
| — | ✅ Laporan pinjaman & kolektibilitas |

### 4. Pembukuan
| Mobile | Desktop |
|-|-|
| — | ✅ Jurnal transaksi otomatis |
| — | ✅ Buku kas & bank |
| — | ✅ Buku besar |
| — | ✅ Neraca saldo |
| — | ✅ Laba rugi / SHU |
| — | ✅ Neraca |
| — | ✅ Arus kas |

> Pembukuan **hanya di desktop** — terlalu kompleks untuk mobile anggota.

### 5. Role & Akses
| Mobile | Desktop |
|-|-|
| ✅ Login (email/telepon + password) | ✅ Multi-level role |
| ✅ 2FA (opsional) | ✅ RBAC per modul |
| ✅ Lupa password | ✅ CRUD pengguna & hak akses |
| — | ✅ Log aktivitas & audit trail |

---

## 🟡 FASE 2: Standard

### 6. SHU (Sisa Hasil Usaha)
| Mobile (Anggota) | Desktop (Admin) |
|-|-|
| ✅ Lihat SHU yang diterima | ✅ Hitung SHU otomatis dari data tahun buku |
| ✅ Rincian JMA + JUA | ✅ Atur alokasi proporsi |
| ✅ Riwayat SHU tahun lalu | ✅ Preview & approval SHU |
| — | ✅ Buku SHU per anggota |
| — | ✅ Export daftar SHU |

### 7. RAT (Rapat Anggota Tahunan)
| Mobile (Anggota) | Desktop (Admin) |
|-|-|
| ✅ Akses undangan RAT | ✅ Generate laporan keuangan RAT |
| ✅ Lihat dokumen RAT (PDF) | ✅ Template RAT digital |
| ✅ Voting online (e-RAT) | ✅ Notulen otomatis |
| ✅ Suara real-time | ✅ Export PDF / XLSX |
| — | ✅ Arsip RAT tahunan |

### 8. Unit Usaha
| Mobile | Desktop |
|-|-|
| — | ✅ **Toko**: POS, barcode, stok, kasir |
| — | ✅ **PPOB**: Listrik, PDAM, BPJS, pulsa, token |
| — | ✅ **Jasa**: booking & pembayaran |
| — | ✅ Manajemen stok & supplier |
| — | ✅ Multi-unit dalam 1 dashboard |

> Operasional unit usaha **desktop-only**. Mobile anggota bisa lihat produk & belanja (Fase 3 marketplace).

### 9. Dashboard & Analytics
| Mobile (Anggota) | Desktop (Admin) |
|-|-|
| ✅ SHU & saldo ringkasan | ✅ Total anggota, simpanan, pinjaman, SHU |
| ✅ Aktivitas terakhir | ✅ Grafik pertumbuhan |
| — | ✅ Indikator kesehatan (rasio likuiditas, solvabilitas) |
| — | ✅ Aktivitas terkini & notifikasi real-time |

### 10. Manajemen Pengguna
| Mobile | Desktop |
|-|-|
| — | ✅ CRUD pengurus & karyawan |
| — | ✅ Log aktivitas & audit trail |
| — | ✅ Ganti password akun sendiri |

---

## 🔴 FASE 3: Advanced

### 11. Pembayaran Digital
| Mobile (Anggota) | Desktop (Admin) |
|-|-|
| ✅ Bayar via QRIS scan | ✅ Konfigurasi payment gateway |
| ✅ Bayar via virtual account | ✅ Riwayat transaksi digital |
| ✅ Auto-debet simpanan wajib | ✅ Rekonsiliasi otomatis |
| ✅ Pilih e-wallet (GoPay/OVO/DANA/ShopeePay) | — |

### 12. E-Commerce / Marketplace
| Mobile (Anggota) | Desktop (Admin) |
|-|-|
| ✅ Toko online — lihat & beli produk | ✅ Kelola produk & stok |
| ✅ Keranjang & checkout | ✅ Atur harga & diskon |
| ✅ Bayar via saldo simpanan / transfer | ✅ Kelola pesanan |
| — | ✅ Manajemen kurir/pengiriman |

### 13. AI & Smart Features
| Mobile | Desktop |
|-|-|
| — | ✅ Deteksi transaksi mencurigakan |
| — | ✅ Prediksi risiko kredit anggota |
| — | ✅ Forecasting SHU & kesehatan koperasi |
| ✅ Rekomendasi produk pinjaman (push notif) | — |

### 14. Integrasi Eksternal
| Mobile | Desktop |
|-|-|
| — | ✅ Open API (REST/GraphQL) |
| ✅ Notifikasi push dari webhook | ✅ Webhook konfigurasi |
| — | ✅ Export data (CSV, XLSX, PDF) |
| — | ✅ Sinkronisasi Dinas Koperasi daerah |
| — | ✅ Koneksi BPJS Kesehatan (kopdes) |

---

## 🟣 PWA / Teknis

| Fitur | Mobile (Anggota) | Desktop (Admin) |
|-|-|-|
| Offline-first cache data kritikal | ✅ Wajib — koneksi desa lemot | ⚠️ Nice-to-have |
| Installable (add to home screen) | ✅ Wajib | ✅ Optional |
| Push notification | ✅ Tagihan, jatuh tempo | ✅ Aktivitas perlu approval |
| Background sync | ✅ Simpan data offline, sync pas online | — |
| Scan QR code | ✅ Pembayaran, kartu anggota | ✅ Scan kartu anggota |
| Responsive layout | ✅ Mobile-first | ✅ Desktop-first |

---

## 🎯 Prioritas Fitur (Rekomendasi)

| Priority | Modul | Mobile | Desktop | Kenapa |
|----------|-------|--------|---------|--------|
| **P1** | Anggota, Simpanan, Pinjaman, Buku Kas | ✅ | ✅ | Core bisnis — tanpa ini bukan koperasi |
| **P1** | PWA offline + installable | ✅ | — | **Pembeda utama** dari semua kompetitor |
| **P1** | Role & akses multi-level | — | ✅ | Wajib buat backoffice |
| **P2** | SHU otomatis | Lihat | ✅ | Hitungan rumit, harus akurat tiap tahun |
| **P2** | Laporan & RAT | Lihat | ✅ | Wajib hukumnya tiap tahun |
| **P2** | Dashboard analytics | ✅ | ✅ | Biar anggota & pengurus percaya |
| **P3** | Multi-unit (toko, PPOB) | — | ✅ | Scale up bisnis |
| **P3** | Pembayaran digital | ✅ | ✅ | Biar ga ketinggalan jaman |
| **P4** | AI, Marketplace, API | — | ✅ | Future-proof |
