import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || "koperasi-dev-secret-change-in-production",
  nodeEnv: process.env.NODE_ENV || "development",
};
