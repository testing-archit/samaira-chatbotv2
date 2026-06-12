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

  filterOutput(output: string): string {
    if (!output) return output;
    let sanitized = output;

    for (const regex of BANNED_OUTPUT_PHRASES) {
      if (regex.test(sanitized)) {
        logger.warn('Guardrail trip: banned phrase in output', { match: sanitized.match(regex)?.[0] });
        sanitized = 'All investments carry market risk and past performance is not a guarantee of future results. I can share educational strategies, but cannot guarantee any returns. Please consult a registered financial advisor for specific advice.';
        return sanitized;
      }
    }

    if (config.ADVICE_MODE === 'educational') {
      if (SPECIFIC_STOCK_REGEX.test(sanitized)) {
        logger.warn('Guardrail trip: specific recommendation in educational mode');
        sanitized =
          'I can only provide educational, category-level strategies. For specific scheme or stock recommendations, please connect with a SEBI-registered investment advisor.';
        return sanitized;
      }

      const disclaimerText = '\n\n*Disclaimer: I am Samaira, an AI assistant providing educational information only. This is not financial advice. Please speak to an Octaraa expert for personalized guidance.*';
      const contactText = '\n\n*Contact: connect@octaraa.com | +91 9667708843*';

      if (!sanitized.includes('Disclaimer: I am Samaira')) {
        sanitized += disclaimerText;
      }
      if (!sanitized.includes('connect@octaraa.com')) {
        sanitized += contactText;
      }
    }

    return sanitized;
  },
};
