-- supabase/migrations_002_company_verification.sql
-- Story 1.2: Company Trade License Verification
-- Run this AFTER schema.sql has been applied
-- Run in Supabase → SQL Editor

-- ═══════════════════════════════════════════════════════════════════
-- STORY 1.2: Trade License Verification Fields
-- Adds workflow for companies to upload licenses and admins to verify
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Add verification columns to company_profiles
ALTER TABLE company_profiles 
ADD COLUMN IF NOT EXISTS trade_license_url TEXT;

ALTER TABLE company_profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT 
DEFAULT 'not_submitted' 
CHECK (verification_status IN ('not_submitted', 'pending', 'verified', 'rejected'));

ALTER TABLE company_profiles 
ADD COLUMN IF NOT EXISTS verification_feedback TEXT;

ALTER TABLE company_profiles 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE company_profiles 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users_profiles(id);

ALTER TABLE company_profiles 
ADD COLUMN IF NOT EXISTS license_uploaded_at TIMESTAMPTZ;

-- Step 2: Helper function to count pending companies
CREATE OR REPLACE FUNCTION get_pending_companies_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM company_profiles 
  WHERE verification_status = 'pending';
$$ LANGUAGE SQL STABLE;

-- Step 3: RLS Policies for Storage Bucket (trade-licenses)
-- NOTE: Create bucket first in Supabase Dashboard → Storage → Create Bucket
-- (CREATE POLICY IF NOT EXISTS is not valid SQL; use DROP + CREATE instead)

-- Allow authenticated users to upload their own licenses
DROP POLICY IF EXISTS "Users can upload trade licenses" ON storage.objects;
CREATE POLICY "Users can upload trade licenses"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trade-licenses');

-- Allow authenticated users to read trade licenses
DROP POLICY IF EXISTS "Users can view trade licenses" ON storage.objects;
CREATE POLICY "Users can view trade licenses"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'trade-licenses');

-- Step 4: RLS Policy for Admins to Update Company Verification
DROP POLICY IF EXISTS "Admins can update company profiles" ON company_profiles;
CREATE POLICY "Admins can update company profiles"
ON company_profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ═══════════════════════════════════════════════════════════════════
-- Verification: Check that all columns were added
-- Query: SELECT column_name, data_type 
--        FROM information_schema.columns 
--        WHERE table_name = 'company_profiles';
-- 
-- Should see:
--   id                    | uuid
--   legal_name            | text
--   website               | text
--   industry              | text
--   description           | text
--   verified              | boolean
--   trade_license_url     | text          ✅ NEW
--   verification_status   | text          ✅ NEW
--   verification_feedback | text          ✅ NEW
--   verified_at           | timestamp     ✅ NEW
--   verified_by           | uuid          ✅ NEW
--   license_uploaded_at   | timestamp     ✅ NEW
--
-- ═══════════════════════════════════════════════════════════════════
