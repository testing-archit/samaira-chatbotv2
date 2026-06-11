import { z } from 'zod';
import { sql } from '../db';
import { getUserProfile, updateUserProfile } from '../profile';
import { generateStrategy } from '../strategy';
import { model } from '../model';

// Vector search
async function vectorSearch(tableName: string, query: string, kbFilter: string | null = null, limit = 3) {
  const { embedding } = await model.embed(query);
  const formattedEmbedding = `[${embedding.join(',')}]`;

  if (kbFilter) {
    const results = await sql`
      SELECT content, 1 - (embedding <=> ${formattedEmbedding}::vector) as similarity
      FROM ${sql(tableName)}
      WHERE kb = ${kbFilter} AND 1 - (embedding <=> ${formattedEmbedding}::vector) > 0.70
      ORDER BY embedding <=> ${formattedEmbedding}::vector
      LIMIT ${limit}
    `;
    return results;
  } else {
    const results = await sql`
      SELECT content, 1 - (embedding <=> ${formattedEmbedding}::vector) as similarity
      FROM ${sql(tableName)}
      WHERE 1 - (embedding <=> ${formattedEmbedding}::vector) > 0.70
      ORDER BY embedding <=> ${formattedEmbedding}::vector
      LIMIT ${limit}
    `;
    return results;
  }
}

export function getTools(sessionId: string, profileId: string) {
  return {
    search_octaraa_knowledge: {
      description: 'Search the Octaraa product knowledge base. Use this to answer questions about Octaraa features.',
      parameters: z.object({
        query: z.string().describe('The search query about Octaraa features or FAQs'),
      }),
      execute: async ({ query }: { query: string }) => {
        const results = await vectorSearch('knowledge_chunks', query, 'octaraa');
        if (results.length === 0) return "NO INFORMATION FOUND. YOU MUST STRICTLY REPLY: 'I am sorry, but I do not have that specific information about Octaraa.' DO NOT GUESS OR MAKE UP FACTS.";
        return results.map(r => r.content).join('\n\n');
      },
    },

    search_finance_education: {
      description: 'Search the finance education knowledge base. Use this to answer general personal finance questions.',
      parameters: z.object({
        query: z.string().describe('The personal finance question or topic'),
      }),
      execute: async ({ query }: { query: string }) => {
        const results = await vectorSearch('knowledge_chunks', query, 'finance_education');
        if (results.length === 0) return "NO INFORMATION FOUND. If you don't confidently know the answer from your general financial knowledge, politely say you don't know.";
        return results.map(r => r.content).join('\n\n');
      },
    },

    compare_competitor: {
      description: 'Compare Octaraa against a specific Indian competitor.',
      parameters: z.object({
        competitor: z.string().describe('The name of the competitor (e.g., Groww, INDmoney)'),
      }),
      execute: async ({ competitor }: { competitor: string }) => {
        const results = await sql`
          SELECT dimension, octaraa_advantage, as_of 
          FROM competitor_matrix 
          WHERE competitor ILIKE ${'%' + competitor + '%'}
        `;
        if (results.length === 0) return "No specific comparisons found for this competitor. Focus on Octaraa's family-centric approach.";
        return results.map(r => `Dimension: ${r.dimension}\nOctaraa Advantage: ${r.octaraa_advantage}\n(As of: ${r.as_of})`).join('\n\n');
      },
    },

    get_profile: {
      description: 'Read the current financial profile of the family member you are advising. Returns their income, goals, dependents, etc.',
      parameters: z.object({}),
      execute: async () => {
        const profile = await getUserProfile(profileId);
        return profile ? JSON.stringify(profile) : "Profile is empty.";
      },
    },

    update_profile: {
      description: 'Update the user profile with new slot values collected from the conversation.',
      parameters: z.object({
        dependents_count: z.number().optional(),
        earning_members: z.number().optional(),
        family_monthly_income: z.number().optional(),
        monthly_surplus: z.number().optional(),
        liabilities: z.number().optional(),
        emergency_fund_months: z.number().optional(),
        has_term_insurance: z.boolean().optional(),
        term_cover: z.number().optional(),
        has_health_insurance: z.boolean().optional(),
        risk_appetite: z.enum(['low', 'medium', 'high']).optional(),
        tax_regime: z.enum(['old', 'new']).optional(),
        age: z.number().optional(),
        goals: z.array(z.object({
          name: z.string(),
          target_amount: z.number(),
          horizon_years: z.number()
        })).optional()
      }),
      execute: async (args: any) => {
        if (!args || Object.keys(args).length === 0) {
          return "No new profile data provided. You must provide at least one field to update.";
        }
        await updateUserProfile(profileId, args);
        return "Profile updated successfully.";
      },
    },

    generate_strategy: {
      description: 'Generate a deterministic strategy based on the current profile. Run this once enough slots (income, surplus, risk, goals) are filled.',
      parameters: z.object({}),
      execute: async () => {
        const profile = await getUserProfile(profileId);
        if (!profile) return "Error: Profile is empty. Collect data first.";
        
        const strategy = generateStrategy(profile);
        return JSON.stringify(strategy);
      },
    },

    financial_calculator: {
      description: 'Calculate SIP future values, lumpsum compound interest, or EMI payments.',
      parameters: z.object({
        type: z.enum(['sip', 'lumpsum', 'emi']).describe('Type of calculation'),
        principal: z.number().describe('Monthly SIP amount, lumpsum investment amount, or loan principal amount'),
        rate: z.number().describe('Annual interest rate percentage (e.g. 12 for 12%)'),
        years: z.number().describe('Time horizon in years')
      }),
      execute: async ({ type, principal, rate, years }: { type: 'sip' | 'lumpsum' | 'emi', principal: number, rate: number, years: number }) => {
        const r = (rate / 100) / 12; // monthly interest rate
        const n = years * 12; // total months

        if (type === 'sip') {
          const futureValue = principal * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
          const investedAmount = principal * n;
          const wealthGained = futureValue - investedAmount;
          return `SIP Calculation Result:\nInvested Amount: ₹${Math.round(investedAmount).toLocaleString('en-IN')}\nEstimated Returns: ₹${Math.round(wealthGained).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(futureValue).toLocaleString('en-IN')}`;
        } else if (type === 'lumpsum') {
          const futureValue = principal * Math.pow(1 + (rate / 100), years);
          const wealthGained = futureValue - principal;
          return `Lumpsum Calculation Result:\nInvested Amount: ₹${Math.round(principal).toLocaleString('en-IN')}\nEstimated Returns: ₹${Math.round(wealthGained).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(futureValue).toLocaleString('en-IN')}`;
        } else if (type === 'emi') {
          const emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
          const totalPayment = emi * n;
          const totalInterest = totalPayment - principal;
          return `EMI Calculation Result:\nMonthly EMI: ₹${Math.round(emi).toLocaleString('en-IN')}\nPrincipal Amount: ₹${Math.round(principal).toLocaleString('en-IN')}\nTotal Interest: ₹${Math.round(totalInterest).toLocaleString('en-IN')}\nTotal Payment: ₹${Math.round(totalPayment).toLocaleString('en-IN')}`;
        }
        return "Invalid calculation type.";
      },
    }
  };
}
