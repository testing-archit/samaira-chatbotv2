import { guardrails, checkReconciliationGap } from '@/lib/guardrails';
import { tracer } from '@/lib/tracer';
import { logger } from '@/lib/logger';
import { getTools } from '@/lib/tools';
import { config } from '@/lib/config';
import { sql } from '@/lib/db';
import { getCuratedAnswer } from '@/lib/curated-answers';

export const preferredRegion = 'bom1'; // Deploy to Mumbai for low latency
export const maxDuration = 60; // Allow up to 60 seconds for LLM responses

const GEMINI_BASE = 'https://openrouter.ai/api/v1';

// OpenAI-compatible tool definitions
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_octaraa_knowledge',
      description: 'Search the Octaraa product knowledge base. Use this to answer questions about Octaraa features, FAQs, financial planning blogs, psychology of investing, or anything about the Octaraa platform.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'The search query about Octaraa features, FAQs, or blogs' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_finance_education',
      description: 'Search the finance education knowledge base. Use this to answer general personal finance questions (e.g. FD vs MF, SIP, NPS, ELSS, insurance), as well as questions about Mutual Fund Distributors (MFDs), SEBI regulatory compliance, advertising rules, and financial exams (NISM).',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'The personal finance question or topic' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_competitor',
      description: 'Compare Octaraa against a specific Indian competitor like Groww, INDmoney, Zerodha, ET Money, Kuvera, Paytm Money, Angel One, Dhan, smallcase, Scripbox, Dezerv, Cube Wealth, or 1 Finance.',
      parameters: {
        type: 'object',
        properties: { competitor: { type: 'string', description: 'The name of the competitor' } },
        required: ['competitor'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_profile',
      description: 'Get the current saved user profile. Call this to see what information slots are already filled.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_profile',
      description: 'Update the user profile with new slot values collected from the conversation. Call this as soon as the user provides any financial or family info.',
      parameters: {
        type: 'object',
        properties: {
          dependents_count: { type: 'number', description: 'Number of financial dependents' },
          earning_members: { type: 'number', description: 'Number of earning family members' },
          family_monthly_income: { type: 'number', description: 'Total monthly family income in INR' },
          monthly_surplus: { type: 'number', description: 'Monthly surplus after all expenses in INR' },
          liabilities: { type: 'number', description: 'Total outstanding liabilities/loans in INR' },
          emergency_fund_months: { type: 'number', description: 'How many months of expenses are in emergency fund' },
          emergency_fund_amount: { type: 'number', description: 'Absolute amount of emergency fund in INR' },
          current_investments: { type: 'number', description: 'Total amount of existing investments in INR' },
          has_term_insurance: { type: 'boolean', description: 'Whether the user has term life insurance' },
          term_cover: { type: 'number', description: 'Term insurance cover amount in INR' },
          has_health_insurance: { type: 'boolean', description: 'Whether the user has family health insurance' },
          risk_appetite: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Investment risk appetite' },
          tax_regime: { type: 'string', enum: ['old', 'new'], description: 'Income tax regime' },
          age: { type: 'number', description: 'Age of the primary earner' },
          goals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                target_amount: { type: 'number' },
                horizon_years: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_strategy',
      description: 'Generate a personalised financial strategy based on the current user profile. Run this once enough data slots (income, surplus, risk, goals) are filled.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'financial_calculator',
      description: 'Calculate exact SIP future values, lumpsum compound interest, loan EMI payments, or emergency fund gaps mathematically. DO NOT guess math, always use this tool. Use type=emergency_fund to compute a one-time top-up gap (NOT a monthly SIP).',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['sip', 'lumpsum', 'emi', 'college_cost', 'step_up_sip', 'target_sip', 'cost_of_delay', 'fd', 'rd', 'swp', 'cagr', 'retirement', 'ppf', 'ssy', 'income_tax', 'emergency_fund', 'menu'], description: 'Type of calculation. Use emergency_fund to compute the one-time top-up gap.' },
          principal: { type: 'number', description: 'Monthly amount, lumpsum amount, loan principal, current cost, or monthly_expenses for emergency_fund' },
          rate: { type: 'number', description: 'Annual interest rate percentage (e.g. 12 for 12%), or current_emergency_fund_amount in INR for emergency_fund type' },
          years: { type: 'number', description: 'Time horizon in years, or target_months for emergency_fund type' },
          inflation_rate: { type: 'number', description: 'Inflation rate percentage' },
          step_up_rate: { type: 'number', description: 'Annual increase percentage for SIPs' },
          target_amount: { type: 'number', description: 'Target corpus amount' },
          withdrawal_amount: { type: 'number', description: 'Monthly withdrawal amount for SWP' },
          delay_years: { type: 'number', description: 'Years of delay for cost_of_delay' },
          final_amount: { type: 'number', description: 'Final corpus for CAGR' }
        },
        required: ['type']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reconcile_plan',
      description: 'MANDATORY after computing SIPs for multiple goals. Sums all goal SIPs against monthly surplus, checks feasibility, and reallocates proportionally if over-budget. Also surfaces the emergency fund gap as a one-time top-up (NOT monthly). Call this before writing any multi-goal financial plan response.',
      parameters: {
        type: 'object',
        properties: {
          monthly_surplus: { type: 'number', description: "User's monthly surplus in INR" },
          goal_sips: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Goal name (e.g. House, Retirement, Vacation)' },
                monthly_sip: { type: 'number', description: 'Monthly SIP computed for this goal' },
              },
              required: ['name', 'monthly_sip'],
            },
            description: 'Array of goals with their computed monthly SIP amounts',
          },
          emergency_fund_gap_oneoff: { type: 'number', description: 'One-time emergency fund shortfall in INR. Pass 0 if already funded.' },
        },
        required: ['monthly_surplus', 'goal_sips'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_callback',
      description: 'Capture user contact details and query to have a representative call them back. Use this when the user needs more help, asks to speak to a human, asks for support contact details, or asks a question the system cannot answer. If they are not logged in, you must ask for their phone number before calling this tool (or call it with just the query if they are asking for an email immediately). DO NOT invent/hallucinate a phone number.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the user (if provided, otherwise leave empty)' },
          phone: { type: 'string', description: 'Phone number of the user. Only optional if user is logged in.' },
          query: { type: 'string', description: 'The specific question or reason they want a callback' }
        },
        required: ['query']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_plan',
      description: 'Generate and email the user\'s personalized financial plan as a PDF document. EXTREMELY IMPORTANT: DO NOT use this tool unless the user EXPLICITLY asks to export, download, email, or generate a PDF. NEVER use this tool just to answer a question, read their profile, or summarize what you know about them.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'The email address to send the PDF to' }
        },
        required: ['email']
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Samaira, an intelligent and empathetic AI wealth-management assistant for Octaraa. You are the SUPERVISOR AGENT.

YOUR GOAL:
- Greet users warmly.
- Route user queries to the correct tool (Agent).
- Collect financial profiles (income, goals, dependents) to generate strategies.
- Handle unknown AMCs or entities gracefully by offering alternatives and capturing leads.

ROUTING RULES (MANDATORY):
- When a user asks about Octaraa (including its location, headquarters, founders, details, features, policy, FAQ, financial planning blogs, psychology of investing, or any platform-specific topics), call 'search_octaraa_knowledge'.
- When a user asks a general personal finance question (e.g. FD vs MF, SIP basics), MFD query, or SEBI compliance query, call 'search_finance_education'.
- When a user asks about a competitor, call 'compare_competitor'.
- When a user asks for a calculation (SIP, Lumpsum, EMI, Step-Up SIP, SWP, PPF, SSY, Retirement, Income Tax, etc.) OR just asks to "open" a specific calculator, call 'financial_calculator' IMMEDIATELY. Do NOT ask for the numbers first.
- If a user generically asks to "open a calculator" without specifying which one, call 'financial_calculator' with type 'menu'.
- When a user explicitly asks to export, download, email, or generate a PDF of their financial plan, call 'export_plan'.
- When a user asks a finance-related question, asks for a product like a home loan, or asks about an entity/AMC that you or the system do not know the answer to:
  1. Do not say "I don't have the ability". Instead, directly state that an Octaraa representative or wealth expert can assist them further with this request.
  2. If it is about an AMC, provide a list of the top 5 AMCs in India.
  3. Politely ask if they would like to leave their contact details (phone number and query) so an Octaraa representative or wealth expert can call them back to help with their query.
  4. If they provide their contact details, call 'request_callback'.
- When a user at ANY time explicitly asks for more help, wants to speak to a human, asks for support contact details, or provides their contact information for a callback, you MUST acknowledge them, provide the contact info if relevant, and IMMEDIATELY call 'request_callback' with their query. DO NOT wait for them to provide a phone number, you can call it without a phone number. Do NOT ask for their name if you already know it from the context.

MULTI-GOAL PLANNING WORKFLOW (MANDATORY — P0):
- When the user asks for a plan covering multiple financial goals (e.g. House + Retirement + Vacation + Emergency Fund):
  1. Call 'financial_calculator' (type='emergency_fund') FIRST to compute the emergency fund as a ONE-TIME top-up gap, NOT a monthly SIP. Pass: principal=monthly_expenses, rate=current_emergency_fund_amount (from profile, or 0 if unknown), years=target_months (default 6).
  2. Call 'financial_calculator' (type='target_sip' or 'sip') for each remaining goal separately.
  3. After ALL calculator calls are complete, you MUST call 'reconcile_plan' with the user's monthly_surplus and the array of goal SIPs. Pass the emergency_fund_gap_oneoff value from step 1.
  4. Only AFTER 'reconcile_plan' returns, write your final answer using the RECONCILED numbers (not the raw calculator outputs). Never write a multi-goal table without calling reconcile_plan first.

SUPERVISOR RULES:
- IMPORTANT: When you call a tool, that tool returns a FULLY WRITTEN AND SYNTHESIZED RESPONSE.
- YOU MUST RETURN THE EXACT, WORD-FOR-WORD RESPONSE RETURNED BY THE TOOL. Do not summarize it. Do not evaluate if it is on-topic. Just output exactly what the tool gave you.
- If the user asks about CLEARLY unrelated topics (e.g., politics, movies) AND you did not call a tool, politely explain that you only handle family wealth and personal finance.
- CRITICAL ENGAGEMENT: When you are NOT calling a tool, ALWAYS end your message with a warm, engaging question to guide them toward financial planning or trying out Octaraa's features.

PROFILING WORKFLOW (FOLLOW STRICTLY):
1. When a user asks for a financial plan or strategy, DO NOT ask for consent. Just ask for: earning members, dependents, monthly income, monthly surplus, financial goals.
2. As each piece of info is given, call update_profile IMMEDIATELY to persist it.
3. Once you have income, surplus, and at least one goal, call generate_strategy to build their plan.
4. Present the strategy in a clear, structured, encouraging way.

DPDP CONSENT (P2 — MANDATORY before request_callback):
- Before calling 'request_callback', you MUST first obtain the user's explicit consent. Say: "Before I share your details with our team, may I confirm that you're happy for Octaraa to contact you at the number/email you provided?" Only call 'request_callback' after the user says yes or equivalent confirmation.`;

async function callGemini(messages: any[], stream: boolean) {
  const res = await fetch(`${GEMINI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b:free',
      models: [
        'openai/gpt-oss-20b:free',
        'google/gemma-4-31b-it:free',
      ],
      route: 'fallback',
      messages,
      tools,
      tool_choice: 'auto',
      stream,
      temperature: 0.05,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  return res;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let messages: any[] = body.messages;

    // Filter out empty assistant messages to prevent OpenRouter 400 errors
    messages = messages.filter(m => !(m.role === 'assistant' && !m.content && (!m.toolInvocations || m.toolInvocations.length === 0)));

    // Optimize Chat Memory: Limit the message history to the last 10 messages
    // to preserve context window, minimize latency, and reduce API token usage.
    const MAX_HISTORY = 10;
    if (messages.length > MAX_HISTORY) {
      messages = messages.slice(-MAX_HISTORY);
    }

    const user_id = body.user_id || 'anon_' + Math.random().toString(36).substring(2, 9);
    const profile_id = body.profile_id || user_id; // fallback for backwards compat
    const profile_name = body.profile_name || 'Self';
    const profile_relation = body.profile_relation || 'self';
    const session_id = body.session_id || 'sess_' + Math.random().toString(36).substring(2, 9);

    // ── Observability: generate a trace ID for this entire turn ──────────────
    // Every log line within this turn will include traceId so you can grep
    // a complete picture of any single conversation turn end-to-end.
    const traceId = crypto.randomUUID();
    const turnStartMs = Date.now();

    const latestMessage = messages[messages.length - 1];

    // Ensure user exists in the DB
    await sql`
      INSERT INTO users (id)
      VALUES (${user_id})
      ON CONFLICT (id) DO NOTHING
    `;

    // Ensure session exists in the DB
    await sql`
      INSERT INTO sessions (id, user_id) 
      VALUES (${session_id}, ${user_id}) 
      ON CONFLICT (id) DO NOTHING
    `;

    // Apply input guardrails BEFORE persisting to DB (blocked messages must never be saved)
    if (latestMessage?.role === 'user') {
      try {
        latestMessage.content = guardrails.filterInput(latestMessage.content);
      } catch (err: any) {
        return new Response(err.message, { status: 400 });
      }
    }

    // Insert the sanitized user message into DB
    const userMessageId = latestMessage.id || ('msg_' + Math.random().toString(36).substring(2, 9));
    await sql`
      INSERT INTO messages (id, session_id, role, content)
      VALUES (${userMessageId}, ${session_id}, 'user', ${latestMessage.content})
      ON CONFLICT (id) DO NOTHING
    `;

    // Intercept with curated answers to avoid latency, rate limits and guarantee precision
    const curatedStartMs = Date.now();
    const curated = getCuratedAnswer(latestMessage.content);
    if (curated) {
      tracer.curatedHit({
        traceId,
        userId: user_id,
        sessionId: session_id,
        latency_ms: Date.now() - curatedStartMs,
        query: latestMessage.content.substring(0, 80),
      });
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (type: string, data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
          };
          try {
            const aiMessageId = 'msg_' + Math.random().toString(36).substring(2, 9);
            sendEvent('message_id', aiMessageId);
            
            // P1 FIX: Route curated answers through filterOutput so the
            // guaranteed-returns rewrite and BANNED_OUTPUT_PHRASES apply to
            // static dict entries too (previously bypassed the guardrail entirely).
            const { text: safeCurated, requiresDisclaimer: curatedDisclaimer } = guardrails.filterOutput(curated);
            if (curatedDisclaimer) {
              sendEvent('requires_disclaimer', true);
            }
            
            // Stream the text chunk-by-chunk for smooth UI experience
            const words = safeCurated.split(' ');
            for (let i = 0; i < words.length; i++) {
              sendEvent('text', (i === 0 ? '' : ' ') + words[i]);
              await new Promise(r => setTimeout(r, 8));
            }
            
            // Insert Assistant Message into DB
            await sql`
              INSERT INTO messages (id, session_id, role, content, requires_disclaimer)
              VALUES (${aiMessageId}, ${session_id}, 'assistant', ${safeCurated}, ${curatedDisclaimer})
            `;
            controller.close();
          } catch (error: any) {
            controller.error(error);
          }
        }
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }


    const toolsImpl = getTools({
      sessionId: session_id,
      profileId: profile_id,
      userId: user_id,
      profileName: profile_name,
      profileRelation: profile_relation,
    });

    // Inject active profile context into system prompt
    const contextualSystemPrompt = `${SYSTEM_PROMPT}\n\nCURRENT CONTEXT: You are advising the user about their family member: ${profile_name} (Relation: ${profile_relation}). If Relation is 'self', the user's name is ${profile_name}. All financial data you collect or update using tools will be saved to this specific profile. Address them appropriately.`;

    // Build OpenAI-format history with system prompt
    const openaiMessages: any[] = [
      { role: 'system', content: contextualSystemPrompt },
      ...messages.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
        };

        try {
          let keepGenerating = true;
          let stepCount = 0;
          // P1 FIX: Raised from 6 → 8 to accommodate 4×financial_calculator +
          // 1×reconcile_plan + 1×final_text without hitting the cap prematurely.
          const MAX_STEPS = 8;
          const sentToolIds = new Set<string>(); // guard: never emit the same toolCallId twice
          // Track tool names called THIS turn for the reconciliation circuit-breaker
          const thisRoundToolNames: string[] = [];

          // ── Observability: per-turn accumulators ─────────────────────────
          let totalPromptTokens = 0;
          let totalCompletionTokens = 0;
          const toolCallLog: Array<{ step: number; tool: string; latency_ms: number }> = [];

          logger.info('[Trace] Turn start', {
            traceId,
            userId: user_id,
            sessionId: session_id,
            profileId: profile_id,
            query: latestMessage.content.substring(0, 120),
          });

          while (keepGenerating && stepCount < MAX_STEPS) {
            stepCount++;

            // Non-streaming for tool-call steps; streaming for the final text response
            // We'll use non-streaming for agentic loop to keep it simple, stream the final step
            const isLastKnownStep = stepCount > 1; // heuristic: stream after first tool call

            const llmStartMs = Date.now();
            const res = await callGemini(openaiMessages, false);
            const completion = await res.json();
            const llmLatencyMs = Date.now() - llmStartMs;

            // Accumulate token usage (OpenRouter returns usage on every non-streaming call)
            if (completion.usage) {
              totalPromptTokens += completion.usage.prompt_tokens ?? 0;
              totalCompletionTokens += completion.usage.completion_tokens ?? 0;
            }

            const choice = completion.choices[0];
            const assistantMessage = choice.message;

            tracer.llmCall({
              traceId,
              step: stepCount,
              latency_ms: llmLatencyMs,
              model: completion.model ?? 'unknown',
              finish_reason: choice.finish_reason,
              prompt_tokens: completion.usage?.prompt_tokens ?? null,
              completion_tokens: completion.usage?.completion_tokens ?? null,
            });

            // Add assistant turn to history
            openaiMessages.push(assistantMessage);

            const toolCalls = assistantMessage.tool_calls;

            if (toolCalls && toolCalls.length > 0) {
              // Execute all tool calls
              for (const toolCall of toolCalls) {
                const toolName = toolCall.function.name;
                let toolArgs: any = {};
                try {
                  toolArgs = JSON.parse(toolCall.function.arguments || '{}');
                } catch (_) {}

                const eventId = toolCall.id || `tool-${stepCount}-${toolName}`;
                if (!sentToolIds.has(eventId)) {
                  sentToolIds.add(eventId);
                  thisRoundToolNames.push(toolName); // track for circuit-breaker
                  sendEvent('tool_call', {
                    toolCallId: eventId,
                    toolName,
                    args: toolArgs,
                  });
                }

                const toolImpl = (toolsImpl as any)[toolName];
                let toolResult = 'Tool not found.';
                if (toolImpl && typeof toolImpl.execute === 'function') {
                  const toolStartMs = Date.now();
                  try {
                    toolResult = await toolImpl.execute(toolArgs);
                    const toolLatencyMs = Date.now() - toolStartMs;
                    toolCallLog.push({ step: stepCount, tool: toolName, latency_ms: toolLatencyMs });
                    tracer.toolCall({ traceId, step: stepCount, tool: toolName, latency_ms: toolLatencyMs });
                  } catch (err: any) {
                    const toolLatencyMs = Date.now() - toolStartMs;
                    tracer.toolError({ traceId, step: stepCount, tool: toolName, latency_ms: toolLatencyMs, error: err.message });
                    toolResult = `SYSTEM ERROR: ${err.message}. YOU MUST TELL THE USER YOU ENCOUNTERED A TECHNICAL ERROR AND CANNOT PROCEED WITH THIS ACTION.`;
                  }
                } else {
                  toolResult = `Error: Tool '${toolName}' does not exist or was removed.`;
                  tracer.unknownTool({ traceId, step: stepCount, tool: toolName });
                }

                openaiMessages.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: String(toolResult),
                });
              }
              // Continue loop to get the next response
            } else {
              // No tool calls — this is the final text response
              let finalText = assistantMessage.content || '';
              
              if (!finalText.trim() && stepCount > 1) {
                finalText = "Action completed successfully.";
              }

              // Apply output guardrails
              const { text: safeFinalText, requiresDisclaimer } = guardrails.filterOutput(finalText);

              // P0 Circuit-Breaker: if response has a multi-goal plan table but
              // reconcile_plan was NOT called this turn, loop back to Supervisor.
              if (checkReconciliationGap(safeFinalText, thisRoundToolNames)) {
                tracer.circuitBreaker({ traceId, step: stepCount, tools_this_turn: thisRoundToolNames });
                openaiMessages.push({
                  role: 'user',
                  content: 'SYSTEM GUARDRAIL: Your response contains a multi-goal financial plan table, but you did not call reconcile_plan this turn. You MUST call reconcile_plan now (pass monthly_surplus and all goal SIPs) before writing your final answer. Do not stream anything yet.',
                });
                // Continue loop — do NOT set keepGenerating = false
                continue;
              }

              keepGenerating = false;
              if (safeFinalText !== finalText) {
                tracer.outputGuardrail({
                  traceId,
                  step: stepCount,
                  original_length: finalText.length,
                  sanitized_length: safeFinalText.length,
                });
                finalText = safeFinalText;
              }

              // Generate Assistant Message ID and send it first
              const aiMessageId = 'msg_' + Math.random().toString(36).substring(2, 9);
              sendEvent('message_id', aiMessageId);
              
              if (requiresDisclaimer) {
                sendEvent('requires_disclaimer', true);
              }

              // Stream the final text chunk by chunk for a smooth UI experience
              const words = finalText.split(' ');
              for (let i = 0; i < words.length; i++) {
                sendEvent('text', (i === 0 ? '' : ' ') + words[i]);
                // Small delay to simulate streaming
                await new Promise(r => setTimeout(r, 8));
              }

              // Insert Assistant Message into DB
              const allToolCalls = openaiMessages
                .filter((m: any) => m.role === 'assistant' && m.tool_calls)
                .flatMap((m: any) => m.tool_calls.map((tc: any) => {
                  try {
                    return {
                      toolCallId: tc.id,
                      toolName: tc.function.name,
                      args: JSON.parse(tc.function.arguments || '{}')
                    };
                  } catch(e) { return null; }
                })).filter(Boolean);

              try {
                await sql`
                  INSERT INTO messages (id, session_id, role, content, tool_calls, requires_disclaimer)
                  VALUES (${aiMessageId}, ${session_id}, 'assistant', ${finalText}, ${JSON.stringify(allToolCalls)}, ${requiresDisclaimer})
                `;
              } catch (err: any) {
                logger.error('Failed to save AI message to DB', { error: err.message });
              }
            }
          }

          if (keepGenerating && stepCount >= MAX_STEPS) {
            // We hit the step limit but never sent a final text response.
            // Send a human-friendly fallback so the UI doesn't hang in a 'Failed' state.
            const fallbackText = "I'm having a bit of trouble completing this full calculation in one go — it involved more steps than I could process together. Let me connect you with an Octaraa wealth expert who can work through all the details with you personally. Would you like me to arrange a callback?";
            const aiMessageId = 'msg_' + Math.random().toString(36).substring(2, 9);
            sendEvent('message_id', aiMessageId);
            
            const words = fallbackText.split(' ');
            for (let i = 0; i < words.length; i++) {
              sendEvent('text', (i === 0 ? '' : ' ') + words[i]);
              await new Promise(r => setTimeout(r, 8));
            }
            
            // Insert Assistant Message into DB
            const allToolCalls = openaiMessages
              .filter((m: any) => m.role === 'assistant' && m.tool_calls)
              .flatMap((m: any) => m.tool_calls.map((tc: any) => {
                try {
                  return {
                    toolCallId: tc.id,
                    toolName: tc.function.name,
                    args: JSON.parse(tc.function.arguments || '{}')
                  };
                } catch(e) { return null; }
              })).filter(Boolean);

            try {
              await sql`
                INSERT INTO messages (id, session_id, role, content, tool_calls, requires_disclaimer)
                VALUES (${aiMessageId}, ${session_id}, 'assistant', ${fallbackText}, ${JSON.stringify(allToolCalls)}, false)
              `;
            } catch (err: any) {
              logger.error('Failed to save fallback AI message to DB', { error: err.message });
            }
          }

          controller.close();

          // ── Observability: Turn summary ────────────────────────────────────
          const totalTokens = totalPromptTokens + totalCompletionTokens;
          const estimatedCostUsd = (totalTokens / 1_000_000) * 0.50;
          tracer.turnEnd({
            traceId,
            userId: user_id,
            sessionId: session_id,
            total_latency_ms: Date.now() - turnStartMs,
            steps: stepCount,
            tools_called: toolCallLog,
            prompt_tokens: totalPromptTokens,
            completion_tokens: totalCompletionTokens,
            total_tokens: totalTokens,
            estimated_cost_usd: +estimatedCostUsd.toFixed(6),
          });

        } catch (error: any) {
          logger.error('Stream error in chat route', { error: error.message });
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    logger.error('Error in chat route', { error: error.message });
    return new Response(error.message || String(error), { status: 500 });
  }
}
