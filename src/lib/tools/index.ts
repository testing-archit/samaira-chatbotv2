import { z } from 'zod';
import { sql } from '../db';
import { getUserProfile, updateUserProfile } from '../profile';
import { generateStrategy } from '../strategy';
import { model } from '../model';
import { config } from '../config';
import { logger } from '../logger';
import { Pinecone } from '@pinecone-database/pinecone';

let pc: Pinecone | null = null;
function getPineconeClient() {
  if (!pc) {
    pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
  }
  return pc;
}

const PINECONE_INDEX = 'octaraa-kb-v2';

// Basic vector search
async function vectorSearch(tableName: string, query: string, kbFilter: string | null = null, limit = 20) {
  const { embedding } = await model.embed(query);
  const pcClient = getPineconeClient();
  const index = pcClient.Index(PINECONE_INDEX);

  if (kbFilter) {
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
      filter: { kb: kbFilter }
    });

    const results = queryResponse.matches.map(match => ({
      content: match.metadata?.content as string,
      similarity: match.score || 0,
      fts_rank: 0,
      rrf_score: match.score || 0
    })).filter(r => r.similarity > 0.10);
    
    return results;
  } else {
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true
    });

    const results = queryResponse.matches.map(match => ({
      content: match.metadata?.content as string,
      similarity: match.score || 0,
      fts_rank: 0,
      rrf_score: match.score || 0
    })).filter(r => r.similarity > 0.10);
    
    return results;
  }
}

export function getTools(sessionId: string, profileId: string) {
  return {
    search_octaraa_knowledge: {
      description: 'Search the Octaraa product knowledge base. Use this to answer questions about Octaraa features, FAQs, financial planning blogs, psychology of investing, or anything about the Octaraa platform.',
      parameters: z.object({
        query: z.string().describe('The search query about Octaraa features, FAQs, or blogs'),
      }),
      execute: async ({ query }: { query: string }) => {
        logger.info('Tool call: search_octaraa_knowledge', { query });
        const results = await vectorSearch('knowledge_chunks', query, 'octaraa');
        if (results.length === 0) return "I am sorry, but I do not have that specific information about Octaraa based on the website.";
        
        const facts = results.map((r: any) => r.content).join('\n\n');
        const systemPrompt = `You are the Octaraa Expert Agent. Answer the user's query strictly using these facts:\n\n${facts}\n\nDo not invent anything. If the facts don't contain the answer, say 'I could not find this information in the Octaraa knowledge base.' Use markdown formatting.`;
        return await model.agentCall(systemPrompt, query);
      },
    },

    search_finance_education: {
      description: 'Search the finance education knowledge base. Use this to answer general personal finance questions, as well as questions about Mutual Fund Distributors (MFDs), SEBI regulatory compliance, advertising rules, and financial exams (NISM).',
      parameters: z.object({
        query: z.string().describe('The personal finance question or topic'),
      }),
      execute: async ({ query }: { query: string }) => {
        logger.info('Tool call: search_finance_education', { query });
        // Use null kbFilter to search the entire Pinecone index, ensuring we don't miss Octaraa blogs
        // that the supervisor might misclassify as general finance.
        const results = await vectorSearch('knowledge_chunks', query, null);
        const facts = results.length > 0 ? results.map((r: any) => r.content).join('\n\n') : 'No specific facts found in DB.';
        
        const systemPrompt = `You are the Finance Expert Agent. Answer the user's query using these facts (if provided):\n\n${facts}\n\nIf the facts don't contain the answer, use your general knowledge. Follow SEBI rules: NEVER promise guaranteed returns. Do NOT recommend specific stocks or schemes. Provide educational value in markdown.`;
        return await model.agentCall(systemPrompt, query);
      },
    },

    compare_competitor: {
      description: 'Compare Octaraa against a specific Indian competitor. Use the returned facts honestly, but always frame the conclusion to highlight why Octaraa\'s family-centric approach makes it the preferred choice.',
      parameters: z.object({
        competitor: z.string().describe('The name of the competitor (e.g., Groww, INDmoney)'),
      }),
      execute: async ({ competitor }: { competitor: string }) => {
        logger.info('Tool call: compare_competitor', { competitor });
        const results = await sql`
          SELECT dimension, octaraa_advantage, as_of 
          FROM competitor_matrix 
          WHERE competitor ILIKE ${'%' + competitor + '%'}
        `;
        if (results.length === 0) return "I couldn't find specific facts for this competitor, but Octaraa focuses on holistic family-wealth planning.";
        const facts = results.map((r: any) => `Dimension: ${r.dimension}\nOctaraa Advantage: ${r.octaraa_advantage}\n(As of: ${r.as_of})`).join('\n\n');
        
        const systemPrompt = `You are the Competitor Analyst Agent. Use these facts strictly:\n\n${facts}\n\nDo not lie or invent. Frame the comparison favorably for Octaraa's Family Tree and Goal-Based Planning. Make Octaraa sound like the preferred holistic choice. Include the 'As of' date. Provide a clean, short markdown response.`;
        return await model.agentCall(systemPrompt, `Compare Octaraa to ${competitor}`);
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

        // Return pre-formatted markdown so the model doesn't reformat it into a giant table
        const lines: string[] = [];

        if (strategy.issues.length > 0) {
          lines.push('### ⚠️ Areas to Address');
          strategy.issues.forEach(issue => lines.push(`- ${issue}`));
          lines.push('');
        }

        if (strategy.recommendations.length > 0) {
          lines.push('### ✅ Recommended Actions');
          strategy.recommendations.forEach(rec => lines.push(`- ${rec}`));
          lines.push('');
        }

        if (strategy.goalStrategies.length > 0) {
          lines.push('### 🎯 Goal-wise Plan');
          strategy.goalStrategies.forEach(g => lines.push(`- ${g}`));
          lines.push('');
        }

        lines.push('> Present this strategy to the user in an encouraging, warm tone. Do NOT reformat into a table. Just summarise each point naturally in 1-2 sentences each.');

        return lines.join('\n');
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
      execute: async ({ type, principal, rate, years }: { type: 'sip' | 'lumpsum' | 'emi'; principal: number; rate: number; years: number }) => {
        const r = (rate / 100) / 12; // monthly interest rate
        const n = years * 12; // total months

        if (r === 0) return 'Error: Interest rate must be greater than 0.';

        if (type === 'sip') {
          const futureValue = principal * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
          const investedAmount = principal * n;
          const wealthGained = futureValue - investedAmount;
          return `SIP Calculation Result:\nInvested Amount: ₹${Math.round(investedAmount).toLocaleString('en-IN')}\nEstimated Returns: ₹${Math.round(wealthGained).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(futureValue).toLocaleString('en-IN')}`;
        } else if (type === 'lumpsum') {
          const futureValue = principal * Math.pow(1 + (rate / 100), years);
          const wealthGained = futureValue - principal;
          return `Lumpsum Calculation Result:\nInvested Amount: ₹${Math.round(principal).toLocaleString('en-IN')}\nEstimated Returns: ₹${Math.round(wealthGained).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(futureValue).toLocaleString('en-IN')}`;
        } else {
          const emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
          const totalPayment = emi * n;
          const totalInterest = totalPayment - principal;
          return `EMI Calculation Result:\nMonthly EMI: ₹${Math.round(emi).toLocaleString('en-IN')}\nPrincipal Amount: ₹${Math.round(principal).toLocaleString('en-IN')}\nTotal Interest: ₹${Math.round(totalInterest).toLocaleString('en-IN')}\nTotal Payment: ₹${Math.round(totalPayment).toLocaleString('en-IN')}`;
        }
      },
    }
  };
}
