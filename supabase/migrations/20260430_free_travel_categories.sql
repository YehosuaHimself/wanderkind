-- ============================================================
-- Wanderkind = Free Travel
-- The map is now organised around three primary categories only:
--   free       — no money expected
--   donativo   — pay what you can / donation
--   budget     — under €50/night
-- Anything else (paid hotels, tourist info) is hidden from the map.
-- Parish / monastery / hostel / refuge / camping / gîte / pension
-- become *labels* — secondary tags inside the three categories above.
-- ============================================================

ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS labels   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hidden_from_map BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow only the three primary categories (NULL stays valid until backfill).
ALTER TABLE hosts DROP CONSTRAINT IF EXISTS hosts_category_check;
ALTER TABLE hosts
  ADD CONSTRAINT hosts_category_check
  CHECK (category IS NULL OR category IN ('free','donativo','budget'));

CREATE INDEX IF NOT EXISTS hosts_category_idx        ON hosts(category) WHERE NOT hidden_from_map;
CREATE INDEX IF NOT EXISTS hosts_hidden_from_map_idx ON hosts(hidden_from_map);
CREATE INDEX IF NOT EXISTS hosts_labels_gin_idx      ON hosts USING GIN(labels);

COMMENT ON COLUMN hosts.category IS
  'Primary brand axis: free / donativo / budget (<€50). NULL = pre-classification.';
COMMENT ON COLUMN hosts.labels IS
  'Secondary tags: parish, monastery, church, hostel, albergue, refuge, camping, gite, pension, bothy, wanderhost, …';
COMMENT ON COLUMN hosts.hidden_from_map IS
  'True for rows that are not part of the free-travel value prop (paid hotels, tourist info kiosks).';
