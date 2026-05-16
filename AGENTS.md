# AGENTS.md — Koperasi Backoffice

> AI agent guide. Read before writing code.

**Status:** Phase 1 MVP ✅ (Anggota, Simpanan, Pinjaman, Pembukuan, Tagihan, Denda, Kolektibilitas, SHU, Audit Log, Auth/RBAC, Dashboard)

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

---

## ✅ PRE-COMMIT

- [ ] Build passes (`npm run build`)
- [ ] No console.log, no hardcoded values
- [ ] Zod validation on every POST/PATCH
- [ ] Response format `{ success, data/error }`
- [ ] Migration generated if schema changes
- [ ] Toast messages are specific, not generic

---

*Updated: May 2026. Use `/coding-patterns` prompt template for detailed code generation.*
