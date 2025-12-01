import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({
  host: env.pgHost,
  port: env.pgPort,
  user: env.pgUser,
  password: env.pgPassword,
  database: env.pgDatabase
});

// Helper for parameterized queries
export const query = (text: string, params?: unknown[]) => pool.query(text, params);
