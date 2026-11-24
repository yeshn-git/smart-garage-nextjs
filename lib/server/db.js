/* =========================================================================
   lib/server/db.js - Cloud PostgreSQL database (Neon, via Vercel Marketplace)

   DATABASE_URL is added automatically when you connect a Neon database to
   your Vercel project (Vercel -> Storage -> Create Database -> Neon).
   Tables are created automatically on first use (see SCHEMA below / db/schema.sql).
   Uses Neon's serverless HTTP driver, which is designed for Vercel Functions.
   ========================================================================= */
import { neon } from "@neondatabase/serverless";
import { ApiError } from "./errors.js";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name          TEXT NOT NULL,
     email         TEXT NOT NULL UNIQUE,
     phone         TEXT NOT NULL DEFAULT '',
     password_hash TEXT NOT NULL,
     role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS service_requests (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     customer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     brand        TEXT NOT NULL,
     model        TEXT NOT NULL,
     year         INTEGER NOT NULL,
     reg_number   TEXT NOT NULL,
     fuel_type    TEXT NOT NULL DEFAULT '',
     mileage      TEXT NOT NULL DEFAULT '',
     problem      TEXT NOT NULL,
     image_data   TEXT,
     ai_analysis  JSONB,
     ai_status    TEXT NOT NULL DEFAULT 'failed' CHECK (ai_status IN ('completed', 'failed')),
     status       TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
     admin_notes  TEXT NOT NULL DEFAULT '',
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_requests_customer ON service_requests (customer_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_requests_created ON service_requests (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS ai_usage (
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     day     DATE NOT NULL,
     count   INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (user_id, day)
   )`
];

let sqlClient = null;
let schemaPromise = null;

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new ApiError(500, "not_configured",
      "DATABASE_URL is not set. Connect a Neon database in Vercel -> Storage, or add it to .env.local.");
  }
  if (!sqlClient) sqlClient = neon(url);
  return sqlClient;
}

async function createSchema() {
  for (const stmt of SCHEMA) {
    try {
      await client().query(stmt);
    } catch (err) {
      // Two cold starts creating the same table at once -> ignore "already exists"
      if (!["42P07", "23505"].includes(err?.code)) throw err;
    }
  }
}

function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = createSchema().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

/** Runs a parameterised SQL query ($1, $2 ...) and returns the rows. */
export async function query(text, params = []) {
  await ensureSchema();
  try {
    return await client().query(text, params);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Database error:", err?.code, err?.message);
    if (err?.code === "23505") throw new ApiError(409, "conflict", "This record already exists.");
    throw new ApiError(500, "db_error", "Database error. Please try again.");
  }
}

export { SCHEMA };
