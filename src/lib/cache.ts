const embeddingCache = new Map<string, number[]>();
const retrievalCache = new Map<string, any[]>();

export const cache = {
  getEmbedding(text: string) {
    return embeddingCache.get(text);
  },
  setEmbedding(text: string, embedding: number[]) {
    // Basic LRU logic
    if (embeddingCache.size > 1000) {
      const firstKey = embeddingCache.keys().next().value;
      if (firstKey) embeddingCache.delete(firstKey);
    }
    embeddingCache.set(text, embedding);
  },
  getRetrieval(query: string, kbType: string) {
    return retrievalCache.get(`${kbType}:${query}`);
  },
  setRetrieval(query: string, kbType: string, results: any[]) {
    if (retrievalCache.size > 1000) {
      const firstKey = retrievalCache.keys().next().value;
      if (firstKey) retrievalCache.delete(firstKey);
    }
    retrievalCache.set(`${kbType}:${query}`, results);
  }
};
