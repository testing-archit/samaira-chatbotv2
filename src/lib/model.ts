import pRetry from 'p-retry';
import pLimit from 'p-limit';
import { config } from './config';
import { logger } from './logger';
import { cache } from './cache';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const EMBEDDING_DIMENSIONS = 1536;

const limit = pLimit(config.MAX_CONCURRENCY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
      // Use the native Gemini API for embeddings because OpenRouter free embeddings are failing in production
      const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'models/gemini-embedding-2',
          content: { parts: [{ text: content }] },
          outputDimensionality: EMBEDDING_DIMENSIONS
        })
      });

      if (!result.ok) {
        const errText = await result.text();
        throw new Error(`Gemini embedding error ${result.status}: ${errText}`);
      }

      const data = await result.json();
      const embeddingArray: number[] = data.embedding.values;

      await cache.setEmbedding(content, embeddingArray);
      return { embedding: embeddingArray };
    }, 'embed');
  },
};
