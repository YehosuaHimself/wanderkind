-- ============================================================
-- WK-130 follow-up: index hosts.profile_id
-- The hosting dashboard's first query (hosts WHERE profile_id=me)
-- was timing out PostgREST with a 500 due to a sequential scan on
-- 262k rows. Partial index where profile_id IS NOT NULL keeps the
-- index small (only Wanderhost-claimed listings have it set).
-- ============================================================
CREATE INDEX IF NOT EXISTS hosts_profile_id_idx
  ON hosts(profile_id)
  WHERE profile_id IS NOT NULL;
