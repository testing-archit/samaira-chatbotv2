import { sql } from '../src/lib/db';
async function run() {
  const messages = await sql`SELECT * FROM messages ORDER BY created_at DESC LIMIT 10`;
  console.log(messages);
  process.exit(0);
}
run();
