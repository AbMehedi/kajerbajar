-- schema.sql
-- Run this in your Supabase SQL Editor

-- 1. users_profiles
CREATE TABLE users_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('student', 'company', 'admin')),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. student_profiles
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY REFERENCES users_profiles(id),
  username TEXT UNIQUE,
  university TEXT,
  graduation_year INTEGER,
  bio TEXT,
  skills TEXT[],
  portfolio_url TEXT,
  wallet_balance DECIMAL DEFAULT 0,
  kaajerscore DECIMAL DEFAULT 0,
  completion_rate DECIMAL DEFAULT 0
);

-- 3. company_profiles
CREATE TABLE company_profiles (
  id UUID PRIMARY KEY REFERENCES users_profiles(id),
  legal_name TEXT,
  website TEXT,
  industry TEXT,
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  -- Story 1.2: Trade license verification fields
  trade_license_url TEXT,
  verification_status TEXT DEFAULT 'not_submitted' 
    CHECK (verification_status IN ('not_submitted', 'pending', 'verified', 'rejected')),
  verification_feedback TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users_profiles(id),
  license_uploaded_at TIMESTAMPTZ
);

-- 4. skill_verifications
CREATE TABLE skill_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id),
  skill_category TEXT,
  ai_brief TEXT,
  submission_text TEXT,
  submission_file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  admin_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_profiles(id),
  title TEXT,
  description TEXT,
  required_skills TEXT[],
  budget_bdt DECIMAL,
  duration_weeks INTEGER,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  deadline DATE,
  deliverable_format TEXT,
  escrow_status TEXT DEFAULT 'not_deposited' CHECK (escrow_status IN ('not_deposited', 'held', 'released', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  student_id UUID REFERENCES student_profiles(id),
  cover_note TEXT,
  portfolio_item_url TEXT,
  ai_match_score DECIMAL,
  ai_match_reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. escrow_ledger
CREATE TABLE escrow_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  event_type TEXT CHECK (event_type IN ('deposit', 'hold', 'release', 'refund', 'commission')),
  amount_bdt DECIMAL,
  from_party TEXT CHECK (from_party IN ('company', 'escrow', 'platform')),
  to_party TEXT CHECK (to_party IN ('escrow', 'student', 'platform')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. certificates
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  student_id UUID REFERENCES student_profiles(id),
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC for incrementing wallet balance
CREATE OR REPLACE FUNCTION increment_wallet(student_id UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE student_profiles
  SET wallet_balance = wallet_balance + amount
  WHERE id = student_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- STORY 1.2: Company Trade License Verification
-- Run the ALTER statements below if you already have company_profiles
-- ═══════════════════════════════════════════════════════════════════

-- If starting fresh, these columns are added to company_profiles above.
-- If updating existing DB, run these ALTER statements:

/*
-- Add verification columns to existing company_profiles table:

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
*/

-- Helper function to get pending companies count
CREATE OR REPLACE FUNCTION get_pending_companies_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM company_profiles 
  WHERE verification_status = 'pending';
$$ LANGUAGE SQL STABLE;
