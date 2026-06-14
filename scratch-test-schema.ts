import 'dotenv/config';
import { sql } from './src/lib/db';

async function test() {
  const res = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles';
  `;
  console.log(res);
}
test();
