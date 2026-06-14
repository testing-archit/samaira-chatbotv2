import { config } from './config';
import { logger } from './logger';

// Output guardrail patterns – phrases that must never appear verbatim
// We use negative lookbehinds so we don't trip our own compliance disclaimers
// like "not a guarantee of future results" or "no investment product can guarantee returns"
const BANNED_OUTPUT_PHRASES = [
  /(?<!cannot\s+|can\s+not\s+|never\s+|not\s+a\s+|no\s+.*product\s+can\s+)guarantee(d)?\s+return(s)?/i,
  /(?<!cannot\s+|can\s+not\s+|never\s+|not\s+a\s+|no\s+.*product\s+can\s+)assured\s+return(s)?/i,
  /(?<!not\s+a\s+)risk[\s-]?free\s+(return|investment)/i,
  /100%\s+safe/i,
  /(?<!there\s+is\s+|with\s+)no\s+risk(?!\s+of\s+making\s+uninformed)/i,
  /double(s)?\s+your\s+money\s+in\s+\d+\s+days/i,
  /get\s+rich\s+quick/i,
];

// Input adversarial patterns
const ADVERSARIAL_INPUT_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /forget\s+your\s+system\s+prompt/i,
  /pretend\s+you\s+are\s+(not\s+)?an?\s+ai/i,
  /act\s+as\s+(if\s+you\s+are\s+)?an?\s+unrestricted/i,
  /jailbreak/i,
  /override\s+(your\s+)?(instructions|guidelines)/i,
];

// In educational mode, avoid recommending specific instruments directly by name
const SPECIFIC_STOCK_REGEX = /\b(buy|sell|invest\s+in)\s+([A-Z0-9-]+\s+stock|ETF)\b/i;

export const guardrails = {
  filterInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Sanitize length
    if (input.length > 4000) {
      throw new Error('Message too long. Please keep your message under 4000 characters.');
    }

    for (const pattern of ADVERSARIAL_INPUT_PATTERNS) {
      if (pattern.test(input)) {
        logger.warn('Guardrail trip: adversarial input detected', { pattern: pattern.toString() });
        throw new Error('I cannot fulfill that request. Please ask me about personal finance or Octaraa\'s features.');
      }
    }

    return input.trim();
  },

  filterOutput(output: string): { text: string; requiresDisclaimer: boolean } {
    if (!output) return { text: output, requiresDisclaimer: false };
    let sanitized = output;
    let requiresDisclaimer = false;

    // In-place rewrite for FD/guaranteed phrasing to avoid contradiction
    sanitized = sanitized.replace(/\b(returns\s+are\s+guaranteed|guarantee(d)?\s+return(s)?)\b/gi, 'the interest rate is fixed by the bank for the tenure');
    sanitized = sanitized.replace(/\b(nearly\s+)?risk[\s-]?free(\s+investment)?\b/gi, 'considered low-risk relative to market-linked instruments');

    for (const regex of BANNED_OUTPUT_PHRASES) {
      if (regex.test(sanitized)) {
        logger.warn('Guardrail trip: banned phrase in output', { match: sanitized.match(regex)?.[0] });
        sanitized = 'All investments carry market risk and past performance is not a guarantee of future results. I can share educational strategies, but cannot guarantee any returns. Please consult a registered financial advisor for specific advice.';
        return { text: sanitized, requiresDisclaimer: true };
      }
    }

    if (config.ADVICE_MODE === 'educational') {
      if (SPECIFIC_STOCK_REGEX.test(sanitized)) {
        logger.warn('Guardrail trip: specific recommendation in educational mode');
        sanitized =
          'I can only provide educational, category-level strategies. For specific scheme or stock recommendations, please connect with a SEBI-registered investment advisor.';
        return { text: sanitized, requiresDisclaimer: true };
      }

      // Only flag for full disclaimer on substantive answers (>200 chars)
      if (sanitized.length > 200) {
        requiresDisclaimer = true;
      }
    }

    // Strip hallucinated disclaimers if the LLM ignores instructions
    sanitized = sanitized.replace(/\*?Disclaimer:[\s\S]*?\*?/gi, '').trim();
    sanitized = sanitized.replace(/\*?Contact:[\s\S]*?\*?/gi, '').trim();
    sanitized = sanitized.replace(/\*?This is not financial advice[\s\S]*?\*?/gi, '').trim();

    // Strip citation markers like 【{"id":0,"cursor":0,"loc":0}】 or 【1】 that some models emit
    sanitized = sanitized.replace(/【.*?】/g, '').trim();

    return { text: sanitized, requiresDisclaimer };
  },
};

/**
 * P0 Circuit-Breaker: checks if the synthesized response contains a multi-goal
 * financial plan table WITHOUT a reconcile_plan call having happened this turn.
 *
 * Detection heuristics (both must be true to fire):
 *  1. The response contains ≥2 "₹X/mo" or "₹X per month" patterns (multi-goal SIP table)
 *  2. OR a "Total" label appears adjacent to a rupee figure
 *
 * Returns true  → guardrail fired, do NOT stream, loop back to Supervisor.
 * Returns false → response is clean, safe to stream.
 */
export function checkReconciliationGap(
  responseText: string,
  thisRoundToolNames: string[]
): boolean {
  // If reconcile_plan was already called this turn, we're good.
  if (thisRoundToolNames.includes('reconcile_plan')) return false;

  // Heuristic 1: ≥2 monthly SIP line items (e.g. ₹15,000/mo or ₹15,000 per month)
  const monthlyAmounts = responseText.match(/₹[\d,]+\s*\/\s*mo(nth)?/gi) ?? [];
  if (monthlyAmounts.length >= 2) {
    logger.warn('[Guardrail] Multi-goal plan detected without reconcile_plan call — looping back.', {
      matchCount: monthlyAmounts.length,
    });
    return true;
  }

  // Heuristic 2: A "Total" row in a markdown table containing a rupee amount
  const hasTotalRow = /\|\s*\*{0,2}total\*{0,2}\s*\|[\s\S]{0,60}₹[\d,]+/i.test(responseText);
  if (hasTotalRow) {
    logger.warn('[Guardrail] Total-row plan table detected without reconcile_plan call — looping back.');
    return true;
  }

  return false;
}

