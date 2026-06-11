import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { guardrails } from '@/lib/guardrails';
import { logger } from '@/lib/logger';
import { getTools } from '@/lib/tools';
import { config } from '@/lib/config';
import { sql } from '@/lib/db';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: config.OPENROUTER_API_KEY,
});

const CHAT_MODEL = 'gpt-oss-120b:free';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: any[] = body.messages;

    const user_id = body.user_id || 'anon_' + Math.random().toString(36).substring(2, 9);
    const profile_id = body.profile_id || user_id;
    const profile_name = body.profile_name || 'Self';
    const profile_relation = body.profile_relation || 'self';
    const session_id = body.session_id || 'sess_' + Math.random().toString(36).substring(2, 9);

    const latestMessage = messages[messages.length - 1];

    if (body.user_id) {
      await sql`
        INSERT INTO sessions (id, user_id) 
        VALUES (${session_id}, ${user_id}) 
        ON CONFLICT (id) DO NOTHING
      `;
    } else {
      await sql`
        INSERT INTO sessions (id) 
        VALUES (${session_id}) 
        ON CONFLICT (id) DO NOTHING
      `;
    }

    if (latestMessage && latestMessage.role === 'user') {
      const userMessageId = latestMessage.id || ('msg_' + Math.random().toString(36).substring(2, 9));
      let content = latestMessage.content;
      try {
        content = guardrails.filterInput(content);
      } catch (err: any) {
        return new Response(err.message, { status: 400 });
      }
      
      await sql`
        INSERT INTO messages (id, session_id, role, content)
        VALUES (${userMessageId}, ${session_id}, 'user', ${content})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    const toolsImpl = getTools(session_id, profile_id);

    const contextualSystemPrompt = `${SYSTEM_PROMPT}\n\nCURRENT CONTEXT: You are advising the user about their family member: ${profile_name} (Relation: ${profile_relation}). All financial data you collect or update using tools will be saved to this specific profile. Address them appropriately.`;

    const result = streamText({
      model: openrouter(CHAT_MODEL),
      system: contextualSystemPrompt,
      messages,
      tools: toolsImpl,
      // maxSteps: 6,
      async onFinish({ text, toolCalls, toolResults }) {
        let finalOutput = text;
        
        const safeFinalText = guardrails.filterOutput(finalOutput);
        if (safeFinalText !== finalOutput) {
          logger.warn('Output Guardrail triggered on final text.', { original: finalOutput, sanitized: safeFinalText });
          finalOutput = safeFinalText;
        }

        const aiMessageId = 'msg_' + Math.random().toString(36).substring(2, 9);
        const savedToolCalls = toolCalls ? toolCalls.map(tc => ({
          // @ts-ignore
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          // @ts-ignore
          args: tc.args
        })) : [];

        try {
          await sql`
            INSERT INTO messages (id, session_id, role, content, tool_calls)
            VALUES (${aiMessageId}, ${session_id}, 'assistant', ${finalOutput}, ${JSON.stringify(savedToolCalls)}::jsonb)
          `;
        } catch (err: any) {
          logger.error('Failed to save AI message to DB', { error: err.message });
        }
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    logger.error('Error in chat route', { error: error.message });
    return new Response(error.message || String(error), { status: 500 });
  }
}
