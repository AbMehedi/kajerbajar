-- Phase 6.x: Notification preferences
-- Stores per-user email preferences for notifications.

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users_profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_important_only BOOLEAN NOT NULL DEFAULT TRUE,
  muted_types TEXT[] NOT NULL DEFAULT '{}'::text[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx
  ON notification_preferences (user_id);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notification prefs: read own" ON notification_preferences;
CREATE POLICY "Notification prefs: read own"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Notification prefs: upsert own" ON notification_preferences;
CREATE POLICY "Notification prefs: upsert own"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Notification prefs: update own" ON notification_preferences;
CREATE POLICY "Notification prefs: update own"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

