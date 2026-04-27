-- ============================================================
-- WK Base Schema
-- Creates the core tables the app and import pipeline expect.
-- Idempotent (CREATE TABLE IF NOT EXISTS).
-- ============================================================

-- Routes (walking ways)
CREATE TABLE IF NOT EXISTS routes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  country         TEXT NOT NULL DEFAULT '',
  countries       TEXT[] NOT NULL DEFAULT '{}',
  distance_km     NUMERIC NOT NULL DEFAULT 0,
  duration_days   INT NOT NULL DEFAULT 0,
  difficulty      TEXT NOT NULL DEFAULT 'moderate'
                  CHECK (difficulty IN ('easy','moderate','challenging','expert')),
  hero_image      TEXT,
  gpx_url         TEXT,
  host_count      INT NOT NULL DEFAULT 0,
  free_host_count INT NOT NULL DEFAULT 0,
  walker_count    INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS routes_country_idx ON routes(country);

-- Hosts (accommodations) — core import target
CREATE TABLE IF NOT EXISTS hosts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID,                     -- FK to profiles for human-listed hosts
  name            TEXT NOT NULL,
  description     TEXT,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  host_type       TEXT NOT NULL CHECK (host_type IN (
                    'free','donativo','budget','paid',
                    'albergue_municipal','albergue_privado','albergue_parroquial','albergue_asociacion',
                    'monastery','church','gite_etape','refuge',
                    'camping','pension','hotel_budget','private_host',
                    'tourist_info','community'
                  )),
  price_range     TEXT,
  capacity        INT NOT NULL DEFAULT 0,
  amenities       TEXT[] NOT NULL DEFAULT '{}',
  house_rules     TEXT[] NOT NULL DEFAULT '{}',
  gallery         TEXT[] NOT NULL DEFAULT '{}',
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  availability_start TIMESTAMPTZ,
  availability_end   TIMESTAMPTZ,
  availability_notes TEXT,
  verification_level TEXT NOT NULL DEFAULT 'unverified',
  source          TEXT,
  freshness       TEXT,
  response_time_hours INT,
  total_hosted    INT NOT NULL DEFAULT 0,
  rating          NUMERIC,
  route_id        UUID REFERENCES routes(id) ON DELETE SET NULL,
  route_km        NUMERIC,
  is_bicycle_friendly      BOOLEAN NOT NULL DEFAULT FALSE,
  is_family_friendly       BOOLEAN NOT NULL DEFAULT FALSE,
  is_women_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  is_wheelchair_accessible BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hosts_route_id_idx ON hosts(route_id);
CREATE INDEX IF NOT EXISTS hosts_host_type_idx ON hosts(host_type);
CREATE INDEX IF NOT EXISTS hosts_is_available_idx ON hosts(is_available);

-- Threads (DM conversations) + Messages
CREATE TABLE IF NOT EXISTS threads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_ids   UUID[] NOT NULL DEFAULT '{}',
  last_message      TEXT,
  last_message_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unread_count      INT NOT NULL DEFAULT 0,
  other_trail_name  TEXT,
  other_avatar_url  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_a, user_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id     UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  message_type  TEXT NOT NULL DEFAULT 'text',
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_thread_id_idx ON messages(thread_id);

-- Moments (feed posts)
CREATE TABLE IF NOT EXISTS moments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  photo_url     TEXT,
  location_name TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS moments_author_id_idx ON moments(author_id);
CREATE INDEX IF NOT EXISTS moments_created_at_idx ON moments(created_at DESC);

-- Stories (24h ephemeral)
CREATE TABLE IF NOT EXISTS stories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url     TEXT NOT NULL,
  caption       TEXT,
  location_name TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS stories_author_id_idx ON stories(author_id);

-- Comments on moments
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id   UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comments_moment_id_idx ON comments(moment_id);

-- Gästebuch (host guest book)
CREATE TABLE IF NOT EXISTS gaestebuch (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id     UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  walker_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  walker_name TEXT NOT NULL,
  message     TEXT NOT NULL,
  rating      INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS gaestebuch_host_id_idx ON gaestebuch(host_id);

-- Presence (real-time location pings for the wanderkinder map)
CREATE TABLE IF NOT EXISTS presence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id)
);

-- Stamps (visa-style host stays)
CREATE TABLE IF NOT EXISTS stamps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walker_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_id     UUID REFERENCES hosts(id) ON DELETE SET NULL,
  host_name   TEXT,
  route_id    UUID REFERENCES routes(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id     UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  walker_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending',
  start_date  DATE,
  end_date    DATE,
  message     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorite_hosts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_id     UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, host_id)
);

-- ─── RLS — pragmatic defaults: public read on shared content,
--           authenticated write where ownership applies. ─────────────────────
ALTER TABLE routes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaestebuch ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_hosts ENABLE ROW LEVEL SECURITY;

-- Routes & hosts: world-readable
DROP POLICY IF EXISTS routes_read ON routes;
CREATE POLICY routes_read ON routes FOR SELECT USING (true);
DROP POLICY IF EXISTS hosts_read ON hosts;
CREATE POLICY hosts_read ON hosts FOR SELECT USING (true);

-- Moments / stories: world-readable
DROP POLICY IF EXISTS moments_read ON moments;
CREATE POLICY moments_read ON moments FOR SELECT USING (true);
DROP POLICY IF EXISTS moments_insert_own ON moments;
CREATE POLICY moments_insert_own ON moments FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS moments_update_own ON moments;
CREATE POLICY moments_update_own ON moments FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS moments_delete_own ON moments;
CREATE POLICY moments_delete_own ON moments FOR DELETE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS stories_read ON stories;
CREATE POLICY stories_read ON stories FOR SELECT USING (true);
DROP POLICY IF EXISTS stories_insert_own ON stories;
CREATE POLICY stories_insert_own ON stories FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Comments: read all, insert own
DROP POLICY IF EXISTS comments_read ON comments;
CREATE POLICY comments_read ON comments FOR SELECT USING (true);
DROP POLICY IF EXISTS comments_insert_own ON comments;
CREATE POLICY comments_insert_own ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gästebuch
DROP POLICY IF EXISTS gaestebuch_read ON gaestebuch;
CREATE POLICY gaestebuch_read ON gaestebuch FOR SELECT USING (true);
DROP POLICY IF EXISTS gaestebuch_insert_own ON gaestebuch;
CREATE POLICY gaestebuch_insert_own ON gaestebuch FOR INSERT WITH CHECK (auth.uid() = walker_id);

-- Presence
DROP POLICY IF EXISTS presence_read ON presence;
CREATE POLICY presence_read ON presence FOR SELECT USING (true);
DROP POLICY IF EXISTS presence_upsert_own ON presence;
CREATE POLICY presence_upsert_own ON presence FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS presence_update_own ON presence;
CREATE POLICY presence_update_own ON presence FOR UPDATE USING (auth.uid() = profile_id);

-- Stamps + bookings + favorites: own rows only
DROP POLICY IF EXISTS stamps_own ON stamps;
CREATE POLICY stamps_own ON stamps FOR SELECT USING (auth.uid() = walker_id);
DROP POLICY IF EXISTS stamps_insert_own ON stamps;
CREATE POLICY stamps_insert_own ON stamps FOR INSERT WITH CHECK (auth.uid() = walker_id);

DROP POLICY IF EXISTS bookings_own ON bookings;
CREATE POLICY bookings_own ON bookings FOR SELECT USING (auth.uid() = walker_id);
DROP POLICY IF EXISTS bookings_insert_own ON bookings;
CREATE POLICY bookings_insert_own ON bookings FOR INSERT WITH CHECK (auth.uid() = walker_id);

DROP POLICY IF EXISTS favorite_hosts_own ON favorite_hosts;
CREATE POLICY favorite_hosts_own ON favorite_hosts FOR ALL USING (auth.uid() = user_id);

-- Threads + messages: only participants
DROP POLICY IF EXISTS threads_own ON threads;
CREATE POLICY threads_own ON threads FOR SELECT USING (auth.uid() IN (user_a, user_b));
DROP POLICY IF EXISTS threads_insert ON threads;
CREATE POLICY threads_insert ON threads FOR INSERT WITH CHECK (auth.uid() IN (user_a, user_b));

DROP POLICY IF EXISTS messages_in_my_threads ON messages;
CREATE POLICY messages_in_my_threads ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_a FROM threads WHERE id = messages.thread_id
      UNION SELECT user_b FROM threads WHERE id = messages.thread_id
    )
  );
DROP POLICY IF EXISTS messages_send_own ON messages;
CREATE POLICY messages_send_own ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- updated_at trigger for hosts
CREATE OR REPLACE FUNCTION wk_set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hosts_updated_at ON hosts;
CREATE TRIGGER hosts_updated_at BEFORE UPDATE ON hosts
  FOR EACH ROW EXECUTE FUNCTION wk_set_updated_at();
