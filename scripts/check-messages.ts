import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL as string);

async function main() {
  const results = await sql`
    SELECT role, content, tool_calls, created_at
    FROM messages
    ORDER BY created_at DESC
    LIMIT 5;
  `;
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

main();
