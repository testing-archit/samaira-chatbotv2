import 'dotenv/config';
import { config } from '../src/lib/config';
import postgres from 'postgres';

console.log("URL:", config.DATABASE_URL);

const sql = postgres(config.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 5,
});

async function main() {
  try {
    const res = await sql`SELECT 1`;
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

main();
