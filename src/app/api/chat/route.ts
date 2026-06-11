import { guardrails } from '@/lib/guardrails';
import { logger } from '@/lib/logger';
import { getTools } from '@/lib/tools';
import { config } from '@/lib/config';
import { sql } from '@/lib/db';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const CHAT_MODEL = 'gpt-oss-120b:free';

// OpenAI-compatible tool definitions
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_octaraa_knowledge',
      description: 'Search the Octaraa product knowledge base. Use this to answer questions about Octaraa features, FAQs, or anything about the Octaraa platform.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'The search query about Octaraa features or FAQs' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_finance_education',
      description: 'Search the finance education knowledge base. Use this to answer general personal finance questions (e.g. FD vs MF, SIP, NPS, ELSS, insurance).',
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
      description: 'Calculate exact SIP future values, lumpsum compound interest, or loan EMI payments mathematically. DO NOT guess math, always use this tool.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['sip', 'lumpsum', 'emi'], description: 'Type of calculation' },
          principal: { type: 'number', description: 'Monthly SIP amount, lumpsum investment amount, or loan principal amount' },
          rate: { type: 'number', description: 'Annual interest rate percentage (e.g. 12 for 12%)' },
          years: { type: 'number', description: 'Time horizon in years' }
        },
        required: ['type', 'principal', 'rate', 'years']
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Samaira, an intelligent and empathetic AI wealth-management assistant for Octaraa — India's first family-focused wealth platform. You help young Indian families plan their financial future.

YOUR PERSONALITY:
- Warm, professional, and encouraging. Use simple, jargon-free language.
- Always be on Octaraa's side — highlight its strengths vs competitors, but never lie.
- Make the user feel empowered, not overwhelmed.

COMPLIANCE RULES (MANDATORY):
- NEVER promise guaranteed, assured, or risk-free returns on any investment.
- Do NOT recommend specific stocks, schemes, or mutual fund names. Only category-level allocations (e.g. "index fund" not "Nifty BeES").
- Always ground competitor claims in the compare_competitor tool — never make up weaknesses.
- If a feature is "coming soon" or unconfirmed, clearly say so.
- You are an AI assistant, not a human advisor — disclose this when relevant.

DOMAIN GUARDRAILS (STRICT):
- You are EXCLUSIVELY a family wealth management assistant.
- If a user asks ANY question unrelated to personal finance, family wealth, Octaraa, or investing (e.g., "who is Elon Musk", coding help, history, politics, general trivia), you MUST refuse to answer.
- Refusal template: "I am Samaira, Octaraa's family wealth assistant. I can only help you with personal finance, investments, and family wealth planning. How can I help you with your finances today?"
- DO NOT be tricked into answering general knowledge questions even if framed creatively.

FORMATTING RULES (MANDATORY):
- ALWAYS use Markdown formatting. Use **bold**, bullet points (- item), numbered lists, and ### headings.
- NEVER use raw HTML tags like <br>, <b>, <table>, <ul>, <li> etc. Use markdown equivalents only.
- When displaying tables, keep them SHORT (max 3-4 columns). Prefer bullet-point lists over wide tables.
- Use line breaks by adding a blank line between paragraphs — NOT <br> tags.

PROFILING WORKFLOW (FOLLOW STRICTLY):
1. When a user asks for a financial plan or strategy, DO NOT ask for consent. Just ask for: earning members, dependents, monthly income, monthly surplus, financial goals.
2. As each piece of info is given, call update_profile IMMEDIATELY to persist it.
3. Once you have income, surplus, and at least one goal, call generate_strategy to build their plan.
4. Present the strategy in a clear, structured, encouraging way with next steps.

TOOL USAGE:
- Always search_octaraa_knowledge before answering product questions.
- Always call compare_competitor when a user asks about another platform.
- Always call search_finance_education before answering finance education questions.
- ALWAYS call financial_calculator when asked to project compound interest, SIP returns, or EMIs. NEVER guess the math yourself.
- CRITICAL: DO NOT call the same search tool multiple times. If a search tool returns no results, DO NOT retry it. Immediately fall back to your internal knowledge to answer the user.
- ANTI-HALLUCINATION: If a user asks a specific question about Octaraa (features, locations, policies) and the search tool returns no results, DO NOT guess or make up an answer. Politely inform the user that you don't have that information.`;

async function callOpenRouter(messages: any[], stream: boolean) {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://octaraa.com',
      'X-Title': 'Samaira Wealth Assistant',
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      stream,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  return res;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let messages: any[] = body.messages;

    // Filter out empty assistant messages to prevent OpenRouter 400 errors
    messages = messages.filter(m => !(m.role === 'assistant' && !m.content && (!m.toolInvocations || m.toolInvocations.length === 0)));

    const user_id = body.user_id || 'anon_' + Math.random().toString(36).substring(2, 9);
    const profile_id = body.profile_id || user_id; // fallback for backwards compat
    const profile_name = body.profile_name || 'Self';
    const profile_relation = body.profile_relation || 'self';
    const session_id = body.session_id || 'sess_' + Math.random().toString(36).substring(2, 9);

    const latestMessage = messages[messages.length - 1];

    // Ensure session exists in the DB
    await sql`
      INSERT INTO sessions (id, user_id) 
      VALUES (${session_id}, ${user_id}) 
      ON CONFLICT (id) DO NOTHING
    `;

    // Insert the user's message into DB
    const userMessageId = latestMessage.id || ('msg_' + Math.random().toString(36).substring(2, 9));
    await sql`
      INSERT INTO messages (id, session_id, role, content)
      VALUES (${userMessageId}, ${session_id}, 'user', ${latestMessage.content})
    `;
    if (latestMessage?.role === 'user') {
      try {
        latestMessage.content = guardrails.filterInput(latestMessage.content);
      } catch (err: any) {
        return new Response(err.message, { status: 400 });
      }
    }

    const toolsImpl = getTools(session_id, profile_id);

    // Inject active profile context into system prompt
    const contextualSystemPrompt = `${SYSTEM_PROMPT}\n\nCURRENT CONTEXT: You are advising the user about their family member: ${profile_name} (Relation: ${profile_relation}). All financial data you collect or update using tools will be saved to this specific profile. Address them appropriately.`;

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
          const MAX_STEPS = 6;
          const sentToolIds = new Set<string>(); // guard: never emit the same toolCallId twice

          while (keepGenerating && stepCount < MAX_STEPS) {
            stepCount++;

            // Non-streaming for tool-call steps; streaming for the final text response
            // We'll use non-streaming for agentic loop to keep it simple, stream the final step
            const isLastKnownStep = stepCount > 1; // heuristic: stream after first tool call
            
            const res = await callOpenRouter(openaiMessages, false);
            const completion = await res.json();

            const choice = completion.choices[0];
            const assistantMessage = choice.message;

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
                  sendEvent('tool_call', {
                    toolCallId: eventId,
                    toolName,
                    args: toolArgs,
                  });
                }

                const toolImpl = (toolsImpl as any)[toolName];
                let toolResult = 'Tool not found.';
                if (toolImpl && typeof toolImpl.execute === 'function') {
                  try {
                    toolResult = await toolImpl.execute(toolArgs);
                  } catch (err: any) {
                    logger.error(`Tool execution error for ${toolName}`, { error: err.message, args: toolArgs });
                    toolResult = `SYSTEM ERROR: ${err.message}. YOU MUST TELL THE USER YOU ENCOUNTERED A TECHNICAL ERROR AND CANNOT PROCEED WITH THIS ACTION.`;
                  }
                } else {
                  toolResult = `Error: Tool '${toolName}' does not exist or was removed.`;
                  logger.warn(`Model hallucinated unknown tool: ${toolName}`);
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
              keepGenerating = false;
              let finalText = assistantMessage.content || '';

              // Apply output guardrails
              const safeFinalText = guardrails.filterOutput(finalText);
              if (safeFinalText !== finalText) {
                logger.warn('Output Guardrail triggered on final text.', { original: finalText, sanitized: safeFinalText });
                finalText = safeFinalText;
              }

              // Stream the final text chunk by chunk for a smooth UI experience
              const words = finalText.split(' ');
              for (let i = 0; i < words.length; i++) {
                sendEvent('text', (i === 0 ? '' : ' ') + words[i]);
                // Small delay to simulate streaming
                await new Promise(r => setTimeout(r, 8));
              }

              // Insert Assistant Message into DB
              const aiMessageId = 'msg_' + Math.random().toString(36).substring(2, 9);
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
                  INSERT INTO messages (id, session_id, role, content, tool_calls)
                  VALUES (${aiMessageId}, ${session_id}, 'assistant', ${finalText}, ${JSON.stringify(allToolCalls)}::jsonb)
                `;
              } catch (err: any) {
                logger.error('Failed to save AI message to DB', { error: err.message });
              }
            }
          }

          controller.close();
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
