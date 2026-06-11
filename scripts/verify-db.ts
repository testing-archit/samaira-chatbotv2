import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL as string);

async function main() {
  console.log("Connecting to the live database...");
  
  // Query for the specific FAQ we just ingested
  const results = await sql`
    SELECT id, kb, content 
    FROM knowledge_chunks 
    WHERE content ILIKE '%How does Octaraa''s AI (Samaira AI) help users?%'
    LIMIT 1;
  `;
  
  if (results.length > 0) {
    console.log("✅ SUCCESS: The FAQ is present in the database!");
    console.log("ID:", results[0].id);
    console.log("KB Section:", results[0].kb);
    console.log("Content:", results[0].content);
  } else {
    console.log("❌ ERROR: Could not find the FAQ in the database.");
  }

  // Also get the total count
  const countResult = await sql`SELECT count(*) FROM knowledge_chunks WHERE kb = 'octaraa'`;
  console.log(`Total 'octaraa' chunks in DB: ${countResult[0].count}`);

  process.exit(0);
}

main().catch(err => {
  console.error("Database connection or query failed:", err);
  process.exit(1);
});
