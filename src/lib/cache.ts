import { sql } from './db';
import * as crypto from 'crypto';

function hashContent(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const retrievalCache = new Map<string, any[]>();
const MAX_CACHE_SIZE = 500; // keep memory bounded on serverless instances

export const cache = {
  async getEmbedding(text: string): Promise<number[] | null> {
    try {
      const hash = hashContent(text);
      const res = await sql`SELECT embedding FROM embedding_cache WHERE content_hash = ${hash} LIMIT 1`;
      if (res.length > 0 && res[0].embedding) {
        let embeddingStr = res[0].embedding;
        if (typeof embeddingStr === 'string') {
          // If vector is returned as a string '[1,2,3]' — strip brackets globally
          embeddingStr = embeddingStr.replace(/[\[\]]/g, '').split(',').map(Number);
        }
        return embeddingStr as number[];
      }
    } catch (e) {
      console.error('Embedding cache read error:', e);
    }
    return null;
  },
  async setEmbedding(text: string, embedding: number[]) {
    try {
      const hash = hashContent(text);
      const formattedEmbedding = `[${embedding.join(',')}]`;
      await sql`
        INSERT INTO embedding_cache (content_hash, embedding)
        VALUES (${hash}, ${formattedEmbedding}::vector)
        ON CONFLICT (content_hash) DO NOTHING
      `;
    } catch (e) {
      console.error('Embedding cache write error:', e);
    }
  },
  getRetrieval(query: string, kbType: string) {
    return retrievalCache.get(`${kbType}:${query}`);
  },
  setRetrieval(query: string, kbType: string, results: any[]) {
    // Evict oldest 10% of entries when at capacity to avoid memory bloat
    if (retrievalCache.size >= MAX_CACHE_SIZE) {
      const evictCount = Math.max(1, Math.floor(MAX_CACHE_SIZE * 0.1));
      const keys = retrievalCache.keys();
      for (let i = 0; i < evictCount; i++) {
        const key = keys.next().value;
        if (key !== undefined) retrievalCache.delete(key);
      }
    }
    retrievalCache.set(`${kbType}:${query}`, results);
  }
};
