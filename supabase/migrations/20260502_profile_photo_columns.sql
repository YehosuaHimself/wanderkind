-- ── Profile photo + gallery columns ──────────────────────────────────
-- These columns are referenced in code but were never explicitly migrated.
-- Safe to run multiple times (IF NOT EXISTS / DO NOTHING pattern).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url     TEXT,
  ADD COLUMN IF NOT EXISTS cover_url      TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls   TEXT[] NOT NULL DEFAULT '{}';

-- index for fast avatar lookups on map/profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_avatar
  ON profiles (id)
  WHERE avatar_url IS NOT NULL;
