import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { model } from '@/lib/model';

export async function GET(req: Request) {
  try {
    const query = "Samaira AI helps users";
    const { embedding } = await model.embed(query);
    const formattedEmbedding = `[${embedding.join(',')}]`;

    const results = await sql`
      SELECT content, 1 - (embedding <=> ${formattedEmbedding}::vector) as similarity
      FROM knowledge_chunks
      WHERE kb = 'octaraa' AND 1 - (embedding <=> ${formattedEmbedding}::vector) > 0.40
      ORDER BY embedding <=> ${formattedEmbedding}::vector
      LIMIT 3
    `;

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
