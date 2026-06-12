import { Pinecone } from '@pinecone-database/pinecone';

async function main() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
  const index = pc.Index('octaraa-kb');
  const stats = await index.describeIndexStats();
  console.log("Pinecone Index Stats:", JSON.stringify(stats, null, 2));
}

main().catch(console.error);
