import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL as string, { ssl: 'require' });

async function main() {
  await sql`DELETE FROM knowledge_chunks`;
  console.log('Cleared all chunks.');
  process.exit(0);
}
main();
