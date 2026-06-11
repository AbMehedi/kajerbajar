-- supabase/migrations_010_learning_modules.sql
-- Learning Module System — Full Migration
-- Run this in the Supabase SQL Editor ONCE.
--
-- MANUAL STEPS REQUIRED (cannot be done via SQL):
--   1. In Supabase Dashboard > Storage:
--      a. Delete the bucket named "skill-submissions" (if it exists)
--      b. Create a new bucket named "module-submissions" (set to private)
--      c. Add the following Storage RLS policy on the new bucket:
--
--         Policy Name: "Students upload to own folder"
--         Operation: INSERT
--         Target roles: authenticated
--         WITH CHECK: (storage.foldername(name))[1] = auth.uid()::text
--
--         Policy Name: "Students read own files"
--         Operation: SELECT
--         Target roles: authenticated
--         USING: (storage.foldername(name))[1] = auth.uid()::text
--
--         Policy Name: "Admins read all module files"
--         Operation: SELECT
--         Target roles: authenticated
--         USING: EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin')

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Drop old badges table (irreversible — backup data first if needed)
-- ──────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS badges CASCADE;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. learning_modules
--    Admin-configured module definitions per skill/level combo.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS learning_modules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_category   TEXT NOT NULL CHECK (skill_category IN ('tech', 'design', 'content', 'marketing', 'data')),
  skill_name       TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('rookie', 'skilled', 'expert')),
  deadline_hours   INTEGER NOT NULL CHECK (deadline_hours IN (24, 48, 72)),
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Seed the 5 categories × 3 levels with appropriate deadlines
-- Admin can add more rows later via the Supabase dashboard or a dedicated admin UI.

-- Tech & Development
INSERT INTO learning_modules (skill_category, skill_name, difficulty_level, deadline_hours) VALUES
  ('tech', 'React',          'rookie',  24),
  ('tech', 'React',          'skilled', 48),
  ('tech', 'React',          'expert',  72),
  ('tech', 'Next.js',        'rookie',  24),
  ('tech', 'Next.js',        'skilled', 48),
  ('tech', 'Next.js',        'expert',  72),
  ('tech', 'Vue.js',         'rookie',  24),
  ('tech', 'Vue.js',         'skilled', 48),
  ('tech', 'Vue.js',         'expert',  72),
  ('tech', 'Node.js',        'rookie',  24),
  ('tech', 'Node.js',        'skilled', 48),
  ('tech', 'Node.js',        'expert',  72),
  ('tech', 'Python',         'rookie',  24),
  ('tech', 'Python',         'skilled', 48),
  ('tech', 'Python',         'expert',  72),
  ('tech', 'Django',         'rookie',  24),
  ('tech', 'Django',         'skilled', 48),
  ('tech', 'Django',         'expert',  72),
  ('tech', 'FastAPI',        'rookie',  24),
  ('tech', 'FastAPI',        'skilled', 48),
  ('tech', 'FastAPI',        'expert',  72),
  ('tech', 'PHP',            'rookie',  24),
  ('tech', 'PHP',            'skilled', 48),
  ('tech', 'PHP',            'expert',  72),
  ('tech', 'Java',           'rookie',  24),
  ('tech', 'Java',           'skilled', 48),
  ('tech', 'Java',           'expert',  72),
  ('tech', 'Flutter',        'rookie',  24),
  ('tech', 'Flutter',        'skilled', 48),
  ('tech', 'Flutter',        'expert',  72),
  ('tech', 'React Native',   'rookie',  24),
  ('tech', 'React Native',   'skilled', 48),
  ('tech', 'React Native',   'expert',  72),
  ('tech', 'PostgreSQL',     'rookie',  24),
  ('tech', 'PostgreSQL',     'skilled', 48),
  ('tech', 'PostgreSQL',     'expert',  72),
  ('tech', 'TypeScript',     'rookie',  24),
  ('tech', 'TypeScript',     'skilled', 48),
  ('tech', 'TypeScript',     'expert',  72),
  ('tech', 'DevOps',         'rookie',  24),
  ('tech', 'DevOps',         'skilled', 48),
  ('tech', 'DevOps',         'expert',  72)
ON CONFLICT DO NOTHING;

-- Design & Creative
INSERT INTO learning_modules (skill_category, skill_name, difficulty_level, deadline_hours) VALUES
  ('design', 'Figma',            'rookie',  24),
  ('design', 'Figma',            'skilled', 48),
  ('design', 'Figma',            'expert',  72),
  ('design', 'UI/UX Design',     'rookie',  24),
  ('design', 'UI/UX Design',     'skilled', 48),
  ('design', 'UI/UX Design',     'expert',  72),
  ('design', 'Adobe XD',         'rookie',  24),
  ('design', 'Adobe XD',         'skilled', 48),
  ('design', 'Adobe XD',         'expert',  72),
  ('design', 'Photoshop',        'rookie',  24),
  ('design', 'Photoshop',        'skilled', 48),
  ('design', 'Photoshop',        'expert',  72),
  ('design', 'Illustrator',      'rookie',  24),
  ('design', 'Illustrator',      'skilled', 48),
  ('design', 'Illustrator',      'expert',  72),
  ('design', 'Motion Graphics',  'rookie',  24),
  ('design', 'Motion Graphics',  'skilled', 48),
  ('design', 'Motion Graphics',  'expert',  72),
  ('design', 'Brand Identity',   'rookie',  24),
  ('design', 'Brand Identity',   'skilled', 48),
  ('design', 'Brand Identity',   'expert',  72)
ON CONFLICT DO NOTHING;

-- Content & Writing
INSERT INTO learning_modules (skill_category, skill_name, difficulty_level, deadline_hours) VALUES
  ('content', 'Blog Writing',        'rookie',  24),
  ('content', 'Blog Writing',        'skilled', 48),
  ('content', 'Blog Writing',        'expert',  72),
  ('content', 'Copywriting',         'rookie',  24),
  ('content', 'Copywriting',         'skilled', 48),
  ('content', 'Copywriting',         'expert',  72),
  ('content', 'Technical Writing',   'rookie',  24),
  ('content', 'Technical Writing',   'skilled', 48),
  ('content', 'Technical Writing',   'expert',  72),
  ('content', 'Script Writing',      'rookie',  24),
  ('content', 'Script Writing',      'skilled', 48),
  ('content', 'Script Writing',      'expert',  72),
  ('content', 'Social Media Content','rookie',  24),
  ('content', 'Social Media Content','skilled', 48),
  ('content', 'Social Media Content','expert',  72),
  ('content', 'SEO Writing',         'rookie',  24),
  ('content', 'SEO Writing',         'skilled', 48),
  ('content', 'SEO Writing',         'expert',  72)
ON CONFLICT DO NOTHING;

-- Digital Marketing
INSERT INTO learning_modules (skill_category, skill_name, difficulty_level, deadline_hours) VALUES
  ('marketing', 'SEO',               'rookie',  24),
  ('marketing', 'SEO',               'skilled', 48),
  ('marketing', 'SEO',               'expert',  72),
  ('marketing', 'Social Media Marketing', 'rookie',  24),
  ('marketing', 'Social Media Marketing', 'skilled', 48),
  ('marketing', 'Social Media Marketing', 'expert',  72),
  ('marketing', 'Google Ads',        'rookie',  24),
  ('marketing', 'Google Ads',        'skilled', 48),
  ('marketing', 'Google Ads',        'expert',  72),
  ('marketing', 'Facebook Ads',      'rookie',  24),
  ('marketing', 'Facebook Ads',      'skilled', 48),
  ('marketing', 'Facebook Ads',      'expert',  72),
  ('marketing', 'Email Marketing',   'rookie',  24),
  ('marketing', 'Email Marketing',   'skilled', 48),
  ('marketing', 'Email Marketing',   'expert',  72),
  ('marketing', 'Content Strategy',  'rookie',  24),
  ('marketing', 'Content Strategy',  'skilled', 48),
  ('marketing', 'Content Strategy',  'expert',  72)
ON CONFLICT DO NOTHING;

-- Data & Research
INSERT INTO learning_modules (skill_category, skill_name, difficulty_level, deadline_hours) VALUES
  ('data', 'Data Analysis',    'rookie',  24),
  ('data', 'Data Analysis',    'skilled', 48),
  ('data', 'Data Analysis',    'expert',  72),
  ('data', 'Machine Learning', 'rookie',  24),
  ('data', 'Machine Learning', 'skilled', 48),
  ('data', 'Machine Learning', 'expert',  72),
  ('data', 'Excel/Sheets',     'rookie',  24),
  ('data', 'Excel/Sheets',     'skilled', 48),
  ('data', 'Excel/Sheets',     'expert',  72),
  ('data', 'Python (Data)',    'rookie',  24),
  ('data', 'Python (Data)',    'skilled', 48),
  ('data', 'Python (Data)',    'expert',  72),
  ('data', 'Power BI',         'rookie',  24),
  ('data', 'Power BI',         'skilled', 48),
  ('data', 'Power BI',         'expert',  72),
  ('data', 'Market Research',  'rookie',  24),
  ('data', 'Market Research',  'skilled', 48),
  ('data', 'Market Research',  'expert',  72)
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. module_submissions
--    Tracks each student's attempt at a learning module.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS module_submissions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id             UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
  module_id              UUID NOT NULL REFERENCES learning_modules(id),
  ai_brief               TEXT NOT NULL,             -- raw JSON string from AI
  submission_file_url    TEXT,
  submission_description TEXT,
  status                 TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'pass', 'fail', 'revision')),
  attempt_number         INTEGER DEFAULT 1,
  cooldown_until         TIMESTAMPTZ,
  deadline_at            TIMESTAMPTZ NOT NULL,
  submitted_at           TIMESTAMPTZ,
  reviewed_at            TIMESTAMPTZ,
  reviewed_by            UUID REFERENCES users_profiles(id),
  admin_feedback         TEXT,
  created_at             TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. verified_skills
--    Immutable record of skills a student has passed.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS verified_skills (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
  skill_name           TEXT NOT NULL,
  skill_category       TEXT NOT NULL,
  level                TEXT NOT NULL CHECK (level IN ('rookie', 'skilled', 'expert')),
  earned_at            TIMESTAMPTZ DEFAULT now(),
  module_submission_id UUID REFERENCES module_submissions(id),
  UNIQUE (student_id, skill_name, level)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. student_badges
--    Marketplace reputation badges (separate from learning modules).
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_badges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
  badge_type    TEXT NOT NULL CHECK (badge_type IN ('rising_talent', 'top_rated', 'top_rated_plus')),
  is_active     BOOLEAN DEFAULT true,
  awarded_at    TIMESTAMPTZ DEFAULT now(),
  revoked_at    TIMESTAMPTZ,
  revoke_reason TEXT,
  UNIQUE (student_id, badge_type)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. badge_criteria_log
--    Audit trail for all badge award/revoke decisions.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS badge_criteria_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
  badge_type        TEXT NOT NULL,
  action            TEXT NOT NULL CHECK (action IN ('awarded', 'revoked', 'restored', 'checked')),
  criteria_snapshot JSONB,
  checked_at        TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. RLS — learning_modules (public read, admin write)
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active modules" ON learning_modules;
DROP POLICY IF EXISTS "Admins manage modules"          ON learning_modules;

CREATE POLICY "Public can view active modules"
  ON learning_modules FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage modules"
  ON learning_modules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. RLS — module_submissions
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE module_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students read own submissions"   ON module_submissions;
DROP POLICY IF EXISTS "Students insert own submissions" ON module_submissions;
DROP POLICY IF EXISTS "Students update own submissions" ON module_submissions;
DROP POLICY IF EXISTS "Admins read all submissions"     ON module_submissions;
DROP POLICY IF EXISTS "Admins update submissions"       ON module_submissions;

CREATE POLICY "Students read own submissions"
  ON module_submissions FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students insert own submissions"
  ON module_submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students update own submissions"
  ON module_submissions FOR UPDATE TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins read all submissions"
  ON module_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins update submissions"
  ON module_submissions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. RLS — verified_skills (public read, student/admin write)
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE verified_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read verified skills"  ON verified_skills;
DROP POLICY IF EXISTS "Admins insert verified skills"    ON verified_skills;
DROP POLICY IF EXISTS "Students read own verified skills" ON verified_skills;

CREATE POLICY "Public can read verified skills"
  ON verified_skills FOR SELECT
  USING (true);

CREATE POLICY "Admins insert verified skills"
  ON verified_skills FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. RLS — student_badges (public read, admin write)
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read student badges" ON student_badges;
DROP POLICY IF EXISTS "Admins manage student badges"   ON student_badges;

CREATE POLICY "Public can read student badges"
  ON student_badges FOR SELECT
  USING (true);

CREATE POLICY "Admins manage student badges"
  ON student_badges FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ──────────────────────────────────────────────────────────────────────────────
-- 11. RLS — badge_criteria_log (admin only)
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE badge_criteria_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage badge log" ON badge_criteria_log;

CREATE POLICY "Admins manage badge log"
  ON badge_criteria_log FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ──────────────────────────────────────────────────────────────────────────────
-- 12. Storage Bucket Policies (module-submissions)
-- ──────────────────────────────────────────────────────────────────────────────

-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('module-submissions', 'module-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any to avoid conflicts when re-running
DROP POLICY IF EXISTS "Students can upload module submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students can view own module submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all module submissions" ON storage.objects;

-- Policy 1: Students can upload their own submissions
CREATE POLICY "Students can upload module submissions"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'module-submissions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Students can view their own submissions
CREATE POLICY "Students can view own module submissions"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'module-submissions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Admins can view all submissions
CREATE POLICY "Admins can view all module submissions"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'module-submissions'
  AND EXISTS (SELECT 1 FROM public.users_profiles WHERE id = auth.uid() AND role = 'admin')
);
