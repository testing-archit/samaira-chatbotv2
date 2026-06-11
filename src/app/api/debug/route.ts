import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { model } from '@/lib/model';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  // Debug endpoint — restrict to authenticated users only
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
