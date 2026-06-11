import { logger } from '@/lib/logger';
import { getSessionUser } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { consent } = await req.json();

    if (typeof consent !== 'boolean') {
      return new Response('consent boolean is required', { status: 400 });
    }

    // Persist consent decision per user
    await sql`
      INSERT INTO user_consents (user_id, profiling_consent, updated_at)
      VALUES (${user.id}, ${consent}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        profiling_consent = EXCLUDED.profiling_consent,
        updated_at = CURRENT_TIMESTAMP
    `;

    logger.info('User profiling consent updated', { user_id: user.id, consent });

    return new Response(JSON.stringify({ success: true, consent }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logger.error('Error in consent route', { error: error.message });
    return new Response('Internal Server Error', { status: 500 });
  }
}
