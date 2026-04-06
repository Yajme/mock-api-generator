-- ============================================================
--  Mock API Builder — Postgres Schema
--  Database: Supabase (Postgres 15+)
--  Run in order: extensions → tables → indexes → functions → cron
-- ============================================================


-- ------------------------------------------------------------
--  Extensions
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- crypt(), gen_salt()
CREATE EXTENSION IF NOT EXISTS "pg_cron";     -- TTL restore job


-- ============================================================
--  1. USERS
-- ============================================================

CREATE TABLE users (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  username        TEXT          NOT NULL UNIQUE,
  email           TEXT          NOT NULL UNIQUE,
  password_hash   TEXT          NOT NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
--  2. API KEYS
-- ============================================================

CREATE TABLE api_keys (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash      TEXT          NOT NULL UNIQUE,       -- SHA-256 of raw key; raw key shown once, never stored
  permissions   TEXT          NOT NULL DEFAULT 'read_write'
                              CHECK (permissions IN ('read', 'read_write')),
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_user_id   ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash  ON api_keys(key_hash);   -- hot path: every request looks this up


-- ============================================================
--  3. SCHEMAS
-- ============================================================

CREATE TABLE schemas (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID          REFERENCES users(id) ON DELETE SET NULL,  -- NULL = system preset
  name        TEXT          NOT NULL,
  is_preset   BOOLEAN       NOT NULL DEFAULT FALSE,
  fields      JSONB         NOT NULL DEFAULT '[]',
  -- fields shape: [{ "name": "email", "fakerType": "internet.email" }, ...]
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schemas_owner_id ON schemas(owner_id);

-- Presets have no owner; user schemas must have an owner
ALTER TABLE schemas
  ADD CONSTRAINT chk_schema_owner
  CHECK (
    (is_preset = TRUE AND owner_id IS NULL) OR
    (is_preset = FALSE AND owner_id IS NOT NULL)
  );


-- ============================================================
--  4. ENDPOINTS
-- ============================================================

CREATE TABLE endpoints (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schema_id       UUID          NOT NULL REFERENCES schemas(id) ON DELETE RESTRICT,
  name            TEXT          NOT NULL,
  version         TEXT          NOT NULL DEFAULT 'v1',
  visible_fields  JSONB         NOT NULL DEFAULT '[]',
  -- visible_fields shape: ["id", "email", "first_name"]
  cached_data     JSONB         NOT NULL DEFAULT '[]',
  -- cached_data shape: [{ ...fakerGeneratedRow }, ...]
  ttl_seconds     INTEGER       NOT NULL DEFAULT 3600 CHECK (ttl_seconds > 0),
  ttl_expires_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Enforce unique endpoint URL: /{username}/{version}/{endpoint-name}
  UNIQUE (owner_id, version, name)
);

CREATE INDEX idx_endpoints_owner_id       ON endpoints(owner_id);
CREATE INDEX idx_endpoints_schema_id      ON endpoints(schema_id);
CREATE INDEX idx_endpoints_ttl_expires_at ON endpoints(ttl_expires_at);  -- pg_cron scans this

CREATE TRIGGER trg_endpoints_updated_at
  BEFORE UPDATE ON endpoints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Recompute ttl_expires_at whenever ttl_seconds changes
CREATE OR REPLACE FUNCTION sync_ttl_expires_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ttl_seconds IS DISTINCT FROM OLD.ttl_seconds THEN
    NEW.ttl_expires_at = NOW() + (NEW.ttl_seconds || ' seconds')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_ttl
  BEFORE UPDATE ON endpoints
  FOR EACH ROW EXECUTE FUNCTION sync_ttl_expires_at();


-- ============================================================
--  5. SNAPSHOTS
-- ============================================================

CREATE TABLE snapshots (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint_id   UUID          NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  data          JSONB         NOT NULL DEFAULT '[]',
  -- Immutable copy of cached_data at endpoint creation (or last manual reset)
  captured_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (endpoint_id)  -- one active snapshot per endpoint
);

-- Automatically create a snapshot row when an endpoint is inserted
CREATE OR REPLACE FUNCTION create_initial_snapshot()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO snapshots (endpoint_id, data)
  VALUES (NEW.id, NEW.cached_data);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_endpoint_snapshot
  AFTER INSERT ON endpoints
  FOR EACH ROW EXECUTE FUNCTION create_initial_snapshot();


-- ============================================================
--  6. AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID          REFERENCES users(id) ON DELETE SET NULL,      -- preserved after user deletion
  endpoint_id   UUID          REFERENCES endpoints(id) ON DELETE SET NULL,  -- preserved after endpoint deletion
  method        TEXT          NOT NULL CHECK (method IN ('GET','POST','PUT','DELETE')),
  status_code   SMALLINT      NOT NULL,
  called_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Append-only: never UPDATE or DELETE rows in this table
CREATE INDEX idx_audit_log_user_id     ON audit_log(user_id);
CREATE INDEX idx_audit_log_endpoint_id ON audit_log(endpoint_id);
CREATE INDEX idx_audit_log_called_at   ON audit_log(called_at DESC);  -- time-range queries


-- ============================================================
--  7. ROW LEVEL SECURITY (Supabase)
-- ============================================================

ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys    ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoints   ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log   ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own rows
CREATE POLICY users_self ON users
  USING (id = auth.uid());

CREATE POLICY api_keys_owner ON api_keys
  USING (user_id = auth.uid());

-- Schemas: own rows + all presets are visible to everyone
CREATE POLICY schemas_read ON schemas
  FOR SELECT USING (owner_id = auth.uid() OR is_preset = TRUE);

CREATE POLICY schemas_write ON schemas
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY endpoints_owner ON endpoints
  USING (owner_id = auth.uid());

CREATE POLICY snapshots_owner ON snapshots
  USING (
    endpoint_id IN (SELECT id FROM endpoints WHERE owner_id = auth.uid())
  );

CREATE POLICY audit_log_owner ON audit_log
  FOR SELECT USING (user_id = auth.uid());


-- ============================================================
--  8. TTL RESTORE FUNCTION  (called by pg_cron)
-- ============================================================

CREATE OR REPLACE FUNCTION restore_expired_endpoints()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE endpoints e
  SET
    cached_data    = s.data,
    ttl_expires_at = NOW() + (e.ttl_seconds || ' seconds')::INTERVAL,
    updated_at     = NOW()
  FROM snapshots s
  WHERE
    s.endpoint_id = e.id
    AND e.ttl_expires_at < NOW();
END;
$$;


-- ============================================================
--  9. pg_cron JOB  (runs every minute, checks expiry)
-- ============================================================

SELECT cron.schedule(
  'ttl-restore',          -- job name
  '* * * * *',            -- every minute
  $$SELECT restore_expired_endpoints();$$
);


-- ============================================================
--  DONE
-- ============================================================
