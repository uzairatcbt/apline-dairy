import fs from "fs";
import path from "path";
import { pool } from "./config/db";

const migrationsDir = path.join(__dirname, "migrations");
const MIGRATIONS_TABLE = "schema_migrations";

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getAppliedMigrations = async (): Promise<Set<string>> => {
  const res = await pool.query<{ name: string }>(`SELECT name FROM ${MIGRATIONS_TABLE}`);
  return new Set(res.rows.map((r: { name: string }) => r.name));
};

const applyMigration = async (name: string, sql: string) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [name]
    );
    await client.query("COMMIT");
    console.log(`Applied ${name}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`Failed ${name}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

const run = async () => {
  console.log("Running migrations...");
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await applyMigration(file, sql);
  }

  console.log("Migrations complete.");
  await pool.end();
};

run().catch((err) => {
  console.error("Migration run failed:", err);
  process.exit(1);
});
