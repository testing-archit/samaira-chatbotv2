import { describe, it, expect } from 'vitest';
import { generateStrategy, Profile } from '../src/lib/strategy';

describe('Strategy Engine', () => {
  it('should flag low emergency fund and suggest target', () => {
    const profile: Profile = {
      family_monthly_income: 100000,
      monthly_surplus: 20000,
      emergency_fund_months: 2
    };
    // Expenses = 80000. Target = 480000
    const result = generateStrategy(profile);
    expect(result.issues.some(i => i.includes('Emergency fund is insufficient'))).toBe(true);
    expect(result.issues.some(i => i.includes('2 months'))).toBe(true);
    expect(result.recommendations.some(r => r.includes('Emergency Fund'))).toBe(true);
    expect(result.recommendations.some(r => r.includes('Liquid Mutual Fund'))).toBe(true);
  });

  it('should recognize healthy emergency fund', () => {
    const profile: Profile = {
      family_monthly_income: 100000,
      monthly_surplus: 20000,
      emergency_fund_months: 6
    };
    const result = generateStrategy(profile);
    expect(result.recommendations.some(r => r.includes('healthy'))).toBe(true);
  });

  it('should flag insurance gaps', () => {
    const profile: Profile = {
      family_monthly_income: 100000,
      dependents_count: 2,
      has_term_insurance: false,
      has_health_insurance: false
    };
    const result = generateStrategy(profile);
    expect(result.issues.some(i => i.includes('No term life insurance'))).toBe(true);
    expect(result.issues.some(i => i.includes('health insurance'))).toBe(true);
  });

  it('should compute asset allocation based on risk and age', () => {
    // High risk, age 30 => equityPct = min(75, 100-30=70) = 70
    const profile: Profile = {
      age: 30,
      risk_appetite: 'high'
    };
    const result = generateStrategy(profile);
    expect(result.recommendations.some(r => r.includes('70% Equity'))).toBe(true);
    expect(result.recommendations.some(r => r.includes('30% Debt'))).toBe(true);

    // High risk, age 60 => equityPct = min(75, max(100-60=40, 20)) = 40
    const olderProfile: Profile = {
      age: 60,
      risk_appetite: 'high'
    };
    const result2 = generateStrategy(olderProfile);
    expect(result2.recommendations.some(r => r.includes('40% Equity'))).toBe(true);
    expect(result2.recommendations.some(r => r.includes('60% Debt'))).toBe(true);
  });

  it('should calculate SIP amounts for goals', () => {
    const profile: Profile = {
      risk_appetite: 'high',
      age: 30,
      goals: [
        { name: 'College', target_amount: 5000000, horizon_years: 15 }
      ]
    };
    const result = generateStrategy(profile);
    expect(result.goalStrategies[0]).toContain('College');
    expect(result.goalStrategies[0]).toContain('15 yrs');
    expect(result.goalStrategies[0]).toContain('mo SIP');
  });

  it('should not produce NaN in SIP calculation when surplus is zero', () => {
    const profile: Profile = {
      risk_appetite: 'medium',
      goals: [
        { name: 'House', target_amount: 10000000, horizon_years: 10 }
      ]
    };
    const result = generateStrategy(profile);
    expect(result.goalStrategies[0]).not.toContain('NaN');
    expect(result.goalStrategies[0]).toContain('House');
  });

  it('should handle completely empty profile without crashing', () => {
    const profile: Profile = {};
    expect(() => generateStrategy(profile)).not.toThrow();
  });
});
