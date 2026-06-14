export interface Profile {
  dependents_count?: number;
  earning_members?: number;
  family_monthly_income?: number;
  monthly_surplus?: number;
  liabilities?: number;
  emergency_fund_months?: number;
  emergency_fund_amount?: number;
  current_investments?: number;
  has_term_insurance?: boolean;
  term_cover?: number;
  has_health_insurance?: boolean;
  risk_appetite?: 'low' | 'medium' | 'high';
  tax_regime?: 'old' | 'new';
  age?: number;
  goals?: Array<{ name: string; target_amount: number; horizon_years: number }>;
}

function fmt(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function generateStrategy(profile: Profile) {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const income = Math.max(profile.family_monthly_income || 0, 0);
  const surplus = Math.max(profile.monthly_surplus || 0, 0);
  const expenses = Math.max(income - surplus, 0);

  // 1. Emergency Fund
  let efMonths = profile.emergency_fund_months;
  if (efMonths === undefined && profile.emergency_fund_amount !== undefined && expenses > 0) {
    efMonths = profile.emergency_fund_amount / expenses;
  }
  efMonths = efMonths ?? 0;

  if (efMonths < 6 && expenses > 0) {
    const targetEf = expenses * 6;
    issues.push(`Emergency fund is insufficient (${efMonths.toFixed(1)} months). Target: **6 months of expenses (${fmt(targetEf)})**.`);
    recommendations.push(`**Step 1 — Emergency Fund**: Immediately start parking ${fmt(Math.min(surplus * 0.5, targetEf / 12))}/mo into a Liquid Mutual Fund until you reach ${fmt(targetEf)}.`);
  } else if (efMonths >= 6) {
    recommendations.push(`✅ **Emergency fund is healthy** (${efMonths.toFixed(1)} months covered).`);
  }

  // 2. Insurance Gap
  if ((profile.dependents_count ?? 0) > 0 && !profile.has_term_insurance) {
    const targetCover = income * 12 * 10;
    issues.push(`No term life insurance. With ${profile.dependents_count} dependent(s), you need a cover of ~**${fmt(targetCover)}** (10× annual income).`);
    recommendations.push(`**Step 2 — Term Insurance**: Get a pure term life plan for ${fmt(targetCover)}. Annual premium is typically ₹10,000–₹25,000 for a ₹1 Crore cover.`);
  }
  if (!profile.has_health_insurance) {
    issues.push(`No family health insurance detected. A medical emergency can wipe out savings.`);
    recommendations.push(`**Step 3 — Health Insurance**: Get a base family floater (₹5L) + a Super Top-Up (₹50L deductible ₹5L) for comprehensive protection.`);
  }

  // 3. Asset Allocation
  const risk = profile.risk_appetite || 'medium';
  let equityPct = 60;
  if (risk === 'high') equityPct = 75;
  if (risk === 'low') equityPct = 35;
  if (profile.age && profile.age > 0) {
    const maxEquity = Math.max(100 - profile.age, 20);
    equityPct = Math.min(equityPct, maxEquity);
  }
  const debtPct = 100 - equityPct;

  recommendations.push(
    `**Portfolio Allocation (${risk} risk)**: ${equityPct}% Equity (Nifty 50 Index Fund + Flexi-Cap) / ${debtPct}% Debt (PPF + Liquid Fund).`
  );

  // 4. Goals
  const annualReturnPct = (equityPct * 11 + debtPct * 6.5) / 100;
  const monthlyRatePct = annualReturnPct / 12 / 100;

  const goalStrategies: string[] = [];
  let totalRequiredSip = 0;

  (profile.goals || []).forEach((goal) => {
    const months = Math.max(goal.horizon_years * 12, 1);
    const target = Math.max(goal.target_amount, 0);
    let requiredSip = 0;
    if (monthlyRatePct > 0 && months > 0 && target > 0) {
      const fv = Math.pow(1 + monthlyRatePct, months) - 1;
      if (fv > 0) {
        requiredSip = Math.round(target * monthlyRatePct / fv);
      }
    }
    totalRequiredSip += requiredSip;
    const sipLabel = requiredSip > 0 ? `${fmt(requiredSip)}/mo SIP` : 'Target amount or horizon too small to calculate SIP';
    goalStrategies.push(`**${goal.name}** (in ${goal.horizon_years} yrs, target ${fmt(target)}): Requires ~${sipLabel} at ${annualReturnPct.toFixed(1)}% assumed return.`);
  });

  if (totalRequiredSip > surplus && surplus > 0) {
    issues.push(`🚨 **Goal Shortfall**: Your goals require a total SIP of **${fmt(totalRequiredSip)}/mo**, but your available surplus is only **${fmt(surplus)}/mo**. You will need to prioritize goals, extend timelines, or increase your surplus.`);
    goalStrategies.push(`\n*Note: The combined SIP required for these goals (${fmt(totalRequiredSip)}/mo) exceeds your current surplus of ${fmt(surplus)}/mo. Let's discuss how to prioritize or adjust your targets.*`);
  }

  return {
    issues,
    recommendations,
    goalStrategies,
  };
}
