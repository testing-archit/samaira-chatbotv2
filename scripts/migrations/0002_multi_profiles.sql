-- Drop the old user_profiles table since we are fundamentally changing its primary key and relationships.
-- (This deletes the 3 test rows we had, which is fine for development).
DROP TABLE IF EXISTS user_profiles;

-- Create the new profiles table to represent individuals within a family
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recreate the financial profiles table, now linked to specific family members instead of the master user account.
CREATE TABLE user_profiles (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  dependents_count INT,
  earning_members INT,
  family_monthly_income_enc BYTEA,
  monthly_surplus_enc BYTEA,
  liabilities_enc BYTEA,
  emergency_fund_months INT,
  has_term_insurance BOOLEAN,
  term_cover_enc BYTEA,
  has_health_insurance BOOLEAN,
  risk_appetite TEXT,
  tax_regime TEXT,
  age INT,
  goals JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
