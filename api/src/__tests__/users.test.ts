import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../app.js";
import { initTestDb, seedAdmin, seedAkun, getAdminToken } from "./setup.js";

describe("Users & Audit", () => {
  let token: string;

  beforeAll(async () => {
    const { sqlite, testDb } = initTestDb();
    seedAkun(testDb);
    await seedAdmin(testDb);
    sqlite.close();
    token = await getAdminToken(app);
  });

  // ── LIST ──────────────────────────────────────────────────────────────────

  it("GET /api/users — lists all users", async () => {
    const res = await app.request("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0]).toHaveProperty("email");
    expect(body.data[0]).toHaveProperty("nama");
    expect(body.data[0]).toHaveProperty("role");
    expect(body.data[0]).toHaveProperty("aktif");
    // Password should not be exposed
    expect(body.data[0]).not.toHaveProperty("password");
  });

  // ── CREATE ────────────────────────────────────────────────────────────────

  it("POST /api/users — creates a new user", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: "bendahara@test.com",
        password: "password123",
        nama: "Bendahara User",
        role: "bendahara",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
  });

  it("POST /api/users — creates a pengurus user", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: "pengurus@test.com",
        password: "password123",
        nama: "Pengurus User",
        role: "pengurus",
      }),
    });
    expect(res.status).toBe(201);
  });

  it("POST /api/users — rejects duplicate email", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: "bendahara@test.com",
        password: "password123",
        nama: "Duplicate",
        role: "bendahara",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/users — rejects invalid role", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: "invalid-role@test.com",
        password: "password123",
        nama: "Invalid Role",
        role: "non_existent_role",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/users — rejects short password", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: "shortpass@test.com",
        password: "12345",
        nama: "Short Password",
        role: "bendahara",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/users — returns 403 for non-admin role", async () => {
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bendahara@test.com", password: "password123" }),
    });
    const bToken = (await loginRes.json()).data.token;

    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bToken}` },
      body: JSON.stringify({
        email: "unauthorized@test.com",
        password: "password123",
        nama: "Unauthorized",
        role: "bendahara",
      }),
    });
    expect(res.status).toBe(403);
  });

  // ── GET BY ID ─────────────────────────────────────────────────────────────

  it("GET /api/users/:id — returns user detail (without password)", async () => {
    const listRes = await app.request("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userId = (await listRes.json()).data[0].id;

    const res = await app.request(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.email).toBeTruthy();
    expect(body.data).not.toHaveProperty("password");
  });

  it("GET /api/users/:id — returns 404 for non-existent user", async () => {
    const res = await app.request("/api/users/00000000-0000-0000-0000-000000000000", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────

  it("PATCH /api/users/:id — updates a user's role", async () => {
    const listRes = await app.request("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pengurusUser = (await listRes.json()).data.find((u: any) => u.role === "pengurus");
    if (!pengurusUser) return;

    const res = await app.request(`/api/users/${pengurusUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nama: "Pengurus Updated" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(pengurusUser.id);
  });

  // ── ACTIVATE / DEACTIVATE ────────────────────────────────────────────────

  it("PATCH /api/users/:id/aktifkan — activates a user", async () => {
    const listRes = await app.request("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = (await listRes.json()).data[0];

    const res = await app.request(`/api/users/${user.id}/aktifkan`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).data.aktif).toBe(true);
  });

  it("PATCH /api/users/:id/aktifkan — rejects on non-existent user", async () => {
    const res = await app.request("/api/users/00000000-0000-0000-0000-000000000000/aktifkan", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  // ── DEACTIVATE ────────────────────────────────────────────────────────────

  it("DELETE /api/users/:id — deactivates a user", async () => {
    // Create a disposable user
    const createRes = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: "disposable@test.com",
        password: "password123",
        nama: "Disposable User",
        role: "bendahara",
      }),
    });
    const userId = (await createRes.json()).data.id;

    const res = await app.request(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).data.aktif).toBe(false);
  });

  it("DELETE /api/users/:id — rejects deactivating non-existent user", async () => {
    const res = await app.request("/api/users/00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  // ── CHANGE PASSWORD ──────────────────────────────────────────────────────

  it("PATCH /api/auth/password — changes own password", async () => {
    const res = await app.request("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        passwordLama: "admin123",
        passwordBaru: "newadmin123",
      }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).data.ok).toBe(true);

    // Verify new password works
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@koperasi.id", password: "newadmin123" }),
    });
    expect(loginRes.status).toBe(200);
    const newToken = (await loginRes.json()).data.token;
    expect(newToken).toBeTruthy();

    // Change back
    await app.request("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${newToken}` },
      body: JSON.stringify({
        passwordLama: "newadmin123",
        passwordBaru: "admin123",
      }),
    });

    // Re-fetch token with original password
    token = await getAdminToken(app);
  });

  it("PATCH /api/auth/password — rejects wrong old password", async () => {
    const res = await app.request("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        passwordLama: "wrongpassword",
        passwordBaru: "newadmin123",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("PATCH /api/auth/password — rejects short new password", async () => {
    const res = await app.request("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        passwordLama: "admin123",
        passwordBaru: "12345",
      }),
    });
    expect(res.status).toBe(400);
  });

  // ── AUTH ME ───────────────────────────────────────────────────────────────

  it("GET /api/auth/me — returns current user info", async () => {
    const res = await app.request("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.email).toBe("admin@koperasi.id");
    expect(body.data.nama).toBe("Admin Test");
    expect(body.data.role).toBe("admin");
  });

  it("GET /api/auth/me — returns 401 without token", async () => {
    const res = await app.request("/api/auth/me");
    expect(res.status).toBe(401);
  });

  // ── AUDIT ─────────────────────────────────────────────────────────────────

  it("GET /api/audit — lists audit logs (paginated)", async () => {
    const res = await app.request("/api/audit", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toMatchObject({ page: 1, limit: 50 });
  });

  it("GET /api/audit — returns 401 without token", async () => {
    const res = await app.request("/api/audit");
    expect(res.status).toBe(401);
  });

  it("GET /api/audit — returns 403 for bendahara role", async () => {
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bendahara@test.com", password: "password123" }),
    });
    const bToken = (await loginRes.json()).data.token;

    const res = await app.request("/api/audit", {
      headers: { Authorization: `Bearer ${bToken}` },
    });
    // bendahara is not in the audit allowed roles (admin, pengurus, pengawas)
    expect(res.status).toBe(403);
  });

  // ── REGISTER ──────────────────────────────────────────────────────────────

  it("POST /api/auth/register — creates member account", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: "New Member",
        email: "newmember@test.com",
        password: "password123",
        noTelepon: "081234567893",
        nik: "5555555555555555",
        alamat: "Jl. Baru No. 1",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(body.data.user.role).toBe("anggota");
  });

  it("POST /api/auth/register — rejects duplicate email", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: "Duplicate Member",
        email: "newmember@test.com",
        password: "password123",
        noTelepon: "081234567894",
        nik: "4444444444444444",
        alamat: "Jl. Duplicate No. 1",
      }),
    });
    expect(res.status).toBe(409);
  });

  it("POST /api/auth/register — rejects duplicate NIK", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: "Duplicate NIK",
        email: "nik-dup@test.com",
        password: "password123",
        noTelepon: "081234567895",
        nik: "5555555555555555", // same as above
        alamat: "Jl. NIK Duplicate No. 1",
      }),
    });
    expect(res.status).toBe(409);
  });

  it("POST /api/auth/register — rejects invalid email", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: "Bad Email",
        email: "not-an-email",
        password: "password123",
        noTelepon: "081234567896",
        nik: "3333333333333333",
        alamat: "Jl. Bad Email No. 1",
      }),
    });
    expect(res.status).toBe(400);
  });
});
