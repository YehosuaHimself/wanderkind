-- ── US-07: Rides table for Hitchhike Mode ────────────────────────────
-- Stores each hitchhike ride: who, when, driver note, rating.
-- RLS: users can only read/write their own rides.

CREATE TABLE IF NOT EXISTS rides (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  driver_note   TEXT        DEFAULT '',
  rating        TEXT        CHECK (rating IN ('good', 'bad')),
  distance_km   NUMERIC,
  -- location at ride start (fuzzy OK here — user chose to share)
  start_lat     DOUBLE PRECISION,
  start_lng     DOUBLE PRECISION,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rides"
  ON rides FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast history queries
CREATE INDEX IF NOT EXISTS idx_rides_user_started
  ON rides (user_id, started_at DESC);
