import { z } from 'zod';
import { sql } from '../db';
import { getUserProfile, updateUserProfile } from '../profile';
import { generateStrategy } from '../strategy';
import { model } from '../model';
import { config } from '../config';
import { logger } from '../logger';

// Vector search with HyDE (Hypothetical Document Embeddings)
async function vectorSearch(tableName: string, query: string, kbFilter: string | null = null, limit = 3) {
  let expandedQuery = query;
  try {
    const hydeRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: "You are an expert providing hypothetical facts. Provide a very brief, plausible factual paragraph that answers the user's query. This will be used to help a vector search engine find relevant documents. Do not use conversational filler, just the hypothetical facts." },
          { role: 'user', content: query }
        ],
      })
    });
    if (hydeRes.ok) {
      const data = await hydeRes.json();
      const hypotheticalAnswer = data.choices?.[0]?.message?.content || '';
      if (hypotheticalAnswer) {
        expandedQuery = query + "\n\n" + hypotheticalAnswer;
      }
    }
  } catch (e) {
    logger.warn('HyDE expansion failed, falling back to basic query.', { error: (e as Error).message });
  }

  const { embedding } = await model.embed(expandedQuery);
  const formattedEmbedding = `[${embedding.join(',')}]`;

  if (kbFilter) {
    const results = await sql`
      WITH vector_search AS (
        SELECT id, 1 - (embedding <=> ${formattedEmbedding}::vector) as similarity,
               row_number() over (order by embedding <=> ${formattedEmbedding}::vector) as rank
        FROM knowledge_chunks
        WHERE kb = ${kbFilter} AND 1 - (embedding <=> ${formattedEmbedding}::vector) > 0.20
      ),
      fts_search AS (
        SELECT id, ts_rank(content_fts, websearch_to_tsquery('english', ${query})) as fts_rank,
               row_number() over (order by ts_rank(content_fts, websearch_to_tsquery('english', ${query})) desc) as rank
        FROM knowledge_chunks
        WHERE kb = ${kbFilter} AND content_fts @@ websearch_to_tsquery('english', ${query})
      )
      SELECT
        kc.content,
        coalesce(vs.similarity, 0) as similarity,
        coalesce(fs.fts_rank, 0) as fts_rank,
        coalesce(1.0 / (60 + vs.rank), 0.0) + coalesce(1.0 / (60 + fs.rank), 0.0) as rrf_score
      FROM knowledge_chunks kc
      LEFT JOIN vector_search vs ON kc.id = vs.id
      LEFT JOIN fts_search fs ON kc.id = fs.id
      WHERE (vs.id IS NOT NULL OR fs.id IS NOT NULL)
      ORDER BY rrf_score DESC
      LIMIT ${limit}
    `;
    return results;
  } else {
    const results = await sql`
      WITH vector_search AS (
        SELECT id, 1 - (embedding <=> ${formattedEmbedding}::vector) as similarity,
               row_number() over (order by embedding <=> ${formattedEmbedding}::vector) as rank
        FROM knowledge_chunks
        WHERE 1 - (embedding <=> ${formattedEmbedding}::vector) > 0.20
      ),
      fts_search AS (
        SELECT id, ts_rank(content_fts, websearch_to_tsquery('english', ${query})) as fts_rank,
               row_number() over (order by ts_rank(content_fts, websearch_to_tsquery('english', ${query})) desc) as rank
        FROM knowledge_chunks
        WHERE content_fts @@ websearch_to_tsquery('english', ${query})
      )
      SELECT
        kc.content,
        coalesce(vs.similarity, 0) as similarity,
        coalesce(fs.fts_rank, 0) as fts_rank,
        coalesce(1.0 / (60 + vs.rank), 0.0) + coalesce(1.0 / (60 + fs.rank), 0.0) as rrf_score
      FROM knowledge_chunks kc
      LEFT JOIN vector_search vs ON kc.id = vs.id
      LEFT JOIN fts_search fs ON kc.id = fs.id
      WHERE (vs.id IS NOT NULL OR fs.id IS NOT NULL)
      ORDER BY rrf_score DESC
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
        logger.info('Tool call: search_octaraa_knowledge', { query });
        const results = await vectorSearch('knowledge_chunks', query, 'octaraa');
        if (results.length === 0) return "NO INFORMATION FOUND. YOU MUST STRICTLY REPLY: 'I am sorry, but I do not have that specific information about Octaraa.' DO NOT GUESS OR MAKE UP FACTS.";
        return results.map((r: any) => r.content).join('\n\n');
      },
    },

    search_finance_education: {
      description: 'Search the finance education knowledge base. Use this to answer general personal finance questions, as well as questions about Mutual Fund Distributors (MFDs), SEBI regulatory compliance, advertising rules, and financial exams (NISM).',
      parameters: z.object({
        query: z.string().describe('The personal finance question or topic'),
      }),
      execute: async ({ query }: { query: string }) => {
        logger.info('Tool call: search_finance_education', { query });
        const results = await vectorSearch('knowledge_chunks', query, 'finance_education');
        if (results.length === 0) return "NO INFORMATION FOUND. If you don't confidently know the answer from your general financial knowledge, politely say you don't know.";
        return results.map((r: any) => r.content).join('\n\n');
      },
    },

    compare_competitor: {
      description: 'Compare Octaraa against a specific Indian competitor.',
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
        if (results.length === 0) return "No specific comparisons found for this competitor. Focus on Octaraa's family-centric approach.";
        return results.map((r: any) => `Dimension: ${r.dimension}\nOctaraa Advantage: ${r.octaraa_advantage}\n(As of: ${r.as_of})`).join('\n\n');
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
