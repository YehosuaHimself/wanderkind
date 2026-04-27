-- ============================================================
-- WK-131 — host_availability
-- Per-host calendar of blocked nights. A row means "do not accept new
-- bookings on this date." A booking takes the dates regardless.
-- ============================================================
CREATE TABLE IF NOT EXISTS host_availability (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id     UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  blocked_on  DATE NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (host_id, blocked_on)
);

CREATE INDEX IF NOT EXISTS host_availability_host_idx ON host_availability(host_id);
CREATE INDEX IF NOT EXISTS host_availability_date_idx ON host_availability(blocked_on);

ALTER TABLE host_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS host_availability_read ON host_availability;
CREATE POLICY host_availability_read ON host_availability
  FOR SELECT USING (true);

DROP POLICY IF EXISTS host_availability_write_own ON host_availability;
CREATE POLICY host_availability_write_own ON host_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM hosts WHERE hosts.id = host_availability.host_id AND hosts.profile_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM hosts WHERE hosts.id = host_availability.host_id AND hosts.profile_id = auth.uid())
  );
