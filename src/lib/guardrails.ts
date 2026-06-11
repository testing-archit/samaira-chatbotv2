import { config } from './config';
import { logger } from './logger';

// Output guardrail patterns – phrases that must never appear verbatim
const BANNED_OUTPUT_PHRASES = [
  /guarantee(d)?\s+return(s)?/i,
  /assured\s+return(s)?/i,
  /risk[\s-]?free\s+(return|investment)/i,
  /100%\s+safe/i,
  /no\s+risk/i,
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
      // Note: disclaimer is handled by the UI layer, not appended here
    }

    return sanitized;
  },
};
