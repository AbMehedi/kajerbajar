-- supabase/migrations_004_storage.sql
-- Phase 2: Storage RLS policies for skill submission file uploads
-- Run this in the Supabase SQL Editor AFTER creating the 'skill-submissions' bucket.

-- Students can upload files into their own folder (path must start with their user id)
CREATE POLICY "Students upload own submissions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'skill-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can read (and thus download) their own uploaded files
CREATE POLICY "Students read own submissions"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'skill-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can delete their own files (e.g. when resubmitting)
CREATE POLICY "Students delete own submissions"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'skill-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read ALL files in the bucket for review purposes
CREATE POLICY "Admins read all submissions"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'skill-submissions'
    AND EXISTS (
      SELECT 1 FROM users_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
