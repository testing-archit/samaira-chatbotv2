import pRetry from 'p-retry';
import pLimit from 'p-limit';
import { config } from './config';
import { logger } from './logger';
import { cache } from './cache';

const OPENROUTER_EMBEDDING_MODEL = 'nvidia/llama-nemotron-embed-vl-1b-v2:free';
const OPENROUTER_EMBEDDING_URL = 'https://openrouter.ai/api/v1/embeddings';
export const EMBEDDING_DIMENSIONS = 1536;

const limit = pLimit(config.MAX_CONCURRENCY);

async function withResilience<T>(operation: () => Promise<T>, taskName: string): Promise<T> {
  return limit(() =>
    pRetry(operation, {
      retries: config.RATE_LIMIT_RETRIES,
      minTimeout: 2000,
      maxTimeout: 30000,
      randomize: true,
      onFailedAttempt: (error: any) => {
        logger.warn(`Embedding rate limit or error for ${taskName}. Retrying...`, {
          attempt: error.attemptNumber,
          retriesLeft: error.retriesLeft,
          error: error.message,
        });
      },
    })
  );
}

export const model = {
  embed: async (content: string) => {
    const cached = await cache.getEmbedding(content);
    if (cached) return { embedding: cached };

    return withResilience(async () => {
      const res = await fetch(OPENROUTER_EMBEDDING_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENROUTER_EMBEDDING_MODEL,
          input: content,
          dimensions: 1536,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenRouter embedding error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const embeddingArray: number[] = data.data[0].embedding;

      await cache.setEmbedding(content, embeddingArray);
      return { embedding: embeddingArray };
    }, 'embed');
  },
};
