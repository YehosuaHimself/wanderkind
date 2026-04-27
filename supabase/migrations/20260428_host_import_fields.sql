-- ============================================================
-- WK Host Import Pipeline — schema extension
-- Adds fields needed for automated multi-source host imports
-- ============================================================

-- Extended host_type to cover all accommodation categories
ALTER TABLE hosts
  DROP CONSTRAINT IF EXISTS hosts_host_type_check;

ALTER TABLE hosts
  ADD CONSTRAINT hosts_host_type_check CHECK (host_type IN (
    -- existing
    'free', 'donativo', 'budget', 'paid',
    -- new import categories
    'albergue_municipal',    -- city/municipality run pilgrim hostel
    'albergue_privado',      -- private pilgrim hostel
    'albergue_parroquial',   -- parish-run pilgrim hostel
    'albergue_asociacion',   -- association-run pilgrim hostel
    'monastery',             -- monastery / convent offering space
    'church',                -- church offering floor space / pilgrim rest
    'gite_etape',            -- French gîte d'étape
    'refuge',                -- mountain refuge / hut
    'camping',               -- campsite
    'pension',               -- small pension / B&B
    'hotel_budget',          -- budget hotel
    'private_host',          -- private individual (like CS/WS)
    'tourist_info',          -- tourist office accommodation
    'community'              -- community-submitted spot
  ));

-- Import tracking fields
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS data_source       TEXT,
  ADD COLUMN IF NOT EXISTS source_id         TEXT,        -- external ID from source (for dedup)
  ADD COLUMN IF NOT EXISTS source_url        TEXT,        -- link to original listing
  ADD COLUMN IF NOT EXISTS last_imported_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS country           TEXT,
  ADD COLUMN IF NOT EXISTS region            TEXT,
  ADD COLUMN IF NOT EXISTS opening_months    TEXT[],      -- e.g. ['apr','may','jun','jul','aug','sep','oct']
  ADD COLUMN IF NOT EXISTS languages         TEXT[],      -- spoken languages
  ADD COLUMN IF NOT EXISTS is_pilgrim_only   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS avg_response_minutes INT,
  ADD COLUMN IF NOT EXISTS last_confirmed    TIMESTAMPTZ; -- last time a human verified the listing

-- Composite unique index for import dedup
CREATE UNIQUE INDEX IF NOT EXISTS hosts_source_id_idx
  ON hosts (data_source, source_id)
  WHERE source_id IS NOT NULL;

-- Spatial index for coordinate-based dedup (within ~100m radius)
CREATE INDEX IF NOT EXISTS hosts_lat_lng_idx ON hosts (lat, lng);

-- Index for map queries by country / region
CREATE INDEX IF NOT EXISTS hosts_country_idx ON hosts (country);
CREATE INDEX IF NOT EXISTS hosts_data_source_idx ON hosts (data_source);

COMMENT ON COLUMN hosts.data_source IS 'Import origin: osm, gronze, confraternity_uk, aevf_francigena, user_submission, manual, etc.';
COMMENT ON COLUMN hosts.source_id IS 'Stable external ID from the data source — used for idempotent upserts';
COMMENT ON COLUMN hosts.last_confirmed IS 'Last time a human (pilgrim or admin) verified this listing is still active';
