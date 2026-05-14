-- migrations_006_deliverable_metadata.sql
-- Adds file metadata columns to project_deliverables

ALTER TABLE project_deliverables 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS file_mime_type TEXT;
