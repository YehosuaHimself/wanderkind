-- ============================================================
-- WK Host Trust & Quality
-- Adds:
--   * hosts.quality_score (0–100) — auto-computed at import time
--   * host_confirmations table — community "still open?" verifications
-- ============================================================

-- Quality score (0-100) — auto-computed during import. UI buckets:
--   80+ = Verified Gold
--   60+ = Trusted Silver
--   40+ = Listed Bronze
--   <40 = Unverified
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS quality_score INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS hosts_quality_score_idx ON hosts (quality_score DESC);

COMMENT ON COLUMN hosts.quality_score IS
  'Auto-computed 0-100 trust/completeness score: contact info (+20), website (+20), description (+15), capacity (+15), opening_months (+15), photo (+10), human-confirmed (+5).';

-- Community "still open?" confirmations — pilgrims tap a button on the host
-- detail screen to verify the listing is still active.
CREATE TABLE IF NOT EXISTS host_confirmations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id     UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (host_id, user_id)
);

CREATE INDEX IF NOT EXISTS host_confirmations_host_id_idx ON host_confirmations (host_id);
CREATE INDEX IF NOT EXISTS host_confirmations_user_id_idx ON host_confirmations (user_id);

-- RLS: anyone can read confirmation counts; only authenticated users can insert their own.
ALTER TABLE host_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS host_confirmations_read ON host_confirmations;
CREATE POLICY host_confirmations_read ON host_confirmations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS host_confirmations_insert_own ON host_confirmations;
CREATE POLICY host_confirmations_insert_own ON host_confirmations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS host_confirmations_delete_own ON host_confirmations;
CREATE POLICY host_confirmations_delete_own ON host_confirmations
  FOR DELETE USING (auth.uid() = user_id);
