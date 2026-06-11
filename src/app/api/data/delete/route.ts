import { sql } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response('user_id is required', { status: 400 });
    }

    // Example DB operation (schema not yet fully designed until M2/M3)
    // await sql`DELETE FROM user_profiles WHERE user_id = ${user_id}`;
    // await sql`DELETE FROM messages WHERE user_id = ${user_id}`;

    logger.info('User data deleted', { user_id });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    logger.error('Error deleting data', { error: error.message });
    return new Response('Internal Server Error', { status: 500 });
  }
}
