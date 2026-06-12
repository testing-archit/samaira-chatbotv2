import { config } from 'dotenv';
config({ path: '.env.local' });
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import pLimit from 'p-limit';
import { model } from '../src/lib/model';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const INDEX_NAME = 'octaraa-kb';

function hashContent(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function chunkText(text: string, chunkSize = 1500, chunkOverlap = 200): string[] {
  const cleaned = text.replace(/([^\n])\n([^\n])/g, '$1 $2').replace(/\s+/g, ' ').trim();
  const chunks: string[] = [];
  let i = 0;
  
  while (i < cleaned.length) {
    let end = i + chunkSize;
    if (end < cleaned.length) {
      const lastSpace = cleaned.lastIndexOf(' ', end);
      if (lastSpace > i) {
        end = lastSpace;
      }
    }
    chunks.push(cleaned.slice(i, end).trim());
    i = end - chunkOverlap;
    if (i <= 0 || (end - chunkOverlap) <= i && i !== 0) {
       i = end;
    }
  }
  return chunks;
}

async function ingestPdf(filePath: string, kbType: string) {
  console.log(`\n📄 Extracting text from ${filePath}...`);
  const dataBuffer = fs.readFileSync(filePath);
  
  try {
    const data = await pdfParse(dataBuffer);
    const content = data.text;
    console.log(`✅ Extracted ${content.length} characters. Chunking...`);
    
    const chunks = chunkText(content);
    console.log(`🔪 Created ${chunks.length} chunks.`);

    const index = pc.Index(INDEX_NAME);
    let newChunks = 0;

    // Concurrency limit for embedding API
    const limit = pLimit(10);
    
    // Batch upserts to Pinecone
    const batchSize = 50;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      process.stdout.write(`Embedding batch ${i / batchSize + 1}... `);
      
      const vectors = await Promise.all(batchChunks.map((chunk) => limit(async () => {
        if (!chunk || chunk.length < 50) return null;
        try {
          const contentHash = hashContent(chunk);
          const { embedding } = await model.embed(chunk);
          return {
            id: contentHash,
            values: embedding,
            metadata: {
              kb: kbType,
              content: chunk,
              content_hash: contentHash,
              status: 'live',
              title: path.basename(filePath)
            }
          };
        } catch (err) {
          console.error(`\n❌ Error embedding chunk:`, err);
          return null;
        }
      })));

      const validVectors = vectors.filter((v): v is NonNullable<typeof v> => v !== null);
      if (validVectors.length > 0) {
        await index.upsert({ records: validVectors });
        newChunks += validVectors.length;
        process.stdout.write(`Upserted ${validVectors.length} vectors.\n`);
      } else {
        process.stdout.write(`No valid vectors to upsert.\n`);
      }
    }

    console.log(`\n✅ Finished ${filePath}: Ingested ${newChunks} chunks to Pinecone.`);
  } catch (error) {
    console.error(`❌ Error parsing PDF ${filePath}:`, error);
  }
}

async function main() {
  const pdfsDir = path.join(__dirname, '../imp_pdfs');
  
  if (!fs.existsSync(pdfsDir)) {
    console.error(`Directory not found: ${pdfsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(pdfsDir).filter(f => f.endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log(`No PDFs found in ${pdfsDir}`);
    process.exit(0);
  }

  console.log(`Found ${files.length} PDFs to ingest.`);

  for (const file of files) {
    await ingestPdf(path.join(pdfsDir, file), 'finance_education');
  }

  console.log('\n🎉 All PDF ingestion complete!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
