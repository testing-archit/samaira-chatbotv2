import 'dotenv/config';
import { sql } from '../src/lib/db';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const INDEX_NAME = 'octaraa-kb';

async function main() {
  const chunks = await sql`SELECT id, kb, content, content_hash, embedding, status FROM knowledge_chunks`;
  console.log(`Found ${chunks.length} chunks in Neon DB. Syncing to Pinecone...`);

  const index = pc.Index(INDEX_NAME);
  
  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchChunks = chunks.slice(i, i + batchSize);
    console.log(`Upserting batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}...`);
    
    const vectors = batchChunks.map(chunk => {
      // Parse embedding if it's a string (pgvector returns JSON string sometimes)
      const embedding = typeof chunk.embedding === 'string' ? JSON.parse(chunk.embedding) : chunk.embedding;
      return {
        id: chunk.content_hash || chunk.id,
        values: embedding,
        metadata: {
          kb: chunk.kb,
          content: chunk.content,
          content_hash: chunk.content_hash || chunk.id,
          status: chunk.status || 'live'
        }
      };
    });

    await index.upsert({ records: vectors });
  }
  
  console.log('Successfully synced to Pinecone!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
