import { z } from 'zod';
import { sql } from '../db';
import { getUserProfile, updateUserProfile } from '../profile';
import { generateStrategy } from '../strategy';
import { model } from '../model';
import { config } from '../config';
import { logger } from '../logger';
import { Pinecone } from '@pinecone-database/pinecone';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

export function getTools(context: { sessionId: string; profileId: string; userId: string; profileName: string; profileRelation: string }) {
  return {
    search_octaraa_knowledge: {
      description: 'Use this tool to find ANY information about Octaraa, including its platform features, policies, headquarters, location, founders, contact details, data fiduciary info, FAQs, family wealth tools, or financial planning blogs.',
      parameters: z.object({
        query: z.string().describe('The search query about Octaraa features, FAQs, or blogs'),
      }),
      execute: async ({ query }: { query: string }) => {
        logger.info('Tool call: search_octaraa_knowledge', { query });
        const results = await vectorSearch('knowledge_chunks', query, 'octaraa');
        if (results.length === 0) return "I am sorry, but I do not have that specific information about Octaraa based on the website.";
        
        const facts = results.map((r: any) => r.content).join('\n\n');
        const systemPrompt = `You are the Octaraa Expert Agent. Answer the user's query strictly using these facts:\n\n${facts}\n\nDo not invent anything. If the facts don't contain the answer, say 'I could not find this information in the Octaraa knowledge base.'\n\nCRITICAL: To keep the user engaged, ALWAYS end your response with a friendly, relevant follow-up question to encourage further conversation or ask about their financial goals. Use markdown formatting.`;
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
        
        const systemPrompt = `You are the Finance Expert Agent. Answer the user's query using these facts (if provided):\n\n${facts}\n\nIf the facts don't contain the answer, use your general knowledge. Follow SEBI rules: NEVER promise guaranteed returns. Do NOT recommend specific stocks or schemes. Provide educational value in markdown.\n\nCRITICAL: To keep the user engaged, ALWAYS end your response with a friendly, relevant follow-up question to encourage further conversation. For example, you can ask if they want to calculate their SIP returns or set a new financial goal.`;
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
        
        const systemPrompt = `You are the Competitor Analyst Agent. Use these facts strictly:\n\n${facts}\n\nDo not lie or invent. Frame the comparison favorably for Octaraa's Family Tree and Goal-Based Planning. Make Octaraa sound like the preferred holistic choice. Include the 'As of' date. Provide a clean, short markdown response.\n\nCRITICAL: ALWAYS end your response with a friendly follow-up question inviting them to try setting up their Family Tree or planning a goal with Octaraa.`;
        return await model.agentCall(systemPrompt, `Compare Octaraa to ${competitor}`);
      },
    },

    get_profile: {
      description: 'Read the current financial profile of the family member you are advising. Returns their income, goals, dependents, etc.',
      parameters: z.object({}),
      execute: async () => {
        const profile = await getUserProfile(context.profileId);
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
        await updateUserProfile(context.profileId, args);
        return "Profile updated successfully.";
      },
    },

    generate_strategy: {
      description: 'Generate a deterministic strategy based on the current profile. Run this once enough slots (income, surplus, risk, goals) are filled.',
      parameters: z.object({}),
      execute: async () => {
        const profile = await getUserProfile(context.profileId);
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
      description: 'Calculate mathematical financial projections including SIP, Lumpsum, EMI, Step-Up SIP, SWP, PPF, SSY, CAGR, Retirement, Income Tax, etc.',
      parameters: z.object({
        type: z.enum(['sip', 'lumpsum', 'emi', 'college_cost', 'step_up_sip', 'target_sip', 'cost_of_delay', 'fd', 'rd', 'swp', 'cagr', 'retirement', 'ppf', 'ssy', 'income_tax']).describe('Type of calculation'),
        principal: z.number().optional().describe('Monthly amount, lumpsum amount, loan principal, or current cost'),
        rate: z.number().optional().describe('Annual interest rate percentage (e.g. 12 for 12%)'),
        years: z.number().optional().describe('Time horizon in years'),
        inflation_rate: z.number().optional().describe('Inflation rate percentage'),
        step_up_rate: z.number().optional().describe('Annual increase percentage for SIPs'),
        target_amount: z.number().optional().describe('Target corpus amount'),
        withdrawal_amount: z.number().optional().describe('Monthly withdrawal amount for SWP'),
        delay_years: z.number().optional().describe('Years of delay for cost_of_delay'),
        final_amount: z.number().optional().describe('Final corpus for CAGR')
      }),
      execute: async (args: any) => {
        const { type, principal = 0, rate = 0, years = 0, inflation_rate = 0, step_up_rate = 0, target_amount = 0, withdrawal_amount = 0, delay_years = 0, final_amount = 0 } = args;

        const r = (rate / 100) / 12; // monthly interest rate
        const n = years * 12; // total months
        const annual_r = rate / 100;
        const inf = inflation_rate / 100;

        if (type === 'sip') {
          if (r === 0) return 'Error: Interest rate must be greater than 0.';
          const futureValue = principal * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
          const investedAmount = principal * n;
          return `SIP Result:\nInvested: ₹${Math.round(investedAmount).toLocaleString('en-IN')}\nReturns: ₹${Math.round(futureValue - investedAmount).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(futureValue).toLocaleString('en-IN')}`;
        } else if (type === 'lumpsum') {
          const futureValue = principal * Math.pow(1 + annual_r, years);
          return `Lumpsum Result:\nInvested: ₹${Math.round(principal).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(futureValue).toLocaleString('en-IN')}`;
        } else if (type === 'emi') {
          if (r === 0) return 'Error: Interest rate must be greater than 0.';
          const emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
          const totalPayment = emi * n;
          return `EMI Result:\nMonthly EMI: ₹${Math.round(emi).toLocaleString('en-IN')}\nTotal Interest: ₹${Math.round(totalPayment - principal).toLocaleString('en-IN')}\nTotal Payment: ₹${Math.round(totalPayment).toLocaleString('en-IN')}`;
        } else if (type === 'college_cost') {
          const futureCost = principal * Math.pow(1 + inf, years);
          return `College Cost Result:\nCurrent Cost: ₹${Math.round(principal).toLocaleString('en-IN')}\nEstimated Future Cost in ${years} years (at ${inflation_rate}% inflation): ₹${Math.round(futureCost).toLocaleString('en-IN')}`;
        } else if (type === 'step_up_sip') {
          let totalInvested = 0;
          let currentMonthlySIP = principal;
          let futureValue = 0;
          for (let y = 1; y <= years; y++) {
            for (let m = 1; m <= 12; m++) {
              totalInvested += currentMonthlySIP;
              futureValue = (futureValue + currentMonthlySIP) * (1 + r);
            }
            currentMonthlySIP += currentMonthlySIP * (step_up_rate / 100);
          }
          return `Step-Up SIP Result:\nTotal Invested: ₹${Math.round(totalInvested).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(futureValue).toLocaleString('en-IN')}`;
        } else if (type === 'target_sip') {
          if (r === 0) return 'Error: Interest rate must be greater than 0.';
          const requiredSip = target_amount / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
          return `Target SIP Result:\nTo reach ₹${Math.round(target_amount).toLocaleString('en-IN')} in ${years} years at ${rate}%, required monthly SIP is ₹${Math.round(requiredSip).toLocaleString('en-IN')}`;
        } else if (type === 'cost_of_delay') {
          if (r === 0) return 'Error: Interest rate must be greater than 0.';
          const fvNow = principal * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
          const delayedMonths = (years - delay_years) * 12;
          const fvDelayed = delayedMonths > 0 ? principal * ((Math.pow(1 + r, delayedMonths) - 1) / r) * (1 + r) : 0;
          const cost = fvNow - fvDelayed;
          return `Cost of Delay Result:\nWealth if started now: ₹${Math.round(fvNow).toLocaleString('en-IN')}\nWealth if delayed by ${delay_years} years: ₹${Math.round(fvDelayed).toLocaleString('en-IN')}\nCost of Delay: ₹${Math.round(cost).toLocaleString('en-IN')}`;
        } else if (type === 'fd') {
          const quarterlyRate = annual_r / 4;
          const totalQuarters = years * 4;
          const futureValue = principal * Math.pow(1 + quarterlyRate, totalQuarters);
          return `Fixed Deposit Result:\nInvested: ₹${Math.round(principal).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(futureValue).toLocaleString('en-IN')}`;
        } else if (type === 'rd') {
          if (r === 0) return 'Error: Interest rate must be greater than 0.';
          const futureValue = principal * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
          return `Recurring Deposit Result:\nInvested: ₹${Math.round(principal * n).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(futureValue).toLocaleString('en-IN')}`;
        } else if (type === 'swp') {
          let balance = principal;
          let totalWithdrawn = 0;
          for (let m = 1; m <= n; m++) {
            balance = balance * (1 + r) - withdrawal_amount;
            if (balance < 0) {
              totalWithdrawn += (withdrawal_amount + balance);
              return `SWP Result:\nCorpus depleted in ${Math.floor(m / 12)} years and ${m % 12} months.\nTotal Withdrawn: ₹${Math.round(totalWithdrawn).toLocaleString('en-IN')}`;
            }
            totalWithdrawn += withdrawal_amount;
          }
          return `SWP Result:\nTotal Withdrawn: ₹${Math.round(totalWithdrawn).toLocaleString('en-IN')}\nFinal Balance remaining: ₹${Math.round(balance).toLocaleString('en-IN')}`;
        } else if (type === 'ppf') {
          const ppfRate = 0.071; // 7.1%
          let balance = 0;
          let invested = 0;
          for (let y = 1; y <= 15; y++) {
            invested += principal; 
            balance = (balance + principal) * (1 + ppfRate);
          }
          return `PPF Result (15 years at 7.1%):\nTotal Invested: ₹${Math.round(invested).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(balance).toLocaleString('en-IN')}`;
        } else if (type === 'ssy') {
          const ssyRate = 0.082; // 8.2%
          let balance = 0;
          let invested = 0;
          for (let y = 1; y <= 21; y++) {
            if (y <= 15) {
              invested += principal;
              balance += principal;
            }
            balance = balance * (1 + ssyRate);
          }
          return `Sukanya Samriddhi Yojana Result (21 years at 8.2%):\nTotal Invested: ₹${Math.round(invested).toLocaleString('en-IN')}\nTotal Value: ₹${Math.round(balance).toLocaleString('en-IN')}`;
        } else if (type === 'cagr') {
          const cagr = Math.pow(final_amount / principal, 1 / years) - 1;
          return `CAGR Result:\nCompound Annual Growth Rate: ${(cagr * 100).toFixed(2)}%`;
        } else if (type === 'retirement') {
          const yearsToRetire = years;
          const lifeExpectancyPostRetirement = delay_years || 20; 
          const futureExpense = principal * Math.pow(1 + inf, yearsToRetire); 
          const annualRetirementExpense = futureExpense * 12;
          const realReturnRate = ((1 + annual_r) / (1 + inf)) - 1;
          const requiredCorpus = annualRetirementExpense * ((1 - Math.pow(1 + realReturnRate, -lifeExpectancyPostRetirement)) / realReturnRate);
          return `Retirement Corpus Result:\nEstimated Annual Expense at Retirement: ₹${Math.round(annualRetirementExpense).toLocaleString('en-IN')}\nRequired Retirement Corpus: ₹${Math.round(requiredCorpus).toLocaleString('en-IN')}`;
        } else if (type === 'income_tax') {
          const income = principal;
          let oldTax = 0;
          if (income > 250000) {
            if (income <= 500000) oldTax = (income - 250000) * 0.05;
            else if (income <= 1000000) oldTax = 12500 + (income - 500000) * 0.20;
            else oldTax = 112500 + (income - 1000000) * 0.30;
          }
          if (income <= 500000) oldTax = 0; 
          let newTax = 0;
          if (income > 300000) {
            if (income <= 600000) newTax = (income - 300000) * 0.05;
            else if (income <= 900000) newTax = 15000 + (income - 600000) * 0.10;
            else if (income <= 1200000) newTax = 45000 + (income - 900000) * 0.15;
            else if (income <= 1500000) newTax = 90000 + (income - 1200000) * 0.20;
            else newTax = 150000 + (income - 1500000) * 0.30;
          }
          if (income <= 700000) newTax = 0; 
          return `Income Tax Result (Simplified):\nIncome: ₹${income.toLocaleString('en-IN')}\nTax under Old Regime: ₹${Math.round(oldTax).toLocaleString('en-IN')}\nTax under New Regime: ₹${Math.round(newTax).toLocaleString('en-IN')}`;
        }
        
        return "Unknown calculation type.";
      },
    },

    capture_lead: {
      description: 'Capture contact details and query for callback or unresolved queries.',
      parameters: z.object({
        name: z.string().optional(),
        phone: z.string(),
        query: z.string()
      }),
      execute: async ({ name, phone, query }: { name?: string; phone: string; query: string }) => {
        logger.info('Tool call: capture_lead', { name, phone, query });
        try {
          // 1. Append to CSV (Gracefully handle read-only environments like Vercel)
          try {
            const leadsFile = path.join(process.cwd(), 'leads.csv');
            const timestamp = new Date().toISOString();
            const csvLine = `"${timestamp}","${name}","${phone}","${query.replace(/"/g, '""')}"\n`;
            
            try {
              await fs.access(leadsFile);
            } catch {
              await fs.writeFile(leadsFile, '"Timestamp","Name","Phone","Query"\n');
            }
            await fs.appendFile(leadsFile, csvLine);
          } catch (fsError: any) {
            logger.warn('Could not write to local CSV (likely running on Vercel read-only filesystem)', { error: fsError.message });
          }

          // Fetch additional context
          const messages = await sql`SELECT role, content FROM messages WHERE session_id = ${context.sessionId} ORDER BY created_at ASC LIMIT 10`;
          const historyText = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
          const profile = await getUserProfile(context.profileId);
          const profileText = profile ? JSON.stringify(profile, null, 2) : 'No profile data saved.';

          const resolvedName = name || (context.profileName !== 'Self' ? context.profileName : 'Not Provided');

          const emailBody = `New Lead Captured!

--- LEAD DETAILS ---
Name: ${resolvedName}
Phone: ${phone}
Query: ${query}

--- CONTEXT ---
User Login ID: ${context.userId}
Profile Being Discussed: ${context.profileName} (Relation: ${context.profileRelation})

--- FINANCIAL PROFILE ---
${profileText}

--- RECENT CHAT HISTORY ---
${historyText}`;

          // 2. Send email via Resend
          const resend = new Resend(process.env.RESEND_API_KEY);
          const { data, error } = await resend.emails.send({
            from: 'Samaira Chatbot <onboarding@resend.dev>',
            to: "pinewoodarchit@gmail.com",
            subject: "New Callback Request from Chatbot Lead",
            text: emailBody,
          });

          if (error) {
            throw new Error(error.message);
          }

          logger.info('Email sent via Resend: %s', data?.id);

          return "Successfully captured lead. The marketing team has been notified and the details are saved.";
        } catch (error: any) {
          logger.error('Failed to capture lead', { error: error.message });
          return `Error capturing lead: ${error.message}`;
        }
      },
    },

    export_plan: {
      description: 'Export and email the user\'s financial plan as a PDF.',
      parameters: z.object({
        email: z.string().email().describe('The email address to send the PDF to')
      }),
      execute: async ({ email }: { email: string }) => {
        logger.info('Tool call: export_plan', { email });
        try {
          const profile = await getUserProfile(context.profileId);
          if (!profile || Object.keys(profile).length === 0) {
            return "Cannot export plan: profile is empty. Please collect their financial details first.";
          }

          const strategy = generateStrategy(profile);

          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage();
          const { width, height } = page.getSize();
          
          const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

          let yPos = height - 50;
          let currentPage = page;

          const checkPage = (requiredSpace: number) => {
            if (yPos - requiredSpace < 50) {
              currentPage = pdfDoc.addPage();
              yPos = height - 50;
            }
          };

          const drawText = (text: string, font: any, size: number, indent: number = 50) => {
            const words = text.split(' ');
            let line = '';
            for (let word of words) {
              if ((line + word).length > 80) { // basic wrapping
                checkPage(size + 10);
                currentPage.drawText(line, { x: indent, y: yPos, size, font, color: rgb(0, 0, 0) });
                yPos -= (size + 5);
                line = word + ' ';
              } else {
                line += word + ' ';
              }
            }
            if (line.trim().length > 0) {
                checkPage(size + 10);
                currentPage.drawText(line.trim(), { x: indent, y: yPos, size, font, color: rgb(0, 0, 0) });
                yPos -= (size + 5);
            }
            yPos -= 5;
          };

          drawText(`Octaraa Financial Plan`, fontBold, 24);
          yPos -= 10;
          drawText(`Prepared for: ${context.profileName}`, fontRegular, 14);
          yPos -= 30;

          drawText('Profile Summary', fontBold, 16);
          yPos -= 5;
          drawText(`Dependents: ${profile.dependents_count || 0}`, fontRegular, 12);
          drawText(`Monthly Income: Rs. ${profile.family_monthly_income?.toLocaleString('en-IN') || 0}`, fontRegular, 12);
          drawText(`Monthly Surplus: Rs. ${profile.monthly_surplus?.toLocaleString('en-IN') || 0}`, fontRegular, 12);
          drawText(`Risk Appetite: ${profile.risk_appetite || 'Not specified'}`, fontRegular, 12);
          yPos -= 20;

          drawText('Actionable Strategy', fontBold, 16);
          yPos -= 5;

          if (strategy.issues.length > 0) {
            drawText('Areas to Address:', fontBold, 12);
            strategy.issues.forEach(issue => drawText(`• ${issue}`, fontRegular, 12, 70));
            yPos -= 10;
          }

          if (strategy.recommendations.length > 0) {
            drawText('Recommendations:', fontBold, 12);
            strategy.recommendations.forEach(rec => drawText(`• ${rec}`, fontRegular, 12, 70));
            yPos -= 10;
          }

          if (strategy.goalStrategies.length > 0) {
            drawText('Goal Strategies:', fontBold, 12);
            strategy.goalStrategies.forEach(g => drawText(`• ${g}`, fontRegular, 12, 70));
          }

          const pdfBytes = await pdfDoc.save();
          const base64Pdf = Buffer.from(pdfBytes).toString('base64');

          const resend = new Resend(process.env.RESEND_API_KEY);
          const { data, error } = await resend.emails.send({
            from: 'Octaraa Assistant <onboarding@resend.dev>',
            to: email,
            subject: `Your Octaraa Financial Plan - ${context.profileName}`,
            text: `Hi there,\n\nPlease find attached the personalized financial plan for ${context.profileName}.\n\nBest,\nSamaira (Octaraa Wealth Assistant)`,
            attachments: [
              {
                filename: `Octaraa_Plan_${context.profileName.replace(/\s+/g, '_')}.pdf`,
                content: base64Pdf,
              },
            ],
          });

          if (error) throw new Error(error.message);

          return `Successfully generated the PDF plan and emailed it to ${email}.`;
        } catch (err: any) {
          logger.error('Failed to export plan', { error: err.message });
          return `Failed to export plan: ${err.message}`;
        }
      }
    }
  };
}
