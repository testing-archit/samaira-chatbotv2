import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { model } from './src/lib/model';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

async function run() {
  const query = "How does Octaraa help families?";
  const { embedding } = await model.embed(query);
  const index = pc.Index('octaraa-kb');

  const queryResponse = await index.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true,
    filter: { kb: 'octaraa' }
  });

  const matches = queryResponse.matches.map(m => m.score || 0);
  console.log("Scores:", matches);
}

run().catch(console.error);
