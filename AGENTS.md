# AGENTS.md — Koperasi Backoffice

> Panduan untuk AI agent. Baca ini sebelum nulis kode APAPUN.

---

## ⚠️ MANDATORY: READ THIS FIRST

Sebelum nulis kode, **WAJIB** baca:

1. **`ARCHITECTURE.md`** — Stack, struktur, schema, API routes
2. **`FLOW_DAN_LOGIC.md`** — Flow bisnis, logic perhitungan, state machine
3. **`RESEARCH_KOPERASI_FEATURES.md`** — Fitur backoffice (anggota, simpanan, pinjaman, SHU, dll)
4. **Existing code** — Lihat pola yang udah ada, jangan bikin sendiri

> **Status: Phase 1 MVP ✅ COMPLETE** — Anggota, Simpanan, Pinjaman, Pembukuan (Jurnal → Buku Besar → Neraca Saldo → Laba Rugi → Neraca), Tagihan Wajib, Denda Otomatis, Kolektibilitas, Audit Log.

**JANCOK: Kalo ga baca, kode lu bakal gw reject.**

---

## 🏗️ Stack

| Layer | Teknologi | Wajib? |
|-------|-----------|--------|
| Frontend Admin | React + Vite + PWA (optional) | ✅ |
| API Backend | Hono + Node.js | ✅ |
| Database | SQLite (better-sqlite3) | ✅ |
| ORM | Drizzle | ✅ |
| Styling | Tailwind CSS v4 + shadcn/ui | ✅ |
| Auth | JWT (hono/jwt) | ✅ |
| Validation | Zod | ✅ |
| State (client) | TanStack React Query | ✅ |
| Routing | React Router v7 | ✅ |
| Package Manager | npm | ✅ |
| Monorepo | Turborepo | ✅ — 1 cmd `turbo dev` |

> **GA PAKE:** Next.js, Bun, Laravel, PostgreSQL, Supabase, Turso, Prisma, Startup nonsense.

---

## 📁 Struktur Folder

```
koperasi-backoffice/
├── api/                 # Backend Hono
│   ├── src/
│   │   ├── routes/      # Route definitions (thin!)
│   │   ├── controllers/ # Request handling
│   │   ├── services/    # Business logic (ini yg penting)
│   │   ├── middleware/   # Auth, validate, error
│   │   └── lib/         # Config, db, logger
│   ├── database/
│   │   └── schema/      # Drizzle schema definitions
│   └── package.json
│
├── admin/               # Admin Dashboard (backoffice-only)
│   └── src/ […same…]
│
└── shared/              # Shared types & schemas
    └── src/
        ├── types/       # TypeScript interfaces
        └── schemas/     # Zod validation schemas
```

### Aturan Folder:
- **Ini monorepo simple** — 3 project (`api/`, `admin/`, `shared/`) dalam 1 repo.
- **Jangan bikin folder `apps/` atau `packages/`** — langsung `api/`, `admin/`, `shared`.
- **Routes harus tipis** — logic di services, routes cuma manggil.
- **Controllers harus tipis** — parse request, validasi, panggil service, return response.

---

## 🔨 CONVENTIONS (WAJIB DIIKUTI)

### 1. Naming Convention

| Item | Aturan | Contoh |
|------|--------|--------|
| File route | `kebab-case` | `anggota.route.ts` |
| File controller | `kebab-case` | `pinjaman.controller.ts` |
| File service | `kebab-case` | `shu.service.ts` |
| File schema | `kebab-case` | `anggota.schema.ts` |
| Class/Interface | `PascalCase` | `PinjamanService` |
| Function | `camelCase` | `hitungSHU()` |
| Variable | `camelCase` | `totalSimpanan` |
| DB column | `snake_case` | `no_anggota` |
| API route | `kebab-case` | `/api/pinjaman/:id/approve` |

### 2. Tiga-Layer Architecture

```
Route → Controller → Service → DB
         ↓            ↓
    (validasi)   (business logic)
```

**Aturan:**
- **Route cuma 3 baris:** `router.get('/', c.list)`
- **Controller cuma:** Parse request → Validate → Call service → Return response
- **Service = business logic** — ini yang ditest, bukan controller
- **Kalo ada query DB, pake Drizzle langsung di service** — ga perlu repository pattern

### 3. API Pattern

```
✅ GET    /api/resource              → List
✅ GET    /api/resource/:id          → Detail
✅ POST   /api/resource              → Create
✅ PATCH  /api/resource/:id          → Update partial
✅ DELETE /api/resource/:id          → Soft delete / nonaktifkan
❌ JANGAN pake PUT kalo ga replace seluruh resource
❌ JANGAN bikin endpoint kaya /api/getAllData — spesifik per resource
```

### 4. Error Handling

```typescript
// Di service: throw error kalo ada masalah
throw new HTTPException(404, { message: 'Anggota tidak ditemukan' })

// Di controller: biarin error handler global yang nangkap
// JANGAN try-catch di controller (udah ada global error handler)
```

### 5. Response Format

```typescript
// Success
{ success: true, data: { ... } }

// List dengan pagination
{ success: true, data: [...], meta: { page, limit, total } }

// Error
{ success: false, error: { code: 404, message: '...' } }
```

---

## 🛠️ CODING RULES

### Turborepo

Root `package.json`:
```json
{
  "name": "koperasi-backoffice",
  "private": true,
  "workspaces": ["api", "admin", "shared"]
}
```

`turbo.json`:
```json
{
  "pipeline": {
    "dev": {},
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

Cara jalan:
```bash
npm install -g turbo    # sekali doang
npm install
turbo dev               # Jalanin API + Admin BERSAMAAN
```

```typescript
// ✅ PAKE Drizzle query builder
const anggota = await db.select().from(anggotaTable).where(eq(anggotaTable.id, id))

// ✅ Kalo butuh transaction
await db.transaction(async (tx) => {
  await tx.insert(anggotaTable).values(...)
  await tx.update(simpananTable).set(...)
})

// ❌ JANGAN pake raw SQL kalo ga urgent
// ❌ JANGAN pake ORM lain (Eloquent, Prisma, dll)
```

### Zod Validation

```typescript
// ✅ Shared schema di packages/shared/src/schemas/
export const anggotaSchema = z.object({
  nik: z.string().length(16),
  nama: z.string().min(3),
  // ...
})

// ✅ Validasi di controller sebelum masuk service
const validated = anggotaSchema.parse(req.body) // throw otomatis kalo gagal

// ❌ JANGAN validasi manual di service (if/else panjang)
// ❌ JANGAN duplicate schema di frontend & backend (pake shared/)
```

### React Components

```typescript
// ✅ Functional component
function AnggotaCard({ anggota }: { anggota: Anggota }) {
  return <div>...</div>
}

// ✅ Data fetching pake TanStack Query
function useAnggota(id: string) {
  return useQuery({
    queryKey: ['anggota', id],
    queryFn: () => api.get(`/api/anggota/${id}`),
  })
}

// ❌ JANGAN pake useState buat server data (pake React Query)
// ❌ JANGAN pake useEffect + fetch manual (pake React Query)
// ❌ JANGAN bikin components >200 baris
```

### Styling

```typescript
// ✅ Tailwind CSS v4
<div className="flex items-center gap-2 p-4 bg-white rounded-lg">

// ✅ shadcn/ui untuk komponen complex (Table, Dialog, Form)
// ❌ JANGAN inline styles
// ❌ JANGAN CSS modules (pake Tailwind aja)
// ❌ JANGAN pake UI library lain (MUI, Antd, Chakra)
```

---

## 📱 PWA (Optional — Admin Only)

> Admin dashboard bisa di-install sebagai PWA. Tidak ada app terpisah untuk anggota.

### Service Worker (Production Only)
- **Cache static assets** (app shell, css, js) pas install
- **Network-first** buat semua API requests
- **Tampilkan pesan** "Butuh koneksi internet" kalo offline

### IndexedDB
- Pake **Dexie.js** wrapper
- Simpan cache data read-only: `anggota`, `simpanan`, `pinjaman`
- Jangan simpan data sensitif (token, password) di IndexedDB

### Manifest
- `display: standalone`
- `theme_color: #16a34a` (green)

---

## 🗄️ DATABASE RULES

### Migrations
```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate
```

### Schema Conventions
```typescript
// ✅ id selalu uuid pake crypto.randomUUID()
id: text('id').primaryKey(),

// ✅ timestamp selalu pakai default
createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),

// ✅ status pake text bukan enum (SQLite ga support enum)
status: text('status', { enum: ['aktif', 'nonaktif'] }).notNull(),

// ✅ decimal pake text (SQLite ga support decimal)
jumlah: text('jumlah').notNull(), // simpan sebagai string, parse di TS
```

### Common Columns (setiap tabel)
```typescript
id: text('id').primaryKey(),
createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
updatedAt: text('updated_at').default(sql`(datetime('now'))`).$onUpdate(() => sql`(datetime('now'))`).notNull(),
```

---

## 🔐 AUTH RULES

- **JWT-based** pake `@hono/jwt`
- **Token di header** `Authorization: Bearer <token>`
- **Token expire** 24 jam (refresh token skip dulu buat MVP)
- **RBAC di middleware** — bukan di controller
- **Role:** `super_admin`, `admin`, `pengurus`, `bendahara`, `pengawas`, `anggota`

```typescript
// Middleware auth
app.use('/api/*', jwt({ secret: config.jwtSecret }))

// Middleware RBAC (custom)
app.use('/api/admin/*', requireRole(['admin', 'pengurus']))
```

---

## 🚫 ANTI-PATTERNS (JANGAN PERNAH)

| ❌ Jangan | ✅ Lakukan |
|-----------|-----------|
| Pake Nx / Lerna | Pake Turborepo aja |
| Pake Next.js | React + Vite |
| Pake Bun | Node.js LTS |
| Pake Prisma | Drizzle |
| Pake PostgreSQL | SQLite |
| Pake Supabase / Turso | Self-hosted SQLite |
| Pake state management kaya Redux/Zustand | React Query buat server, useState buat UI |
| Copy-paste schema frontend-backend | Shared `shared/` package |
| Bikin controller gemuk (>100 baris) | Pindahin logic ke service |
| Throw error di controller | Throw di service, biarin global handler |
| Console.log | Pake logger |
| Bikin endpoint `/api/get-all-data` | Spesifik per resource |
| Langsung merge tanpa review | Minta review dulu |
| Refactor kalo ga perlu | YANG PENTING JALAN |

---

## ✅ CHECKLIST SEBELUM COMMIT

- [ ] Build ga error (`cd api && npm run build`)
- [ ] Linter ga ngeluh
- [ ] Naming udah sesuai convention
- [ ] Ga ada console.log
- [ ] Ga ada hardcoded value (pake config / env)
- [ ] Error handling sesuai aturan
- [ ] Zod validation ada di setiap POST/PATCH
- [ ] API response format sesuai standar
- [ ] Migration jalan kalo ada schema change

---

## 💬 TONE & COMMUNICATION

Kalo lu AI agent yang baca ini:

1. **Jangan nanya** "Apakah Anda ingin saya melanjutkan?" — langsung gas.
2. **Jangan minta approval** buat hal kecil (rename, refactor kecil, nambah komentar).
3. **Minta approval** cuma buat: hapus file, ganti struktur besar, migrasi DB, push ke production.
4. **Jelasin** kalo ngubah sesuatu — kenapa, dampak, alternatif.
5. **Kalo ragu, tanya.** Tapi jangan nanya hal yang udah jelas di dokumen ini.

---

*Terakhir diupdate: 12 Mei 2026*
*Phase 1 MVP complete — ready for Phase 2 (SHU, RAT, Unit Usaha)*
