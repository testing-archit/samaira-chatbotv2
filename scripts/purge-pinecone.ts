import { Pinecone } from '@pinecone-database/pinecone';

async function main() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
  console.log("Deleting index octaraa-kb...");
  await pc.deleteIndex('octaraa-kb');
  console.log("Index deleted.");
}

main().catch(console.error);
