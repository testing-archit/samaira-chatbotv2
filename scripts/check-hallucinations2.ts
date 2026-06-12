import { Pinecone } from '@pinecone-database/pinecone';
import { model } from '../src/lib/model';

async function main() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
  const index = pc.Index('octaraa-kb');
  
  const query = "Smart Tax Harvesting Family Wealth Dashboard";
  const { embedding } = await model.embed(query);

  const queryResponse = await index.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true
  });

  console.log(JSON.stringify(queryResponse.matches, null, 2));
}

main().catch(console.error);
