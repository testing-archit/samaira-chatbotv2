import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pinecone } from '@pinecone-database/pinecone';
import { model } from '../src/lib/model';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const INDEX_NAME = 'octaraa-kb';

function hashContent(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function chunkMarkdown(markdown: string, chunkSize = 1000, chunkOverlap = 200): string[] {
  const paragraphs = markdown.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
      const overlapText = currentChunk.slice(overlapStart);
      const firstSpace = overlapText.indexOf(' ');
      const cleanOverlap = firstSpace !== -1 ? overlapText.slice(firstSpace) : overlapText;
      
      currentChunk = cleanOverlap.trim() + '\n\n' + para;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

async function createIndexIfNotExists() {
  const { indexes } = await pc.listIndexes();
  const exists = indexes?.some((i) => i.name === INDEX_NAME);

  if (!exists) {
    console.log(`Creating Pinecone index: ${INDEX_NAME}...`);
    await pc.createIndex({
      name: INDEX_NAME,
      dimension: 1536, // Dimension for openrouter embedding model
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    console.log('Index created successfully. Waiting a few seconds for it to be ready...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } else {
    console.log(`Index ${INDEX_NAME} already exists.`);
  }
}

async function ingestFile(filePath: string, kbType: string) {
  console.log(`Ingesting ${filePath} into ${kbType}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const chunks = chunkMarkdown(content);
  
  const index = pc.Index(INDEX_NAME);
  
  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchChunks = chunks.slice(i, i + batchSize);
    console.log(`Embedding batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}...`);
    
    const vectors = [];
    for (const chunk of batchChunks) {
      const contentHash = hashContent(chunk);
      const { embedding } = await model.embed(chunk);
      
      let status = 'live';
      if (chunk.includes('status: coming_soon') || chunk.includes('`coming_soon`')) status = 'coming_soon';
      if (chunk.includes('status: unconfirmed') || chunk.includes('`unconfirmed`')) status = 'unconfirmed';

      vectors.push({
        id: contentHash, // Use content hash instead of random UUID to prevent duplicate vectors on re-runs
        values: embedding,
        metadata: {
          kb: kbType,
          content: chunk,
          content_hash: contentHash,
          status: status
        }
      });
    }

    console.log(`Upserting ${vectors.length} vectors to Pinecone...`);
    await index.upsert({ records: vectors });
  }
  console.log(`Successfully ingested ${chunks.length} chunks for ${kbType}.`);
}

async function main() {
  await createIndexIfNotExists();
  
  await ingestFile(path.join(__dirname, '../octaraa-kb-seed.md'), 'octaraa');
  await ingestFile(path.join(__dirname, '../finance_education.md'), 'finance_education');
  
  console.log('Ingestion complete!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
