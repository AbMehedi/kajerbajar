-- 1. Add about_text and portfolio_url to student_profiles
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS about_text TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- 2. Add about_text and website_url to company_profiles
ALTER TABLE company_profiles 
ADD COLUMN IF NOT EXISTS about_text TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;
