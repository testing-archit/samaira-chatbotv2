import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import postgres from 'postgres';
import { model } from '../src/lib/model';

const sql = postgres(process.env.DATABASE_URL as string);

function hashContent(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function chunkMarkdown(markdown: string): string[] {
  // A simple chunking strategy: split on H2
  return markdown.split(/(?=^## )/m).map(s => s.trim()).filter(Boolean);
}

async function ingestFile(filePath: string, kbType: string) {
  console.log(`Ingesting ${filePath} into ${kbType}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const chunks = chunkMarkdown(content);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const contentHash = hashContent(chunk);
    
    const existing = await sql`SELECT id FROM knowledge_chunks WHERE content_hash = ${contentHash}`;
    if (existing.length > 0) {
      console.log(`Chunk ${i} already ingested (hash match). Skipping.`);
      continue;
    }

    console.log(`Embedding chunk ${i}...`);
    const { embedding } = await model.embed(chunk);

    const id = crypto.randomUUID();
    let status = 'live';
    if (chunk.includes('status: coming_soon') || chunk.includes('`coming_soon`')) status = 'coming_soon';
    if (chunk.includes('status: unconfirmed') || chunk.includes('`unconfirmed`')) status = 'unconfirmed';

    await sql`
      INSERT INTO knowledge_chunks (id, kb, content, content_hash, embedding, status)
      VALUES (${id}, ${kbType}, ${chunk}, ${contentHash}, ${JSON.stringify(embedding)}, ${status})
      ON CONFLICT (content_hash) DO NOTHING
    `;
    console.log(`Ingested chunk ${i}.`);
  }
}

async function main() {
  await ingestFile(path.join(__dirname, '../octaraa-kb-seed.md'), 'octaraa');
  await ingestFile(path.join(__dirname, '../finance_education.md'), 'finance_education');
  console.log('Ingestion complete!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
