import { sql } from './src/lib/db.js';
async function test() {
  try {
    const result = await sql`SELECT 1 as num`;
    console.log("Database connection SUCCESS! Result:", result[0].num);
  } catch (e) {
    console.error("Database connection FAILED!", e);
  } finally {
    process.exit(0);
  }
}
test();
