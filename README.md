# Koperasi Backoffice MVP

Aplikasi backoffice koperasi modern dengan stack Hono + React + SQLite.

## 🏗️ Stack

| Layer | Teknologi |
|-------|-----------|
| API Backend | Hono + Node.js + Drizzle ORM + SQLite |
| Admin Dashboard | React + Vite + Tailwind CSS v4 + shadcn/ui |
| Shared | Zod schemas + TypeScript types |
| Monorepo | npm workspaces + Turborepo |

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build shared package (types & schemas)
cd shared && npm run build && cd ..

# 3. Setup database (migrate + seed)
npm run db:migrate
npm run db:seed

# 4. Run everything (API + Admin)
npm run dev
```

| App | URL | Description |
|-----|-----|-------------|
| API | http://localhost:3001 | REST API backend |
| Admin | http://localhost:3002 | Dashboard admin/pengurus |

## 🔑 Default Login

- **Admin**: `admin@koperasi.id` / `admin123`

## 🌱 Database Commands

```bash
npm run db:migrate     # Apply migrations
npm run db:seed        # Seed all tables (idempotent)
npm run db:seed --list # List available seeders
npm run db:seed -- users akun  # Seed specific tables only
```

Database file: `api/database/koperasi.db`

## 🧪 Testing

```bash
npm test              # Run all 236 tests
npm run test:watch    # Watch mode
```

**Framework:** Vitest v4. Each test file runs in isolation with its own temporary SQLite database. No server needed — tests use Hono's built-in `app.request()`.

```
api/src/__tests__/
├── setup.ts          # Shared helpers
├── health.test.ts    #    1 test
├── auth.test.ts      #    7 tests
├── anggota.test.ts   #    8 tests
├── simpanan.test.ts  #   16 tests
├── pinjaman.test.ts  #   25 tests
├── tagihan.test.ts   #   13 tests
├── jurnal.test.ts    #   14 tests
├── dashboard.test.ts #    6 tests
├── shu.test.ts       #   19 tests
├── rat.test.ts       #   27 tests
├── users.test.ts     #   26 tests
└── rbac.test.ts      #   74 tests
```

## 🗄️ Project Structure

```
koperasi-backoffice/
├── api/                 # Backend Hono
│   ├── src/
│   │   ├── routes/      # Route definitions
│   │   ├── controllers/ # Request handling
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth, audit, error
│   │   ├── seeders/     # Per-table seeders
│   │   └── lib/         # Config, db client, logger
│   └── database/        # Schema + migrations + koperasi.db
├── admin/               # Admin Dashboard (React + Vite)
└── shared/              # Shared types & Zod schemas
```

## ✅ Phase 2 Features

### Backend (API)
- [x] JWT Authentication + RBAC
- [x] Anggota CRUD
- [x] Simpanan (Pokok, Wajib, Sukarela, Deposito)
- [x] Pinjaman + Angsuran (flat bunga)
- [x] Dashboard ringkasan
- [x] Pembukuan (jurnal, buku kas, buku besar, neraca)
- [x] Tagihan simpanan wajib
- [x] Audit log
- [x] SHU (hitung otomatis + JMA/JUA)
- [x] RAT (full state machine)
- [x] User management

### Admin Dashboard
- [x] Login
- [x] Dashboard with stats cards
- [x] Anggota management (CRUD)
- [x] Simpanan records
- [x] Pinjaman approval workflow
- [x] Pembukuan & laporan keuangan
- [x] Tagihan management
- [x] SHU calculation & distribution
- [x] RAT management
- [x] Audit log viewer
- [x] User management
