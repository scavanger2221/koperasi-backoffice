# Koperasi Backoffice MVP

Aplikasi backoffice koperasi modern dengan stack Hono + React + SQLite.

## 🏗️ Stack

| Layer | Teknologi |
|-------|-----------|
| API Backend | Hono + Node.js + Drizzle ORM + SQLite |
| Admin Dashboard | React + Vite + Tailwind CSS v4 + shadcn/ui |
| Mobile PWA | React + Vite + Tailwind CSS v4 + PWA |
| Shared | Zod schemas + TypeScript types |
| Monorepo | npm workspaces |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
cd api && mkdir -p data && npx drizzle-kit migrate

# Seed data (admin user)
npx tsx src/lib/seed.ts

# Run all apps
cd ..
npm run dev
```

## 📱 Apps

| App | URL | Description |
|-----|-----|-------------|
| API | http://localhost:3001 | REST API backend |
| Admin | http://localhost:3002 | Dashboard admin/pengurus |
| Mobile | http://localhost:3003 | PWA untuk anggota |

## 🔑 Default Login

- **Admin**: `admin@koperasi.id` / `admin123`

## ✅ MVP Features

### Backend (API)
- [x] JWT Authentication + RBAC
- [x] Anggota CRUD
- [x] Simpanan (Pokok, Wajib, Sukarela, Deposito)
- [x] Pinjaman + Angsuran (flat bunga)
- [x] Dashboard ringkasan

### Admin Dashboard
- [x] Login
- [x] Dashboard with stats cards
- [x] Anggota management (CRUD)
- [x] Simpanan records
- [x] Pinjaman approval workflow

### Mobile PWA
- [x] Login
- [x] Beranda (saldo summary)
- [x] Simpanan & mutasi
- [x] Pinjaman (ajukan & lihat status)
- [x] Profil
