import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function queryAssistantMessages() {
  const sql = postgres(process.env.DATABASE_URL as string);
  const rows = await sql`
    SELECT id, role, content, tool_calls, created_at 
    FROM messages 
    WHERE role = 'assistant'
    ORDER BY created_at DESC 
    LIMIT 3
  `;
  console.log(JSON.stringify(rows, null, 2));
  await sql.end();
}

queryAssistantMessages().then(() => process.exit(0));
