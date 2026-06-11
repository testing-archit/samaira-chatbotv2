import 'dotenv/config';
import postgres from 'postgres';
import { model } from '../src/lib/model';

const sql = postgres(process.env.DATABASE_URL as string);

async function main() {
  const query = "Samaira AI helps users";
  console.log(`Querying: ${query}`);
  const { embedding } = await model.embed(query);
  const formattedEmbedding = `[${embedding.join(',')}]`;

  const results = await sql`
      SELECT content, 1 - (embedding <=> ${formattedEmbedding}::vector) as similarity
      FROM knowledge_chunks
      WHERE kb = 'octaraa'
      ORDER BY embedding <=> ${formattedEmbedding}::vector
      LIMIT 5
  `;
  
  console.log("Top 5 Results:");
  results.forEach(r => {
    console.log(`- Similarity: ${r.similarity}`);
    console.log(`  Content: ${r.content.substring(0, 100).replace(/\n/g, ' ')}...`);
  });
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
