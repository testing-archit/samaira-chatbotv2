import { config } from 'dotenv';
config({ path: '.env.local' });
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
const pdfParse = require('pdf-parse');
import pLimit from 'p-limit';
import { model } from '../src/lib/model';
import { sql } from '../src/lib/db';

function hashContent(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function chunkText(text: string, chunkSize = 1500, chunkOverlap = 200): string[] {
  // Clean up text: replace single newlines with a space, but preserve double newlines (paragraphs)
  const cleaned = text.replace(/([^\n])\n([^\n])/g, '$1 $2').replace(/\s+/g, ' ').trim();
  
  const chunks: string[] = [];
  let i = 0;
  
  while (i < cleaned.length) {
    let end = i + chunkSize;
    
    // Adjust end to not cut words in half if we're not at the end of the text
    if (end < cleaned.length) {
      const lastSpace = cleaned.lastIndexOf(' ', end);
      if (lastSpace > i) {
        end = lastSpace;
      }
    }
    
    chunks.push(cleaned.slice(i, end).trim());
    i = end - chunkOverlap; // step forward with overlap
    
    // Ensure we don't get stuck in an infinite loop if overlap >= chunk size
    if (i <= 0 || (end - chunkOverlap) <= i && i !== 0) {
       // fallback if something goes wrong
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

    let newChunks = 0;
    let skippedChunks = 0;

    // Concurrency limit of 10 parallel operations to avoid rate limits
    const limit = pLimit(10);
    const tasks = chunks.map((chunk, index) => limit(async () => {
      try {
        if (!chunk || chunk.length < 50) {
          skippedChunks++;
          return; // skip tiny/empty chunks
        }

        const contentHash = hashContent(chunk);
        
        const existing = await sql`SELECT id FROM knowledge_chunks WHERE content_hash = ${contentHash}`;
        if (existing.length > 0) {
          skippedChunks++;
          process.stdout.write('S'); // S for skip
          return;
        }

        const { embedding } = await model.embed(chunk);
        const id = crypto.randomUUID();
        const title = path.basename(filePath);

        await sql`
          INSERT INTO knowledge_chunks (id, kb, content, content_hash, embedding, status, title)
          VALUES (${id}, ${kbType}, ${chunk}, ${contentHash}, ${JSON.stringify(embedding)}, 'live', ${title})
          ON CONFLICT (content_hash) DO NOTHING
        `;
        newChunks++;
        process.stdout.write('.'); // dot for success
      } catch (err) {
        process.stdout.write('E'); // E for error
        // Optionally log detailed error to a file if needed, but we swallow here so the rest continues
      }
    }));

    await Promise.all(tasks);
    console.log(`\n✅ Finished ${filePath}: Ingested ${newChunks} new chunks, skipped ${skippedChunks}.`);
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

  // Use the existing 'finance_education' KB category
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
