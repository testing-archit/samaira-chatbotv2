import { sql } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { user_id, consent } = await req.json();

    if (!user_id || typeof consent !== 'boolean') {
      return new Response('user_id and consent boolean are required', { status: 400 });
    }

    // Example DB operation (schema not yet fully designed until M2/M3)
    // await sql`INSERT INTO user_consents (user_id, profiled) VALUES (${user_id}, ${consent}) ON CONFLICT (user_id) DO UPDATE SET profiled = EXCLUDED.profiled`;

    logger.info('User profiling consent updated', { user_id, consent });

    return new Response(JSON.stringify({ success: true, consent }), { status: 200 });
  } catch (error: any) {
    logger.error('Error in consent route', { error: error.message });
    return new Response('Internal Server Error', { status: 500 });
  }
}
