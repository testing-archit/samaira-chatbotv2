import { sql } from './db';
import { encrypt, decrypt } from './encryption';
import { Profile } from './strategy';

export async function getUserProfile(profileId: string): Promise<Profile | null> {
  const rows = await sql`SELECT * FROM user_profiles WHERE profile_id = ${profileId}`;
  if (rows.length === 0) return null;

  const row = rows[0];
  
  return {
    dependents_count: row.dependents_count,
    earning_members: row.earning_members,
    family_monthly_income: row.family_monthly_income_enc ? Number(decrypt(row.family_monthly_income_enc.toString('utf8'))) : undefined,
    monthly_surplus: row.monthly_surplus_enc ? Number(decrypt(row.monthly_surplus_enc.toString('utf8'))) : undefined,
    liabilities: row.liabilities_enc ? Number(decrypt(row.liabilities_enc.toString('utf8'))) : undefined,
    emergency_fund_months: row.emergency_fund_months,
    has_term_insurance: row.has_term_insurance,
    term_cover: row.term_cover_enc ? Number(decrypt(row.term_cover_enc.toString('utf8'))) : undefined,
    has_health_insurance: row.has_health_insurance,
    risk_appetite: row.risk_appetite,
    tax_regime: row.tax_regime,
    age: row.age,
    goals: row.goals,
  };
}

export async function updateUserProfile(profileId: string, data: Partial<Profile>) {
  // Ensure the user_profiles row exists for this profile_id
  await sql`INSERT INTO user_profiles (profile_id) VALUES (${profileId}) ON CONFLICT DO NOTHING`;
  const encIncome = data.family_monthly_income !== undefined ? Buffer.from(encrypt(String(data.family_monthly_income)), 'utf8') : null;
  const encSurplus = data.monthly_surplus !== undefined ? Buffer.from(encrypt(String(data.monthly_surplus)), 'utf8') : null;
  const encLiabilities = data.liabilities !== undefined ? Buffer.from(encrypt(String(data.liabilities)), 'utf8') : null;
  const encTermCover = data.term_cover !== undefined ? Buffer.from(encrypt(String(data.term_cover)), 'utf8') : null;

  await sql`
    INSERT INTO user_profiles (
      profile_id, dependents_count, earning_members, family_monthly_income_enc, 
      monthly_surplus_enc, liabilities_enc, emergency_fund_months, 
      has_term_insurance, term_cover_enc, has_health_insurance, 
      risk_appetite, tax_regime, age, goals, updated_at
    ) VALUES (
      ${profileId}, 
      ${data.dependents_count ?? null}, 
      ${data.earning_members ?? null}, 
      ${encIncome}, 
      ${encSurplus}, 
      ${encLiabilities}, 
      ${data.emergency_fund_months ?? null}, 
      ${data.has_term_insurance ?? null}, 
      ${encTermCover}, 
      ${data.has_health_insurance ?? null}, 
      ${data.risk_appetite ?? null}, 
      ${data.tax_regime ?? null}, 
      ${data.age ?? null}, 
      ${data.goals ? JSON.stringify(data.goals) : null}, 
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (profile_id) DO UPDATE SET
      dependents_count = COALESCE(EXCLUDED.dependents_count, user_profiles.dependents_count),
      earning_members = COALESCE(EXCLUDED.earning_members, user_profiles.earning_members),
      family_monthly_income_enc = COALESCE(EXCLUDED.family_monthly_income_enc, user_profiles.family_monthly_income_enc),
      monthly_surplus_enc = COALESCE(EXCLUDED.monthly_surplus_enc, user_profiles.monthly_surplus_enc),
      liabilities_enc = COALESCE(EXCLUDED.liabilities_enc, user_profiles.liabilities_enc),
      emergency_fund_months = COALESCE(EXCLUDED.emergency_fund_months, user_profiles.emergency_fund_months),
      has_term_insurance = COALESCE(EXCLUDED.has_term_insurance, user_profiles.has_term_insurance),
      term_cover_enc = COALESCE(EXCLUDED.term_cover_enc, user_profiles.term_cover_enc),
      has_health_insurance = COALESCE(EXCLUDED.has_health_insurance, user_profiles.has_health_insurance),
      risk_appetite = COALESCE(EXCLUDED.risk_appetite, user_profiles.risk_appetite),
      tax_regime = COALESCE(EXCLUDED.tax_regime, user_profiles.tax_regime),
      age = COALESCE(EXCLUDED.age, user_profiles.age),
      goals = COALESCE(EXCLUDED.goals, user_profiles.goals),
      updated_at = CURRENT_TIMESTAMP
  `;
}

export async function setConsent(sessionId: string, userId: string) {
  await sql`INSERT INTO users (id) VALUES (${userId}) ON CONFLICT DO NOTHING`;
  await sql`
    INSERT INTO sessions (id, user_id, consent_profiling) 
    VALUES (${sessionId}, ${userId}, true)
    ON CONFLICT (id) DO UPDATE SET consent_profiling = true
  `;
}

export async function hasConsent(sessionId: string): Promise<boolean> {
  const rows = await sql`SELECT consent_profiling FROM sessions WHERE id = ${sessionId}`;
  return rows.length > 0 ? rows[0].consent_profiling : false;
}

export async function getFamilyProfiles(userId: string) {
  return await sql`SELECT id, name, relation, created_at FROM profiles WHERE user_id = ${userId} ORDER BY created_at ASC`;
}

export async function createFamilyProfile(userId: string, name: string, relation: string) {
  const result = await sql`
    INSERT INTO profiles (user_id, name, relation) 
    VALUES (${userId}, ${name}, ${relation}) 
    RETURNING id
  `;
  return result[0].id;
}

export async function deleteFamilyProfile(profileId: string, userId: string) {
  await sql`DELETE FROM profiles WHERE id = ${profileId} AND user_id = ${userId}`;
}
