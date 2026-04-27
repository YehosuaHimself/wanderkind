-- ============================================================
-- WK-112 / WK-113 — Gästebuch replies
-- A reply belongs to a parent gaestebuch entry. Replies are visible to
-- everyone (the host who received the original AND the wider walker
-- community), but only the original entry's author or the host can post.
-- ============================================================

CREATE TABLE IF NOT EXISTS gaestebuch_replies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID NOT NULL REFERENCES gaestebuch(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gaestebuch_replies_entry_id_idx ON gaestebuch_replies(entry_id);
CREATE INDEX IF NOT EXISTS gaestebuch_replies_author_id_idx ON gaestebuch_replies(author_id);

ALTER TABLE gaestebuch_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gaestebuch_replies_read ON gaestebuch_replies;
CREATE POLICY gaestebuch_replies_read ON gaestebuch_replies
  FOR SELECT USING (true);

-- Anyone authenticated can post a reply (the UI gates by participation).
DROP POLICY IF EXISTS gaestebuch_replies_insert ON gaestebuch_replies;
CREATE POLICY gaestebuch_replies_insert ON gaestebuch_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS gaestebuch_replies_delete_own ON gaestebuch_replies;
CREATE POLICY gaestebuch_replies_delete_own ON gaestebuch_replies
  FOR DELETE USING (auth.uid() = author_id);
