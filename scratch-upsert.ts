import { Pinecone } from '@pinecone-database/pinecone';
import { model } from './src/lib/model';

async function run() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
  const index = pc.Index('octaraa-kb-v2');
  
  const content = "FAQ - Where is Octaraa based? What is the headquarters location?\nOctaraa is headquartered at Building No. 44, Ground Floor, Sector-32, Gurgaon, Sadar Bazar, Haryana, India, 122001.";
  console.log("Embedding...");
  const { embedding } = await model.embed(content);
  
  console.log("Upserting...");
  const vectors = [{
    id: `octaraa-faq-location-${Date.now()}`,
    values: Array.isArray(embedding[0]) ? embedding[0] : embedding,
    metadata: {
      content,
      source_url: "https://octaraa.com/faq",
      kb: 'octaraa'
    }
  }];
  await index.upsert(vectors);
  console.log("Done!");
}

run().catch(console.error);
