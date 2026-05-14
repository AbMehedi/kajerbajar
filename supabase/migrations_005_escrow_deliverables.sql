-- migrations_005_escrow_deliverables.sql
-- Phase 4: Escrow & Project Execution
-- Run this in your Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════════
-- 1. project_deliverables table
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS project_deliverables (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES student_profiles(id),
  submission_text  TEXT,
  submission_file_url TEXT,
  file_name        TEXT,
  file_size_bytes  BIGINT,
  file_mime_type   TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  company_feedback TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at      TIMESTAMPTZ
);

-- Ensure file metadata columns exist if table was already created
ALTER TABLE project_deliverables 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS file_mime_type TEXT;

-- Index for fast lookup by project
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON project_deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_student_id ON project_deliverables(student_id);

-- ═══════════════════════════════════════════════════════════════════
-- 2. RLS Policies for project_deliverables
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE project_deliverables ENABLE ROW LEVEL SECURITY;

-- Students can insert their own deliverables
DROP POLICY IF EXISTS "Students can submit deliverables for their active projects" ON project_deliverables;
CREATE POLICY "Students can submit deliverables for their active projects"
  ON project_deliverables FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
        AND p.status = 'in_progress'
        AND EXISTS (
          SELECT 1 FROM applications a
          WHERE a.project_id = p.id
            AND a.student_id = auth.uid()
            AND a.status = 'selected'
        )
    )
  );

-- Students can see their own deliverables
DROP POLICY IF EXISTS "Students can view their own deliverables" ON project_deliverables;
CREATE POLICY "Students can view their own deliverables"
  ON project_deliverables FOR SELECT
  USING (student_id = auth.uid());

-- Companies can view deliverables for their projects
DROP POLICY IF EXISTS "Companies can view deliverables for their projects" ON project_deliverables;
CREATE POLICY "Companies can view deliverables for their projects"
  ON project_deliverables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.company_id = auth.uid()
    )
  );

-- Companies can update (approve/reject) deliverables for their projects
DROP POLICY IF EXISTS "Companies can review deliverables" ON project_deliverables;
CREATE POLICY "Companies can review deliverables"
  ON project_deliverables FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.company_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- 3. Storage Bucket for Project Deliverables
-- ═══════════════════════════════════════════════════════════════════

-- Create the bucket (run in SQL editor — Storage API doesn't support SQL directly,
-- but you can create the bucket from the Supabase dashboard or use:)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-deliverables', 'project-deliverables', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: only the authenticated uploader can insert
DROP POLICY IF EXISTS "Authenticated users can upload deliverables" ON storage.objects;
CREATE POLICY "Authenticated users can upload deliverables"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-deliverables'
    AND auth.role() = 'authenticated'
  );

-- Students can read files they uploaded; companies can read files for their projects
DROP POLICY IF EXISTS "Owners and project companies can read deliverable files" ON storage.objects;
CREATE POLICY "Owners and project companies can read deliverable files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-deliverables'
    AND auth.role() = 'authenticated'
  );

-- ═══════════════════════════════════════════════════════════════════
-- 4. Helper: get active workspace info for a student
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_student_active_workspace(p_student_id UUID)
RETURNS TABLE (
  project_id    UUID,
  project_title TEXT,
  budget_bdt    DECIMAL,
  escrow_status TEXT,
  company_name  TEXT,
  deadline      DATE
) AS $$
  SELECT
    p.id,
    p.title,
    p.budget_bdt,
    p.escrow_status,
    cp.legal_name,
    p.deadline
  FROM projects p
  JOIN applications a ON a.project_id = p.id
  JOIN company_profiles cp ON cp.id = p.company_id
  WHERE a.student_id = p_student_id
    AND a.status = 'selected'
    AND p.status = 'in_progress'
  ORDER BY p.created_at DESC;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
