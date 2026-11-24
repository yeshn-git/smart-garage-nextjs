-- SmartGarage AI - PostgreSQL schema (Neon)
-- The app creates these tables automatically on first request.
-- You can also run this file in the Neon SQL Editor.

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,                -- bcrypt hash, never the real password
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand        TEXT NOT NULL,
  model        TEXT NOT NULL,
  year         INTEGER NOT NULL,
  reg_number   TEXT NOT NULL,
  fuel_type    TEXT NOT NULL DEFAULT '',
  mileage      TEXT NOT NULL DEFAULT '',
  problem      TEXT NOT NULL,
  image_data   TEXT,                          -- compressed JPEG as data URL (optional)
  ai_analysis  JSONB,                         -- structured Gemini result
  ai_status    TEXT NOT NULL DEFAULT 'failed' CHECK (ai_status IN ('completed', 'failed')),
  status       TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  admin_notes  TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_customer ON service_requests (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_created  ON service_requests (created_at DESC);

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day     DATE NOT NULL,
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- Make an existing user an admin (alternative to ADMIN_EMAILS):
-- UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';
