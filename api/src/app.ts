/**
 * Hono app instance — separated from server startup so tests can import it
 * without listening on a port.
 *
 * Tests: import { app } from "./app.js" → app.request(path, options)
 * Server: import { app } from "./app.js" → serve({ fetch: app.fetch })
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { errorHandler } from "./middleware/error.js";
import { authRoute } from "./routes/auth.route.js";
import { anggotaRoute } from "./routes/anggota.route.js";
import { simpananRoute } from "./routes/simpanan.route.js";
import { pinjamanRoute } from "./routes/pinjaman.route.js";
import { dashboardRoute } from "./routes/dashboard.route.js";
import { jurnalRoute } from "./routes/jurnal.route.js";
import { tagihanRoute } from "./routes/tagihan.route.js";
import { auditRoute } from "./routes/audit.route.js";
import { shuRoute } from "./routes/shu.route.js";
import { ratRoute } from "./routes/rat.route.js";
import { userRoute } from "./routes/user.route.js";
import { searchRoute } from "./routes/search.route.js";
import { koperasiRoute } from "./routes/koperasi.route.js";
import { periodeBukuRoute } from "./routes/periode-buku.route.js";

const app = new Hono();

app.use(cors({ origin: "*" }));
app.use(honoLogger());

app.get("/health", (c) => c.json({ ok: true }));

app.route("/api/auth", authRoute);
app.route("/api/anggota", anggotaRoute);
app.route("/api/simpanan", simpananRoute);
app.route("/api/pinjaman", pinjamanRoute);
app.route("/api/dashboard", dashboardRoute);
app.route("/api/jurnal", jurnalRoute);
app.route("/api/tagihan", tagihanRoute);
app.route("/api/audit", auditRoute);
app.route("/api/shu", shuRoute);
app.route("/api/rat", ratRoute);
app.route("/api/users", userRoute);
app.route("/api/search", searchRoute);
app.route("/api/koperasi", koperasiRoute);
app.route("/api/periode-buku", periodeBukuRoute);

app.onError(errorHandler);

export { app };
