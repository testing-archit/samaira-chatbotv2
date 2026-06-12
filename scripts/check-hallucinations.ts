import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function main() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
  const index = pc.Index('octaraa-kb');
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  
  const query = "Smart Tax Harvesting Family Wealth Dashboard";
  const result = await model.embedContent(query);
  const embedding = result.embedding.values;

  const queryResponse = await index.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true
  });

  console.log(JSON.stringify(queryResponse.matches, null, 2));
}

main().catch(console.error);
