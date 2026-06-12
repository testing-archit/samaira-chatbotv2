import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const limitParam = searchParams.get('limit');
    const beforeParam = searchParams.get('before');

    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Verify the session belongs to the user
    const sessions = await sql`SELECT id FROM sessions WHERE id = ${sessionId} AND user_id = ${user.id}`;
    if (sessions.length === 0) {
      return NextResponse.json({ messages: [], hasMore: false });
    }

    let messages;
    if (beforeParam) {
      const beforeDate = new Date(beforeParam);
      messages = await sql`
        SELECT id, role, content, tool_calls, created_at 
        FROM messages 
        WHERE session_id = ${sessionId} AND created_at < ${beforeDate}
        ORDER BY created_at DESC
        LIMIT ${limit + 1}
      `;
    } else {
      messages = await sql`
        SELECT id, role, content, tool_calls, created_at 
        FROM messages 
        WHERE session_id = ${sessionId}
        ORDER BY created_at DESC
        LIMIT ${limit + 1}
      `;
    }

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra message used for hasMore check
    }

    // Reverse to return them in chronological order (oldest first)
    messages.reverse();

    // Map db messages to frontend format
    const formattedMessages = messages.map(msg => {
      let parsedTools = msg.tool_calls;
      if (typeof parsedTools === 'string') {
        try { parsedTools = JSON.parse(parsedTools); } catch(e) { parsedTools = []; }
      }
      
      return {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        toolInvocations: Array.isArray(parsedTools) ? parsedTools : [],
        created_at: msg.created_at,
      };
    });

    return NextResponse.json({ messages: formattedMessages, hasMore });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Verify the session belongs to the user
    const sessions = await sql`SELECT id FROM sessions WHERE id = ${sessionId} AND user_id = ${user.id}`;
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the messages
    await sql`DELETE FROM messages WHERE session_id = ${sessionId}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
