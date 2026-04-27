-- ============================================================
-- WK-111 — Likes on moments
-- ============================================================

CREATE TABLE IF NOT EXISTS moment_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id   UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (moment_id, user_id)
);

CREATE INDEX IF NOT EXISTS moment_likes_moment_id_idx ON moment_likes(moment_id);
CREATE INDEX IF NOT EXISTS moment_likes_user_id_idx   ON moment_likes(user_id);

ALTER TABLE moment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moment_likes_read ON moment_likes;
CREATE POLICY moment_likes_read ON moment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS moment_likes_insert_own ON moment_likes;
CREATE POLICY moment_likes_insert_own ON moment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS moment_likes_delete_own ON moment_likes;
CREATE POLICY moment_likes_delete_own ON moment_likes
  FOR DELETE USING (auth.uid() = user_id);
