-- migrations_003_projects_rls.sql
-- Story 3.1: Row Level Security for the `projects` table
-- Apply in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- Policies:
--   companies_insert_own_projects     — INSERT   — company_id = auth.uid()
--   authenticated_read_open_projects  — SELECT   — status = 'open'  (any authed user)
--   companies_manage_own_projects     — UPDATE / DELETE — company_id = auth.uid()
--
-- Note: verification_status = 'verified' is enforced at the API layer, not here,
--       to keep policies simple and independently testable.

-- ── Enable RLS ────────────────────────────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ── Policy 1: Verified companies can insert their own projects ─────────────────
CREATE POLICY "companies_insert_own_projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = auth.uid());

-- ── Policy 2: Any authenticated user can read open projects ───────────────────
CREATE POLICY "authenticated_read_open_projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (status = 'open');

-- ── Policy 3: Companies can update and delete their own projects ───────────────
CREATE POLICY "companies_manage_own_projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- ── Allow companies to also SELECT their own projects (any status) ─────────────
-- This ensures the dashboard can show closed/in-progress projects too.
CREATE POLICY "companies_read_own_projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (company_id = auth.uid());
