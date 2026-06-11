import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL as string);

async function main() {
  try {
    const res = await sql`SELECT 1 as num`;
    console.log('Success:', res);
  } catch (err: any) {
    console.error('Neon Error:', err);
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
  }
}
main();
