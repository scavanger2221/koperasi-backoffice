# AGENTS.md — Koperasi Backoffice

> AI agent guide. Read before writing code.

**Status:** Phase 2 ✅ — RAT (full state machine + real docs + vote tallies + clone), SHU Export, User Management, Testing (477 tests, 12/12 admin pages)

---

## ⚠️ READ FIRST

1. `ARCHITECTURE.md` — Stack, DB schema, API routes
2. `FLOW_DAN_LOGIC.md` — Business flows, calculations, state machines
3. `RESEARCH_KOPERASI_FEATURES.md` — Feature specs
4. **Existing code** — Mirror existing patterns exactly

---

## 🏗️ Stack

React+Vite | Hono+Node.js | SQLite+Drizzle | Tailwind v4+shadcn/ui | JWT | Zod | TanStack Query | React Router v7 | Turborepo

**No:** Next.js, Bun, Prisma, PostgreSQL, Supabase, Redux, Nx.

---

## 📁 Structure

```
api/        src/{routes,controllers,services,middleware,lib}/   database/schema/
admin/      src/{pages,components,hooks,lib}/
shared/     src/{types,schemas}/
```

Direct folders only — NOT `apps/` or `packages/`.

---

## 🔨 CONVENTIONS

**Naming:** Files=kebab-case, Classes=PascalCase, funcs/vars=camelCase, DB=snake_case, API=kebab-case.

**3-Layer:** Route(thin)→Controller(thin)→Service(business logic+DB). Route=3 lines, Controller=parse→call→return, Service=class+methods+HTTPException.

**API:** `GET /` list, `GET /:id` detail, `POST /` create, `PATCH /:id` update, `DELETE /:id` delete. Action: `PATCH /:id/approve`. No PUT, no `/api/getAllData`.

**Response:** `{ success:true, data:{...} }` or `{ success:true, data:[...], meta:{page,limit,total} }` or `{ success:false, error:{code,message} }`.

**Route pattern:**
```typescript
export const route = new Hono()
  .use(authMiddleware)
  .get("/", requireRole([...]), controller.list)
  .post("/", requireRole([...]), auditMiddleware("ACTION","entity"), controller.create)
  .patch("/:id/action", ..., auditMiddleware("ACTION","entity"), controller.action)
```

---

## 🧩 FRONTEND PATTERNS

**Query:** `useQuery({ queryKey:["entity"], queryFn:()=>api<T>("/api/entity") })` + conditional fetch with `enabled`.

**Mutation:** `useMutation({ mutationFn:(id)=>api(path,{method,body:JSON.stringify(d)}), onSuccess:()=>{ invalidateQueries; toast("Specific message","success") }, onError:()=>toast("Specific error","error") })`

**API client:** `api<T>(path, options?)` — function, NOT object methods. Auto 401/403 redirect.

**Validation:**
```typescript
const errs = validate(form, { field: [rules.required("X"), rules.minLength(3,"X")] });
setErrors(errs); if (Object.keys(errs).length > 0) return;
// Clear per-field: onChange: setErrors(prev=>({...prev, field:""}))
// Clear on dialog close: onOpenChange: if(!v) setErrors({})
```

**Toast:** `toast("Entity approved", "success")` / `toast("Failed", "error")` — specific messages, not generic "Berhasil"/"Gagal".

**Dialog:**
```typescript
<DialogTrigger asChild>
  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"><Plus />Create</Button>
</DialogTrigger>
<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-xl">
  <DialogHeader><DialogTitle className="text-lg flex items-center gap-2"><Icon />Title</DialogTitle></DialogHeader>
  <div className="space-y-4">
    <FormField label="X" required error={errors.x}><Input onChange={e=>{...; setErrors(p=>({...p,x:""}))}} /></FormField>
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>Save</Button>
    </div>
  </div>
</DialogContent>
```

**Badge status:**
```typescript
const cfg = { draft:"bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" };
<Badge className={`${cfg} font-medium text-[11px] px-2 py-0.5`} variant="outline">Draft</Badge>
```

**Container:** `<div className="space-y-6 max-w-7xl mx-auto">` with header: `flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3`, heading: `text-2xl font-bold text-foreground tracking-tight`, subtitle: `text-sm text-muted-foreground mt-0.5`.

---

## 🗄️ DB PATH (SINGLE SOURCE OF TRUTH)

Database file: **`api/database/koperasi.db`**

| File | Path used |
|------|----------|
| `api/src/lib/db.ts` | `./database/koperasi.db` (relative to `api/` cwd) |
| `api/drizzle.config.ts` | `./database/koperasi.db` |
| `api/src/seeders/runner.ts` | `./database/koperasi.db` |

**Never hardcode the DB path** in any new file. If you need to open the database, use the same path as `db.ts`.

---

## 🌱 SEEDERS

Per-table seeders in `api/src/seeders/`:

```bash
npm run db:seed               # Run all seeders
npm run db:seed -- users      # Run specific seeder(s)
npm run db:seed --list        # List available seeders
npm run db:seed -- --skip jurnal  # Skip one
```

Each seeder exports:
```typescript
export async function seed(db: BetterSQLite3Database<typeof schema>) {
  // Idempotent: skip if data exists
  const existing = db.select().from(schema.table).limit(1).all();
  if (existing.length > 0) { console.log("...skip"); return; }
  // ... insert
}
```

Dependency order is defined in `runner.ts`. When adding a new table, create its seeder in `api/src/seeders/` and register it in `runner.ts`.

---

## 🗄️ DB SCHEMA

```typescript
export const table = sqliteTable("table", {
  id: text("id").primaryKey(),
  status: text("status", { enum: ["a","b"] }).notNull().default("a"),
  jumlah: text("jumlah").notNull(), // decimal as string
  aktif: integer("aktif", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).$onUpdate(() => sql`(datetime('now'))`).notNull(),
});
```

Generate migration: `cd api && npx drizzle-kit generate`

---

## 🧪 TESTING

**Framework:** Vitest v4 (same Vite ecosystem as admin).

**Architecture:** No mocking needed. `db.ts` reads `TEST_DATABASE_URL` env var. Each test file runs in an isolated forked process with its own temp SQLite database.

**No server required:** Tests import `app` from `api/src/app.ts` and use Hono's `app.request()` to hit routes directly.

### Test files

```
api/src/__tests__/
├── setup.ts          # Shared helpers: initTestDb, seedAdmin, seedAkun, getAdminToken
├── health.test.ts    # 1 test
├── auth.test.ts      # 7 tests  (login, validation, auth protection)
├── anggota.test.ts   # 8 tests  (CRUD, status changes)
├── simpanan.test.ts  # 16 tests (CRUD, saldo, filters, jurnal, RBAC)
├── pinjaman.test.ts  # 25 tests (full state machine, denda, kolektibilitas)
├── tagihan.test.ts   # 13 tests (generate, bayar, tunggakan, summary, RBAC)
├── jurnal.test.ts    # 14 tests (list, buku kas/besar, neraca, laba rugi, arus kas)
├── dashboard.test.ts # 6 tests  (ringkasan, charts, aktivitas, RBAC)
├── shu.test.ts       # 19 tests (hitung, state machine, export, RBAC)
├── rat.test.ts       # 32 tests (full state machine, real docs, vote tallies, agenda CRUD, clone, kehadiran)
├── users.test.ts     # 26 tests (CRUD, password, register, audit, RBAC)
└── rbac.test.ts      # 74 tests (every endpoint × all 6 roles)
```

**Total: 477 tests** | Run: `npm test` or `npm run test:watch`

### Writing tests

```typescript
import { app } from "../app.js";
import { initTestDb, seedAdmin, getAdminToken } from "./setup.js";

let token: string;

beforeAll(async () => {
  const { sqlite, testDb } = initTestDb();  // Temp DB + migrate
  seedAkun(testDb);
  await seedAdmin(testDb);
  sqlite.close();
  token = await getAdminToken(app);
});

it("does something", async () => {
  const res = await app.request("/api/endpoint", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ key: "value" }),
  });
  expect(res.status).toBe(200);
});
```

### Anti-patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Mock the database module | Let `db.ts` read `TEST_DATABASE_URL` env var |
| Start a server for tests | Use `app.request()` (no port needed) |
| Share test DB across files | Each file gets its own temp DB (fork isolation) |
| Clean up DB in each file | Global cleanup on worker exit |

---

## 🚫 ANTI-PATTERNS

| ❌ Don't | ✅ Do |
|----------|-------|
| Next.js, Bun, Prisma, PostgreSQL | React+Vite, Node, Drizzle, SQLite |
| Redux/Zustand for server data | React Query |
| Copy schema frontend↔backend | Shared `shared/` package |
| Thick controllers (>100 lines) | Logic in service |
| Try-catch in controller | Throw in service, global handler catches |
| `console.log` | Logger |
| Raw SQL | Drizzle query builder |
| PUT | PATCH for partial |
| Hardcode DB path in multiple files | Single source: `db.ts` → `./database/koperasi.db` |
| Monolithic seed file | Per-table seeders in `api/src/seeders/` |

---

## ✅ PRE-COMMIT

- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] No console.log, no hardcoded values
- [ ] Zod validation on every POST/PATCH
- [ ] Response format `{ success, data/error }`
- [ ] Migration generated if schema changes
- [ ] Toast messages are specific, not generic

---

*Updated: May 2026. Use `/coding-patterns` prompt template for detailed code generation.*
