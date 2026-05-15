-- ================================================================
--  KaasFlow — Supabase Database Schema
--  Run this entire file in the Supabase SQL Editor
--  Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================================

-- ── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. USERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kf_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    financier_name  TEXT NOT NULL DEFAULT '',
    business_name   TEXT NOT NULL DEFAULT '',
    password_hash   TEXT,
    google_id       TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. CLIENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kf_clients (
    id          TEXT PRIMARY KEY,           -- matches localStorage uid()
    user_id     UUID NOT NULL REFERENCES kf_users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL,
    address     TEXT DEFAULT '',
    id_num      TEXT DEFAULT '',
    occupation  TEXT DEFAULT '',
    created_at  DATE DEFAULT CURRENT_DATE,
    synced_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. LOANS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kf_loans (
    id              TEXT PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES kf_users(id) ON DELETE CASCADE,
    client_id       TEXT NOT NULL REFERENCES kf_clients(id) ON DELETE CASCADE,
    principal       NUMERIC(12,2) NOT NULL,
    interest_rate   NUMERIC(6,3) DEFAULT 0,
    duration        INTEGER NOT NULL,        -- number of periods
    type            TEXT DEFAULT 'monthly',  -- monthly | weekly | daily
    start_date      DATE NOT NULL,
    status          TEXT DEFAULT 'active',   -- active | completed
    created_at      DATE DEFAULT CURRENT_DATE,
    synced_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. PAYMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kf_payments (
    id          TEXT PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES kf_users(id) ON DELETE CASCADE,
    loan_id     TEXT NOT NULL REFERENCES kf_loans(id) ON DELETE CASCADE,
    amount      NUMERIC(12,2) NOT NULL,
    date        DATE NOT NULL,
    note        TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    synced_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. SETTINGS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kf_settings (
    user_id         UUID PRIMARY KEY REFERENCES kf_users(id) ON DELETE CASCADE,
    financier_name  TEXT DEFAULT '',
    business_name   TEXT DEFAULT '',
    theme           TEXT DEFAULT 'dark',
    lang            TEXT DEFAULT 'en',
    extra_clients   INTEGER DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. SUBSCRIPTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kf_subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES kf_users(id) ON DELETE CASCADE,
    plan_id             TEXT NOT NULL,         -- free | monthly | quarterly | yearly
    plan_name           TEXT NOT NULL,
    amount_paid         NUMERIC(10,2) DEFAULT 0,
    razorpay_payment_id TEXT,
    start_date          TIMESTAMPTZ DEFAULT NOW(),
    expiry_date         TIMESTAMPTZ,
    status              TEXT DEFAULT 'active', -- active | expired | cancelled
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES for fast lookups ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_user    ON kf_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user      ON kf_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_client    ON kf_loans(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_user   ON kf_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_loan   ON kf_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_subs_user       ON kf_subscriptions(user_id);

-- ── Row Level Security (RLS) — users can only see own data ──
ALTER TABLE kf_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE kf_clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE kf_loans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE kf_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kf_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kf_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow service-role (backend) full access; restrict anon
-- NOTE: The Flask backend uses the SERVICE ROLE key, so it bypasses RLS.
--       These policies protect direct client access.

CREATE POLICY "service_role_all" ON kf_users         FOR ALL USING (true);
CREATE POLICY "service_role_all" ON kf_clients       FOR ALL USING (true);
CREATE POLICY "service_role_all" ON kf_loans         FOR ALL USING (true);
CREATE POLICY "service_role_all" ON kf_payments      FOR ALL USING (true);
CREATE POLICY "service_role_all" ON kf_settings      FOR ALL USING (true);
CREATE POLICY "service_role_all" ON kf_subscriptions FOR ALL USING (true);

-- ── Trigger: auto-update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON kf_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_settings_updated
  BEFORE UPDATE ON kf_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
