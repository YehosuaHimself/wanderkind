-- US-02/US-03: Biometric verification columns on profiles
-- biometric_verified acts as the trust gate for:
--   • appearing on community map
--   • sending messages
--   • requesting stays
--   • accessing passes
--   • receiving/sharing PINs

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS biometric_verified        BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS biometric_selfie_url      TEXT,
  ADD COLUMN IF NOT EXISTS biometric_verified_at     TIMESTAMPTZ;

-- Index for community map query (frequent filter)
CREATE INDEX IF NOT EXISTS idx_profiles_biometric_map
  ON profiles (biometric_verified, is_walking, show_on_map)
  WHERE biometric_verified = TRUE AND is_walking = FALSE AND show_on_map = TRUE;

-- Backfill: anyone already at verification_level='biometric' is considered verified
UPDATE profiles
  SET biometric_verified = TRUE,
      biometric_verified_at = NOW()
  WHERE verification_level = 'biometric'
    AND biometric_verified = FALSE;

COMMENT ON COLUMN profiles.biometric_verified IS
  'TRUE = selfie uploaded + accepted. Required for: map visibility, messaging, stay requests, passes, PINs.';
COMMENT ON COLUMN profiles.biometric_selfie_url IS
  'Storage path for the accountability selfie (not used for AI matching in v1).';
COMMENT ON COLUMN profiles.biometric_verified_at IS
  'When biometric_verified was set to TRUE.';
