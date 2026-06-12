import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const preferredRegion = 'bom1';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, rating, text } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
    }

    // Verify the user owns the message by joining with sessions
    const checkOwnership = await sql`
      SELECT m.id 
      FROM messages m
      JOIN sessions s ON m.session_id = s.id
      WHERE m.id = ${messageId} AND s.user_id = ${user.id}
    `;

    if (checkOwnership.length === 0) {
      return NextResponse.json({ error: 'Unauthorized or message not found' }, { status: 403 });
    }

    // Update the message feedback
    if (rating !== undefined && text !== undefined) {
      await sql`
        UPDATE messages 
        SET feedback_rating = ${rating}, feedback_text = ${text}
        WHERE id = ${messageId}
      `;
    } else if (rating !== undefined) {
      await sql`
        UPDATE messages 
        SET feedback_rating = ${rating}
        WHERE id = ${messageId}
      `;
    } else if (text !== undefined) {
      await sql`
        UPDATE messages 
        SET feedback_text = ${text}
        WHERE id = ${messageId}
      `;
    } else {
      return NextResponse.json({ error: 'No rating or text provided' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
