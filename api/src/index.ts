import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { config } from "./lib/config.js";
import { errorHandler } from "./middleware/error.js";
import { authRoute } from "./routes/auth.route.js";
import { anggotaRoute } from "./routes/anggota.route.js";
import { simpananRoute } from "./routes/simpanan.route.js";
import { pinjamanRoute } from "./routes/pinjaman.route.js";
import { dashboardRoute } from "./routes/dashboard.route.js";

const app = new Hono();

app.use(cors({ origin: "*" }));
app.use(honoLogger());

app.get("/health", (c) => c.json({ ok: true }));

app.route("/api/auth", authRoute);
app.route("/api/anggota", anggotaRoute);
app.route("/api/simpanan", simpananRoute);
app.route("/api/pinjaman", pinjamanRoute);
app.route("/api/dashboard", dashboardRoute);

app.onError(errorHandler);

serve({
  fetch: app.fetch,
  port: config.port,
});

console.log(`🚀 API running at http://localhost:${config.port}`);
