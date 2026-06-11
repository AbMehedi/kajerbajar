-- migrations_009_project_milestones.sql
-- Phase 6: Project Tracking & Milestones
-- Run this in your Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════════
-- 1. project_milestones table
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS project_milestones (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'completed')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

-- Index for fast lookup by project
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON project_milestones(project_id);

-- ═══════════════════════════════════════════════════════════════════
-- 2. RLS Policies for project_milestones
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- Students can read milestones for projects they are assigned to
DROP POLICY IF EXISTS "Students can view milestones for their active projects" ON project_milestones;
CREATE POLICY "Students can view milestones for their active projects"
  ON project_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.project_id = project_milestones.project_id
        AND a.student_id = auth.uid()
        AND a.status = 'selected'
    )
  );

-- Companies can read milestones for their projects
DROP POLICY IF EXISTS "Companies can view milestones for their projects" ON project_milestones;
CREATE POLICY "Companies can view milestones for their projects"
  ON project_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.company_id = auth.uid()
    )
  );

-- Companies can insert milestones for their projects
DROP POLICY IF EXISTS "Companies can insert milestones for their projects" ON project_milestones;
CREATE POLICY "Companies can insert milestones for their projects"
  ON project_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.company_id = auth.uid()
    )
  );

-- Companies can update milestones for their projects
DROP POLICY IF EXISTS "Companies can update milestones for their projects" ON project_milestones;
CREATE POLICY "Companies can update milestones for their projects"
  ON project_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.company_id = auth.uid()
    )
  );

-- Companies can delete milestones for their projects
DROP POLICY IF EXISTS "Companies can delete milestones for their projects" ON project_milestones;
CREATE POLICY "Companies can delete milestones for their projects"
  ON project_milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.company_id = auth.uid()
    )
  );
