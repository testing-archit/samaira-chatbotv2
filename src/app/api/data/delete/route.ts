import { sql } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getSessionUser } from '@/lib/auth';

export async function POST(_req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Hard-delete all profile and message data for the authenticated user
    await sql`DELETE FROM messages WHERE session_id IN (
      SELECT id FROM sessions WHERE user_id = ${user.id}
    )`;
    await sql`DELETE FROM sessions WHERE user_id = ${user.id}`;
    await sql`DELETE FROM user_profiles WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = ${user.id}
    )`;
    await sql`DELETE FROM profiles WHERE user_id = ${user.id}`;

    logger.info('User data deleted (DPDP request)', { user_id: user.id });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logger.error('Error deleting user data', { error: error.message });
    return new Response('Internal Server Error', { status: 500 });
  }
}
