-- migrations_004_applications_rls.sql
-- Story 3.2: Row Level Security for the `applications` table
-- Apply in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- Policies:
--   students_insert_own_applications      — INSERT — student_id = auth.uid()
--   students_read_own_applications        — SELECT — student_id = auth.uid()
--   companies_read_project_applications   — SELECT — project belongs to caller's company
--
-- Duplicate application guard is enforced via a unique constraint:
--   UNIQUE (project_id, student_id)
--
-- Badge-gating is NOT enforced here (deferred to Phase 4 per YAGNI).

-- ── Enable RLS ────────────────────────────────────────────────────────────────
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ── Unique constraint: prevent a student applying to the same project twice ───
ALTER TABLE applications
  ADD CONSTRAINT applications_project_student_unique
  UNIQUE (project_id, student_id);

-- ── Policy 1: Students can insert their own applications ──────────────────────
CREATE POLICY "students_insert_own_applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- ── Policy 2: Students can read their own applications ────────────────────────
CREATE POLICY "students_read_own_applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- ── Policy 3: Companies can read applications for their own projects ──────────
-- Uses a sub-select to verify the project belongs to the calling company.
CREATE POLICY "companies_read_project_applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = auth.uid()
    )
  );
