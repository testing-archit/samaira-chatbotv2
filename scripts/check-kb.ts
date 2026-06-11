import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL as string);

async function main() {
  const results = await sql`
    SELECT kb, count(*) as count
    FROM knowledge_chunks
    GROUP BY kb;
  `;
  console.log(results);
  process.exit(0);
}

main();
