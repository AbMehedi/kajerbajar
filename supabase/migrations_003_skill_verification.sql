-- supabase/migrations_003_skill_verification.sql
-- Phase 2: Skill Verification tables and RLS policies
-- Run this in the Supabase SQL Editor ONCE before starting Phase 2 development.

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Add missing columns to skill_verifications (columns not in original schema)
-- ──────────────────────────────────────────────────────────────────────────────
-- NOTE: skill_category, ai_brief, submission_text, admin_feedback already exist.
-- We only add the new columns needed for Phase 2.

ALTER TABLE skill_verifications
  ADD COLUMN IF NOT EXISTS submitted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by   UUID REFERENCES users_profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at   TIMESTAMPTZ;

-- Update status CHECK constraint to include 'submitted' status
ALTER TABLE skill_verifications DROP CONSTRAINT IF EXISTS skill_verifications_status_check;
ALTER TABLE skill_verifications
  ADD CONSTRAINT skill_verifications_status_check
  CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'revision_requested'));

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Create badges table
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS badges (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  skill_name       TEXT NOT NULL,
  verification_id  UUID REFERENCES skill_verifications(id),
  granted_at       TIMESTAMPTZ DEFAULT NOW(),
  granted_by       UUID REFERENCES users_profiles(id),
  UNIQUE(student_id, skill_name)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. RLS for skill_verifications
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE skill_verifications ENABLE ROW LEVEL SECURITY;

-- Drop first so this script is safe to re-run
DROP POLICY IF EXISTS "Students see own verifications"    ON skill_verifications;
DROP POLICY IF EXISTS "Students insert own verifications" ON skill_verifications;
DROP POLICY IF EXISTS "Students update own verifications" ON skill_verifications;
DROP POLICY IF EXISTS "Admins manage all verifications"   ON skill_verifications;

CREATE POLICY "Students see own verifications"
  ON skill_verifications FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students insert own verifications"
  ON skill_verifications FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students update own verifications"
  ON skill_verifications FOR UPDATE TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins manage all verifications"
  ON skill_verifications FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. RLS for badges
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view badges" ON badges;
DROP POLICY IF EXISTS "Admins grant badges"    ON badges;

CREATE POLICY "Public can view badges"
  ON badges FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins grant badges"
  ON badges FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
